# Squack

Squack is a TypeScript social application with a NestJS, GraphQL, Socket.IO, and Prisma backend plus a React and Vite frontend.

## Requirements

- Node.js 22
- npm 10 or newer
- Docker and Docker Compose, optionally

## Local setup

1. Install dependencies:

   ```bash
   npm ci
   ```

2. Create the backend environment file :

   ```bash
   cp apps/backend/.env.example apps/backend/.env
   ```
   *** dont forget to configure you database
   
3. Generate Prisma Client and apply migrations:

   ```bash
   npm run prisma:generate --workspace=apps/backend
   npm run prisma:migrate --workspace=apps/backend
   ```

4. Optionally create the local test account. Its password is `password123`:

   ```bash
   npm run prisma:seed --workspace=apps/backend
   ```

5. Start each application in a separate terminal:

   ```bash
   npm run start:dev --workspace=apps/backend
   npm run dev --workspace=apps/frontend
   ```

The frontend runs at `http://localhost:5173` and the backend at `http://localhost:3000`.

## Environment

Backend variables are documented in [apps/backend/.env.example](apps/backend/.env.example). Production deployments must set a strong `JWT_SECRET` and explicit `CORS_ORIGINS`.

Frontend API endpoints can be configured with:

- `VITE_API_URL`
- `VITE_GRAPHQL_URL`

## Checks

Run the complete verification suite from the repository root:

```bash
npm run check
```

Individual commands are also available:

```bash
npm run lint
npm run build
npm test
npm run test:e2e
```

## Docker

Start the production-style backend and frontend containers with:

```bash
JWT_SECRET="replace-with-a-long-random-secret" docker compose up --build
```

SQLite data is stored in the named `squack-data` volume. Local `.db` files are intentionally ignored and are not committed.
