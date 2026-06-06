import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

const defaultOrigins = ['http://localhost:5173'];

export function getAllowedOrigins(): string[] {
  return (process.env.CORS_ORIGINS ?? defaultOrigins.join(','))
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function getCorsOptions(): CorsOptions {
  const allowedOrigins = getAllowedOrigins();

  return {
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Origin is not allowed by CORS'), false);
    },
    credentials: true,
  };
}
