# Squack

<p align="center">
  <img src="https://img.shields.io/badge/Squack-Workspace%20Monorepo-0f172a?style=for-the-badge&logo=github&logoColor=white" alt="Squack workspace monorepo badge" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Backend-NestJS%20%2B%20GraphQL-ea580c?style=flat-square&logo=nestjs&logoColor=white" alt="Backend stack badge" />
  <img src="https://img.shields.io/badge/Frontend-React%20%2B%20Vite-0891b2?style=flat-square&logo=react&logoColor=white" alt="Frontend stack badge" />
  <img src="https://img.shields.io/badge/Database-Prisma-2d3748?style=flat-square&logo=prisma&logoColor=white" alt="Database badge" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178c6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript badge" />
  <img src="https://img.shields.io/badge/Workspaces-npm%20monorepo-cb3837?style=flat-square&logo=npm&logoColor=white" alt="Workspaces badge" />
</p>

<p align="center">
  A full-stack social app monorepo built with NestJS, Prisma, React, and Vite.
</p>

<p align="center">
  Workspace-based development keeps the backend and frontend independent while still living in one repo.
</p>

## What Is Inside

- Backend API with NestJS, GraphQL, Socket.IO, Prisma, and PostgreSQL/SQLite-ready configuration
- Frontend web app with React, Vite, Apollo Client, React Router, and Zustand
- Workspace structure for future shared packages

## Project Structure

```text
squack/
├── apps/
│   ├── backend/
│   └── frontend/
├── packages/
├── docker-compose.yml
└── package.json
```

## Tech Stack

- **Backend:** NestJS, GraphQL, Apollo Server, Prisma, Socket.IO
- **Frontend:** React, Vite, Apollo Client, React Router, Zustand
- **Tooling:** TypeScript, ESLint, Prettier, Jest

## Getting Started

### Install Dependencies

From the repository root:

```bash
npm install
```

### Run the Backend

```bash
cd apps/backend
npm run start:dev
```

### Run the Frontend

```bash
cd apps/frontend
npm run dev
```

## Useful Scripts

### Backend

- `npm run build` - build the NestJS app
- `npm run start:dev` - run the backend in watch mode
- `npm run lint` - lint backend files
- `npm run test` - run unit tests
- `npm run test:e2e` - run end-to-end tests

### Frontend

- `npm run dev` - start the Vite dev server
- `npm run build` - type-check and build the app
- `npm run lint` - lint frontend files
- `npm run preview` - preview the production build

## Environment

Backend environment variables live in `apps/backend/.env`.

Example:

```env
DATABASE_URL="file:./dev.db"
```

## Notes

- The repository uses npm workspaces defined in the root `package.json`.
- Keep generated files, local dependencies, logs, and environment files out of Git.
- If you want this README expanded with app screenshots, API docs, or deployment steps, add those sections as the project stabilizes.