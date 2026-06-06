# Squack Frontend

The frontend is a React and TypeScript single-page application built with
Vite. It communicates with the backend through REST, GraphQL, and Socket.IO.

## Responsibilities

- Authentication and protected routing
- Feed, profile, follow, and tweet interfaces
- Direct messaging
- Notification display
- Real-time updates through Socket.IO
- Shared client state with Zustand

## Running

Squack is intended to run through Docker Compose. From the repository root:

```bash
JWT_SECRET="replace-with-a-long-random-secret" docker compose up --build
```

The frontend is available at `http://localhost:5173`.

## Configuration

The production image receives its backend endpoints at build time through
`VITE_API_URL` and `VITE_GRAPHQL_URL`. Docker Compose provides defaults for
local use.

See the root [README](../../README.md) for setup and
[ARCHITECTURE.md](../../ARCHITECTURE.md) for the full component and data-flow
documentation.
