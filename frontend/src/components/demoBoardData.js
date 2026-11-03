// Realistic demo PCB board for previewing the interactive viewer and analysis workbench
export const DEMO_JOB = {
  id: 'demo-smartsensor-x23',
  filename: 'SmartSensor-X_v2.3_Fabrication_Gerber.zip',
  serial_number: 'SN: SSX-23-045812',
  batch_info: 'Batch: 1200 / Shift: A / Line: 3',
  profile_id: '00000000-0000-4000-8000-000000000001',
  profile_name: 'Standard fabrication (0.20 mm)',
  status: 'FAIL',
  total_errors: 6,
  operator: 'Michael Johnson',
  created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  warnings: [
    'RS-274X copper geometry evaluated against standard fabrication tolerances (0.20mm min trace / 0.20mm clearance).',
    '3 high-risk copper bridges detected in high-density trace routing near U1 microcontroller pads.'
  ],
  board: {
    width: 80,
    height: 55,
    origin_x: 0,
    top_y: 55,
    padding: 3.5,
    truncated: false,
    layers: [
      {
        name: 'Top_Copper (F.Cu)',
        color: '#10b981', // Organic copper/jade green
        paths: [
          // MCU chip outline & pads (center at x=38, y=28) - 24-QFN footprint
          // Pins top row
          'M 28 38 h 2.2 v 1.2 h -2.2 Z M 31.5 38 h 2.2 v 1.2 h -2.2 Z M 35 38 h 2.2 v 1.2 h -2.2 Z M 38.5 38 h 2.2 v 1.2 h -2.2 Z M 42 38 h 2.2 v 1.2 h -2.2 Z M 45.5 38 h 2.2 v 1.2 h -2.2 Z',
          // Pins bottom row
          'M 28 17 h 2.2 v 1.2 h -2.2 Z M 31.5 17 h 2.2 v 1.2 h -2.2 Z M 35 17 h 2.2 v 1.2 h -2.2 Z M 38.5 17 h 2.2 v 1.2 h -2.2 Z M 42 17 h 2.2 v 1.2 h -2.2 Z M 45.5 17 h 2.2 v 1.2 h -2.2 Z',
          // Pins left column
          'M 25 21 h 1.2 v 2.2 h -1.2 Z M 25 24.5 h 1.2 v 2.2 h -1.2 Z M 25 28 h 1.2 v 2.2 h -1.2 Z M 25 31.5 h 1.2 v 2.2 h -1.2 Z',
          // Pins right column
          'M 49.5 21 h 1.2 v 2.2 h -1.2 Z M 49.5 24.5 h 1.2 v 2.2 h -1.2 Z M 49.5 28 h 1.2 v 2.2 h -1.2 Z M 49.5 31.5 h 1.2 v 2.2 h -1.2 Z',
          // MCU central exposed ground pad (E-Pad)
          'M 30.5 21.5 h 15 v 13 h -15 Z',
          // Power regulation zone (left side: USB Type-C & LDO, x=6..20, y=32..48)
          'M 8 40 h 8 v 6 h -8 Z M 7 48 h 4 v 3 h -4 Z M 13 48 h 4 v 3 h -4 Z',
          'M 10 33 h 3.5 v 2.2 h -3.5 Z M 15 33 h 3.5 v 2.2 h -3.5 Z',
          // Passive components pads (0805 / 0603 caps C1, C2, C9, R1, R2)
          'M 20 28 h 2 v 1 h -2 Z M 23 28 h 2 v 1 h -2 Z',
          'M 20 24 h 2 v 1 h -2 Z M 23 24 h 2 v 1 h -2 Z',
          'M 20 20 h 2 v 1 h -2 Z M 23 20 h 2 v 1 h -2 Z',
          'M 54 28 h 2 v 1 h -2 Z M 57 28 h 2 v 1 h -2 Z',
          'M 54 24 h 2 v 1 h -2 Z M 57 24 h 2 v 1 h -2 Z',
          'M 54 36 h 2.5 v 1.2 h -2.5 Z M 58 36 h 2.5 v 1.2 h -2.5 Z',
          // Header pins 2x6 connector right side (J1)
          'M 68 15 h 3 v 3 h -3 Z M 73 15 h 3 v 3 h -3 Z M 68 20 h 3 v 3 h -3 Z M 73 20 h 3 v 3 h -3 Z M 68 25 h 3 v 3 h -3 Z M 73 25 h 3 v 3 h -3 Z M 68 30 h 3 v 3 h -3 Z M 73 30 h 3 v 3 h -3 Z M 68 35 h 3 v 3 h -3 Z M 73 35 h 3 v 3 h -3 Z M 68 40 h 3 v 3 h -3 Z M 73 40 h 3 v 3 h -3 Z',
          // Top signal traces
          'M 12 40 L 12 36 L 20 36 L 20 29',
          'M 16 40 L 16 38 L 29 38',
          'M 29.1 39.2 L 29.1 44 L 20 44 L 20 50',
          // Clearance violation area 1 (x=32.6, y=41.2): 2 parallel traces dangerously close (0.12mm)
          'M 32.6 39.2 L 32.6 47 L 35 47 L 35 51',
          'M 32.72 39.2 L 32.72 47.1 L 37 47.1 L 37 51',
          // Trace width violation area 2 (x=46.8, y=39.5): narrow neckdown
          'M 46.8 39.2 L 46.8 45 L 52 45',
          'M 52 45 L 68 41.5',
          'M 50.7 28 L 54 28',
          'M 59 28 L 64 28 L 68 26.5',
          'M 50.7 24.5 L 54 24.5',
          'M 59 24.5 L 68 21.5',
          // Bottom routing traces
          'M 29 17 L 29 11 L 36 11 L 36 6',
          // Clearance violation area 3 (x=36.12, y=9.8): traces converging
          'M 32.5 17 L 32.5 10 L 36.15 10 L 40 6',
          'M 36.27 10 L 36.27 15 L 43 15',
          'M 46.5 17 L 46.5 12 L 55 12 L 55 8 L 68 16.5',
          // Test pads / circular pads
          'M 12 18 m -2 0 a 2 2 0 1 0 4 0 a 2 2 0 1 0 -4 0',
          'M 18 18 m -2 0 a 2 2 0 1 0 4 0 a 2 2 0 1 0 -4 0',
          'M 24 14 m -2 0 a 2 2 0 1 0 4 0 a 2 2 0 1 0 -4 0',
          'M 60 48 m -2 0 a 2 2 0 1 0 4 0 a 2 2 0 1 0 -4 0',
          // Mounting holes with copper annular ring (4 corners)
          'M 6 6 m -3.5 0 a 3.5 3.5 0 1 0 7 0 a 3.5 3.5 0 1 0 -7 0',
          'M 74 6 m -3.5 0 a 3.5 3.5 0 1 0 7 0 a 3.5 3.5 0 1 0 -7 0',
          'M 6 49 m -3.5 0 a 3.5 3.5 0 1 0 7 0 a 3.5 3.5 0 1 0 -7 0',
          'M 74 49 m -3.5 0 a 3.5 3.5 0 1 0 7 0 a 3.5 3.5 0 1 0 -7 0',
        ]
      },
      {
        name: 'Bottom_Copper (B.Cu)',
        color: '#3b82f6', // Cadence Royal Blue
        paths: [
          // Ground pour cross-hatch or solid copper islands
          'M 4 4 H 76 V 51 H 4 Z',
          // Isolation cutouts around vias and top pads
          'M 12 18 m -3.5 0 a 3.5 3.5 0 1 0 7 0 a 3.5 3.5 0 1 0 -7 0',
          'M 18 18 m -3.5 0 a 3.5 3.5 0 1 0 7 0 a 3.5 3.5 0 1 0 -7 0',
          // Bottom signal traces
          'M 10 48 L 10 22 L 15 22',
          'M 14 48 L 14 26 L 24 26',
          'M 38 17 L 38 6 L 50 6 L 68 31.5',
          'M 42 17 L 42 8 L 52 8 L 68 36.5',
          // Annular ring violation pad (x=24.0, y=14.0): drill hole nearly breaks out
          'M 24 14 m -1.6 0 a 1.6 1.6 0 1 0 3.2 0 a 1.6 1.6 0 1 0 -3.2 0',
        ]
      },
      {
        name: 'Silkscreen (F.SilkS)',
        color: '#f8fafc', // Clean white silkscreen
        paths: [
          // MCU border box
          'M 23 15 h 30 v 26 h -30 Z',
          // Connector border
          'M 66 12 h 11 v 31 h -11 Z',
          // Voltage regulator box
          'M 6 30 h 16 v 20 h -16 Z'
        ]
      }
    ]
  },
  errors: [
    {
      rule: 'TRACE_CLEARANCE',
      component: 'C9',
      message: 'Copper clearance is 0.120 mm; minimum required is 0.200 mm.',
      coordinates: { x: 32.66, y: 43.15 },
      severity: 'CRITICAL',
      layer: 'Top_Copper (F.Cu)',
      measured: 0.120,
      limit: 0.200,
      count: 12,
      lastSeen: '17.05.2025',
      impact: 'High risk of solder bridge short circuit during wave or reflow soldering.'
    },
    {
      rule: 'TRACE_CLEARANCE',
      component: 'U1 Pin 8',
      message: 'Copper clearance is 0.125 mm; minimum required is 0.200 mm.',
      coordinates: { x: 36.21, y: 10.10 },
      severity: 'CRITICAL',
      layer: 'Top_Copper (F.Cu)',
      measured: 0.125,
      limit: 0.200,
      count: 6,
      lastSeen: '18.05.2025',
      impact: 'Violates IPC-2221 spacing between high-speed digital and DC rail traces.'
    },
    {
      rule: 'MIN_TRACE_WIDTH',
      component: 'Net SPI_SCK',
      message: 'Trace width is 0.140 mm; minimum required is 0.200 mm.',
      coordinates: { x: 46.80, y: 42.10 },
      severity: 'CRITICAL',
      layer: 'Top_Copper (F.Cu)',
      measured: 0.140,
      limit: 0.200,
      count: 4,
      lastSeen: '19.05.2025',
      impact: 'Risk of trace over-etching or open-circuit failure during acid bath etching.'
    },
    {
      rule: 'TRACE_CLEARANCE',
      component: 'R1 / C2',
      message: 'Copper clearance is 0.155 mm; minimum required is 0.200 mm.',
      coordinates: { x: 20.10, y: 35.80 },
      severity: 'WARNING',
      layer: 'Top_Copper (F.Cu)',
      measured: 0.155,
      limit: 0.200,
      count: 2,
      lastSeen: '19.05.2025',
      impact: 'Close tolerance neck-down near voltage regulator output.'
    },
    {
      rule: 'MIN_TRACE_WIDTH',
      component: 'J1 Pin 12',
      message: 'Trace width is 0.165 mm; minimum required is 0.200 mm.',
      coordinates: { x: 61.50, y: 41.50 },
      severity: 'WARNING',
      layer: 'Top_Copper (F.Cu)',
      measured: 0.165,
      limit: 0.200,
      count: 2,
      lastSeen: '20.05.2025',
      impact: 'Narrow neckdown trace connecting header pin 12 to SPI bus.'
    },
    {
      rule: 'ANNULAR_RING',
      component: 'Via #44',
      message: 'Annular ring is 0.080 mm; minimum required is 0.150 mm.',
      coordinates: { x: 24.00, y: 14.00 },
      severity: 'CRITICAL',
      layer: 'Bottom_Copper (B.Cu)',
      measured: 0.080,
      limit: 0.150,
      count: 1,
      lastSeen: '20.05.2025',
      impact: 'Drill hit wander may cause pad breakout, breaking via barrel connectivity.'
    }
  ]
};

export const PAST_DEMO_JOBS = [
  DEMO_JOB,
  {
    id: 'job-iot-beacon-04',
    filename: 'IoT_Beacon_Nordic52840_Gerber.zip',
    serial_number: 'SN: IOT-94-118204',
    batch_info: 'Batch: 1198 / Shift: B / Line: 1',
    profile_id: '00000000-0000-4000-8000-000000000001',
    profile_name: 'Standard fabrication (0.20 mm)',
    status: 'PASS',
    total_errors: 0,
    operator: 'Michael Johnson',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    warnings: [],
    board: {
      width: 45,
      height: 35,
      origin_x: 0,
      top_y: 35,
      padding: 2,
      layers: [
        { name: 'Top_Copper (F.Cu)', color: '#10b981', paths: ['M 5 5 h 35 v 25 h -35 Z'] }
      ]
    },
    errors: []
  },
  {
    id: 'job-power-shield-02',
    filename: 'USB_C_PowerDelivery_Shield_RevB.zip',
    serial_number: 'SN: PWR-22-990412',
    batch_info: 'Batch: 1195 / Shift: A / Line: 2',
    profile_id: '00000000-0000-4000-8000-000000000001',
    profile_name: 'Standard fabrication (0.20 mm)',
    status: 'FAIL',
    total_errors: 3,
    operator: 'Sarah Jenkins',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
    warnings: ['Copper clearance warnings around 20V VBUS thermal relief pads.'],
    board: {
      width: 60,
      height: 40,
      origin_x: 0,
      top_y: 40,
      padding: 2.5,
      layers: [
        { name: 'Top_Copper (F.Cu)', color: '#10b981', paths: ['M 4 4 h 52 v 32 h -52 Z'] }
      ]
    },
    errors: [
      {
        rule: 'TRACE_CLEARANCE',
        component: 'VBUS Pour',
        message: 'Copper clearance is 0.160 mm; minimum is 0.200 mm.',
        coordinates: { x: 15.2, y: 22.4 },
        severity: 'WARNING',
        measured: 0.160,
        limit: 0.200
      }
    ]
  }
];
