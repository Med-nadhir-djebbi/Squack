# Squack

[![CI](https://github.com/Med-nadhir-djebbi/Squack/actions/workflows/ci.yml/badge.svg)](https://github.com/Med-nadhir-djebbi/Squack/actions/workflows/ci.yml)

Squack is a full-stack social platform built with TypeScript. It combines a
NestJS backend, GraphQL API, PostgreSQL database, real-time Socket.IO events,
and a React frontend in one npm workspaces monorepo.

The project demonstrates authenticated APIs, relational data modeling,
cursor-based pagination, threaded replies, image processing, real-time
messaging, automated tests, and containerized deployment.

## Screenshots

### Login

> Screenshot slot: add the login page image at
> `docs/screenshots/login.png`, then replace this note with:
> `![Squack login page](docs/screenshots/login.png)`

### Home

> Screenshot slot: add the home page image at
> `docs/screenshots/home.png`, then replace this note with:
> `![Squack home feed](docs/screenshots/home.png)`

### Messaging

> Screenshot slot: add the messaging page image at
> `docs/screenshots/messaging.png`, then replace this note with:
> `![Squack messaging page](docs/screenshots/messaging.png)`

## Features

- JWT registration, login, and session restoration
- GraphQL API for users, tweets, follows, reactions, and notifications
- Personalized feed based on followed users
- Tweet creation, editing, deletion, and reaction types
- Nested reply threads with collapsible discussions
- Up to four JPEG, PNG, or WebP images per tweet
- Server-side image validation and JPEG conversion with Sharp
- Cursor-based pagination for feeds and conversations
- Real-time private messaging through Socket.IO
- Real-time user notifications
- Profile discovery and follow/unfollow workflows
- PostgreSQL persistence through Prisma ORM
- Request validation, CORS, Helmet, throttling, and authorization guards
- Unit, frontend, and end-to-end tests
- GitHub Actions continuous integration
- Multi-stage Docker builds and persistent Docker volumes

## Tech Stack

| Layer                   | Technologies                                               |
| ----------------------- | ---------------------------------------------------------- |
| Frontend                | React 19, TypeScript, Vite, React Router, Socket.IO Client |
| Backend                 | NestJS 11, Apollo Server, GraphQL, Socket.IO               |
| Data                    | PostgreSQL 17, Prisma ORM                                  |
| Authentication          | Passport, JWT, bcrypt                                      |
| Media                   | Multer, Sharp, static file serving                         |
| Validation and security | class-validator, Helmet, CORS, NestJS Throttler            |
| Testing                 | Jest, Supertest, Vitest                                    |
| Tooling                 | npm workspaces, ESLint, Docker Compose, GitHub Actions     |

## Architecture

```mermaid
flowchart LR
    Browser[React application] -->|GraphQL| API[NestJS backend]
    Browser -->|REST auth and uploads| API
    Browser <-->|Socket.IO| API
    API --> Prisma[Prisma ORM]
    Prisma --> PostgreSQL[(PostgreSQL)]
    API --> Uploads[(Persistent upload volume)]
```

The backend exposes three communication styles:

- **REST** for authentication and multipart image uploads
- **GraphQL** for application queries and mutations
- **Socket.IO** for real-time messages and notifications

Tweet images use a two-step workflow. The frontend first creates the tweet
through GraphQL, then uploads the binary files to
`POST /tweets/:tweetId/images`. The backend validates ownership, converts each
image to JPEG, stores it under `uploads/posts/:tweetId/`, and saves its public
URL in PostgreSQL.

## Repository Structure

```text
.
├── apps/
│   ├── backend/
│   │   ├── prisma/             # Prisma schema, migrations, and seed
│   │   ├── src/
│   │   │   ├── auth/           # JWT authentication
│   │   │   ├── follows/        # Follow relationships
│   │   │   ├── messages/       # Conversations and message gateway
│   │   │   ├── notifications/  # Notifications and real-time delivery
│   │   │   ├── prisma/         # Prisma service
│   │   │   ├── tweets/         # Tweets, replies, reactions, and uploads
│   │   │   └── users/          # User queries and profile updates
│   │   └── test/               # End-to-end tests
│   └── frontend/
│       └── src/                 # React application, styles, and tests
├── docs/
│   └── screenshots/             # README screenshots
├── packages/                    # Shared workspace packages
├── patches/                     # Dependency patches
├── docker-compose.yml
└── package.json                 # Workspace scripts
```

## Run with Docker

Docker is the quickest way to start the complete stack.

### Requirements

- Docker
- Docker Compose

### Start

```bash
JWT_SECRET="replace-with-a-long-random-secret" docker compose up --build
```

Open:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`
- GraphQL endpoint: `http://localhost:3000/graphql`

Docker Compose starts:

1. PostgreSQL 17
2. The NestJS backend after PostgreSQL becomes healthy
3. The production frontend served by Nginx

PostgreSQL data is stored in the `postgres-data` volume. Uploaded images are
stored in the `squack-uploads` volume.

Stop the application while preserving data:

```bash
docker compose down
```

Delete containers and all persisted data:

```bash
docker compose down -v
```

## Local Development

### Requirements

- Node.js 22
- npm 10 or newer
- PostgreSQL

Install dependencies:

```bash
npm ci
```

Create the backend environment file:

```bash
cp apps/backend/.env.example apps/backend/.env
```

Configure at least:

```dotenv
DATABASE_URL="postgresql://user:password@localhost:5432/squack?schema=public"
JWT_SECRET="replace-with-a-long-random-secret"
CORS_ORIGINS="http://localhost:5173"
```

Generate Prisma Client and apply migrations:

```bash
npm run prisma:generate --workspace=apps/backend
npm run prisma:migrate --workspace=apps/backend
```

Start the backend:

```bash
npm run start:dev --workspace=apps/backend
```

Start the frontend in another terminal:

```bash
npm run dev --workspace=apps/frontend
```

## Environment Variables

### Backend

| Variable                 | Purpose                          | Example                                        |
| ------------------------ | -------------------------------- | ---------------------------------------------- |
| `DATABASE_URL`           | PostgreSQL connection string     | `postgresql://user:pass@localhost:5432/squack` |
| `JWT_SECRET`             | Signs and verifies access tokens | Long random secret                             |
| `JWT_EXPIRES_IN_SECONDS` | Access-token lifetime            | `3600`                                         |
| `CORS_ORIGINS`           | Allowed browser origins          | `http://localhost:5173`                        |
| `PORT`                   | Backend HTTP port                | `3000`                                         |

### Frontend

| Variable           | Purpose                        | Default                         |
| ------------------ | ------------------------------ | ------------------------------- |
| `VITE_API_URL`     | REST and Socket.IO backend URL | `http://localhost:3000`         |
| `VITE_GRAPHQL_URL` | GraphQL endpoint               | `http://localhost:3000/graphql` |

## API Overview

### REST

| Method | Endpoint                  | Purpose                               |
| ------ | ------------------------- | ------------------------------------- |
| `POST` | `/auth/register`          | Create an account                     |
| `POST` | `/auth/login`             | Authenticate and receive a JWT        |
| `GET`  | `/auth/me`                | Restore the authenticated session     |
| `POST` | `/tweets/:tweetId/images` | Upload tweet images as multipart data |

The upload endpoint expects up to four files under the multipart field
`images`.

### GraphQL

The GraphQL API includes:

- User discovery and profile updates
- Tweet, feed, and user-tweet queries
- Tweet creation, editing, deletion, replies, and reactions
- Follow and unfollow mutations
- Conversation queries and message sending
- Notification queries and read-state mutations

### Socket.IO

| Namespace        | Events                                       |
| ---------------- | -------------------------------------------- |
| `/messages`      | `message.received`, `message.sent.confirmed` |
| `/notifications` | `notification.received`                      |

Both namespaces authenticate connections with the same JWT used by the HTTP
APIs.

## Testing and Quality

Run the complete verification suite:

```bash
npm run check
```

Run individual checks:

```bash
npm run lint
npm run build
npm run test
npm run test:e2e
npm audit --audit-level=moderate
```

GitHub Actions starts an isolated PostgreSQL service, installs dependencies
with `npm ci`, applies Prisma migrations, and runs the complete verification
suite on every push and pull request.

## License

This project is licensed under the ISC License.
