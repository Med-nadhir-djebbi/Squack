const secret = process.env.JWT_SECRET;

if (!secret && process.env.NODE_ENV === 'production') {
	throw new Error('JWT_SECRET environment variable is required in production');
}

export const jwtSecret = secret ?? 'dev_secret';
