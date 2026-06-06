# Squack Backend

The backend is a NestJS service that exposes Squack's REST, GraphQL, and
Socket.IO interfaces. It uses Prisma with SQLite for persistence.

## Responsibilities

- Account registration, authentication, and JWT authorization
- User profiles and follow relationships
- Tweet creation, retrieval, and interactions
- Direct messages and real-time delivery
- Notifications and real-time updates
- Input validation, request throttling, CORS, and security headers

## Running

Squack is intended to run through Docker Compose. From the repository root:

```bash
JWT_SECRET="replace-with-a-long-random-secret" docker compose up --build
```

The backend is available at `http://localhost:3000`. Prisma migrations run
when its container starts, and SQLite data is stored in the `squack-data`
volume.

## Verification

Run the complete project checks from the repository root:

```bash
npm run check
```

See the root [README](../../README.md) for setup and
[ARCHITECTURE.md](../../ARCHITECTURE.md) for the full module and data-flow
documentation.
