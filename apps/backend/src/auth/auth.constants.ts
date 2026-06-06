const secret = process.env.JWT_SECRET;

if (!secret && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable is required in production');
}

const configuredExpiry = Number(process.env.JWT_EXPIRES_IN_SECONDS ?? 3600);

if (!Number.isInteger(configuredExpiry) || configuredExpiry < 60) {
  throw new Error('JWT_EXPIRES_IN_SECONDS must be an integer of at least 60');
}

export const jwtSecret = secret ?? 'dev_secret_change_me';
export const jwtExpiresInSeconds = configuredExpiry;
