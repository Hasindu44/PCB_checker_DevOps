const { randomUUID } = require('node:crypto');
const path = require('node:path');
const express = require('express');
const multer = require('multer');
const { pool } = require('../db');
const { drcEngineUrl, drcEngineTimeoutMs } = require('../config');
const { requireUser } = require('../require-user');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024, files: 1, fields: 2 },
  fileFilter: (_req, file, callback) => {
    if (path.extname(file.originalname).toLowerCase() !== '.zip') {
      return callback(new Error('Upload a .zip archive.'));
    }
    return callback(null, true);
  },
});

function parseJson(value, fallback = []) {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

function parseObject(value, fallback = {}) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value;
  if (typeof value !== 'string') return fallback;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

async function saveJob({ userId, fileName, profile, result }) {
  const errors = parseJson(result.errors);
  const warnings = parseJson(result.warnings);
  const board = parseObject(result.board);
  const status = ['PASS', 'WARN', 'FAIL', 'ERROR'].includes(result.status) ? result.status : 'ERROR';
  const totalErrors = errors.filter((error) => error?.severity !== 'warning').length;
  const totalWarnings = errors.filter((error) => error?.severity === 'warning').length;
  const analysisMode = result.analysis_mode === 'KICAD' ? 'KICAD' : 'GERBER';
  const id = randomUUID();
  const { rows } = await pool.query(
    `INSERT INTO drc_jobs (id, user_id, filename, profile_id, profile_name, status, total_errors, total_warnings, errors, warnings, board, analysis_mode)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb, $11::jsonb, $12)
     RETURNING id, filename, profile_id, profile_name, status, total_errors, total_warnings, errors, warnings, board, analysis_mode, created_at`,
    [id, userId, fileName, profile?.id || null, profile?.name || 'KiCad project rules', status, totalErrors, totalWarnings, JSON.stringify(errors), JSON.stringify(warnings), JSON.stringify(board), analysisMode]
  );
  return rows[0];
}

router.get('/profiles', requireUser, async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, description, min_trace_width AS "minTraceWidth",
              min_clearance AS "minClearance", min_annular_ring AS "minAnnularRing", is_default AS "isDefault"
       FROM drc_profiles ORDER BY is_default DESC, name ASC`
    );
    return res.json(rows);
  } catch (error) {
    return next(error);
  }
});

router.post('/validate', requireUser, upload.single('file'), async (req, res, next) => {
  if (!req.file) return res.status(400).json({ message: 'Choose a ZIP archive to upload.' });
  const analysisMode = String(req.body.analysisMode || 'GERBER').toUpperCase();
  if (!['GERBER', 'KICAD'].includes(analysisMode)) return res.status(400).json({ message: 'Choose GERBER or KICAD analysis mode.' });
  if (analysisMode === 'GERBER' && (!req.body.profileId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(req.body.profileId))) {
    return res.status(400).json({ message: 'Choose a valid manufacturing profile.' });
  }

  try {
    let profile = { id: null, name: 'KiCad project rules', min_trace_width: 0.2, min_clearance: 0.2, min_annular_ring: 0 };
    if (analysisMode === 'GERBER') {
      const { rows } = await pool.query(
        `SELECT id, name, min_trace_width, min_clearance, min_annular_ring
         FROM drc_profiles WHERE id = $1`,
        [req.body.profileId]
      );
      profile = rows[0];
      if (!profile) return res.status(404).json({ message: 'Manufacturing profile not found.' });
    }

    const form = new FormData();
    form.append('file', new Blob([new Uint8Array(req.file.buffer)], { type: 'application/zip' }), req.file.originalname);
    form.append('min_trace_width', String(profile.min_trace_width));
    form.append('min_clearance', String(profile.min_clearance));
    form.append('min_annular_ring', String(profile.min_annular_ring));
    form.append('analysis_mode', analysisMode);

    let engineResponse;
    let engineResult;
    try {
      engineResponse = await fetch(`${drcEngineUrl.replace(/\/$/, '')}/validate`, {
        method: 'POST',
        body: form,
        signal: AbortSignal.timeout(drcEngineTimeoutMs),
      });
      engineResult = await engineResponse.json().catch(() => ({}));
    } catch (error) {
      const message = error.name === 'TimeoutError'
        ? 'PCB processing timed out. Try a smaller archive.'
        : 'PCB processing service is unavailable.';
      const job = await saveJob({
        userId: req.user.id,
        fileName: req.file.originalname,
        profile,
        result: { status: 'ERROR', analysis_mode: analysisMode, errors: [{ rule: 'PROCESSING_ERROR', message }], warnings: [] },
      });
      return res.status(503).json({ ...job, errors: [{ rule: 'PROCESSING_ERROR', message }], message });
    }

    if (!engineResponse.ok) {
      const message = typeof engineResult.detail === 'string'
        ? engineResult.detail
        : 'The archive could not be processed.';
      const job = await saveJob({
        userId: req.user.id,
        fileName: req.file.originalname,
        profile,
        result: { status: 'ERROR', analysis_mode: analysisMode, errors: [{ rule: 'PROCESSING_ERROR', message }], warnings: [] },
      });
      return res.status(engineResponse.status >= 500 ? 502 : engineResponse.status).json({ ...job, message });
    }

    const job = await saveJob({
      userId: req.user.id,
      fileName: req.file.originalname,
      profile,
      result: engineResult,
    });
    return res.status(201).json(job);
  } catch (error) {
    return next(error);
  }
});

router.get('/jobs', requireUser, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, filename, profile_id, profile_name, status, total_errors, total_warnings, errors, warnings, analysis_mode, created_at
       FROM drc_jobs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    );
    return res.json(rows);
  } catch (error) {
    return next(error);
  }
});

router.get('/jobs/:jobId', requireUser, async (req, res, next) => {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(req.params.jobId)) {
    return res.status(400).json({ message: 'Choose a valid DRC job.' });
  }
  try {
    const { rows } = await pool.query(
      `SELECT id, filename, profile_id, profile_name, status, total_errors, total_warnings, errors, warnings, board, analysis_mode, created_at
       FROM drc_jobs WHERE id = $1 AND user_id = $2`,
      [req.params.jobId, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'DRC job not found.' });
    return res.json(rows[0]);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
