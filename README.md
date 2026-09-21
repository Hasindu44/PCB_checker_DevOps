# CircuitGuard frontend prototype

A frontend-only React and Tailwind prototype for a PCB quality workspace. It includes a responsive login, a browser-persisted demo session, sign out, and drag-and-drop ZIP selection.

## Run locally

```sh
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>. Enter any valid email and a password containing at least six characters.

> The login is intentionally client-side only. It is useful for UI development, but production authentication will require a backend identity service and secure sessions.
