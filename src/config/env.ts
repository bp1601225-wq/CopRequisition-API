import dotenv from 'dotenv';

dotenv.config();

const requireEnv = (key: string): string => {
  const value = process.env[key]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

const port = Number.parseInt(process.env.PORT ?? '3000', 10);

export const env = {
  port: Number.isNaN(port) ? 3000 : port,
  nodeEnv: process.env.NODE_ENV ?? 'development',
  databaseUrl: requireEnv('DATABASE_URL'),
  jwtSecret: requireEnv('JWT_SECRET'),
  jwtExpiresIn: requireEnv('JWT_EXPIRES_IN'),
  adminName: process.env.ADMIN_NAME ?? 'System Admin',
  adminEmail: process.env.ADMIN_EMAIL ?? 'admin@company.com',
  adminPassword: process.env.ADMIN_PASSWORD ?? 'ChangeMe123!',
};

export const isProduction = env.nodeEnv === 'production';
