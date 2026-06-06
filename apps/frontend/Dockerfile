FROM node:22-bookworm-slim AS build
WORKDIR /app

ARG VITE_API_URL=http://localhost:3000
ARG VITE_GRAPHQL_URL=http://localhost:3000/graphql
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GRAPHQL_URL=$VITE_GRAPHQL_URL

COPY package.json package-lock.json ./
COPY patches patches
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json
RUN npm ci

COPY apps/frontend apps/frontend
RUN npm run build --workspace=apps/frontend

FROM nginx:1.28-alpine
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html
EXPOSE 80
