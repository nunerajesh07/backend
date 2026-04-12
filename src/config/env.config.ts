import dotenv from 'dotenv';
import path from 'path';

const cwd = path.resolve(process.cwd());

// Do not read NODE_ENV before loading files: a shell may set NODE_ENV=production and skip server/.env,
// which breaks local CORS and DB settings. Use override so server/.env wins for typical `npm run dev`.
if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: path.join(cwd, '.env.test'), override: true });
} else if (process.env.NODE_ENV === 'production') {
  // Render / other hosts inject secrets via process.env — never override them with a local file
  dotenv.config({ path: path.join(cwd, '.env.production') });
} else {
  const dev = dotenv.config({ path: path.join(cwd, '.env'), override: true });
  if (dev.error || !process.env.MONGODB_URI?.trim()) {
    dotenv.config({ path: path.join(cwd, '.env.test'), override: true });
  }
}

const nodeEnv = process.env.NODE_ENV || 'development';

interface Config {
  port: number;
  mongoUri: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  /** Comma-separated in CORS_ORIGIN. Also allow any http(s)://localhost or 127.0.0.1 (any port) for local dev. */
  corsOrigins: string[];
  nodeEnv: string;
}

const corsFromEnv = process.env.CORS_ORIGIN?.trim();
const corsOrigins =
  corsFromEnv?.split(',').map((o) => o.trim()).filter(Boolean) ?? [];

const config: Config = {
  port: parseInt(process.env.PORT || '5001', 10),
  mongoUri: process.env.MONGODB_URI as string,
  jwtSecret: process.env.JWT_SECRET as string,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN as string,
  corsOrigins,
  nodeEnv
};

const requiredKeys: (keyof Config)[] = ['port', 'mongoUri', 'jwtSecret', 'jwtExpiresIn', 'corsOrigins'];

for (const key of requiredKeys) {
  const value = config[key];
  if (key === 'corsOrigins' && Array.isArray(value) && value.length === 0) {
    throw new Error('Missing or empty required environment variable: CORS_ORIGIN');
  } else if (key !== 'corsOrigins' && !value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export default config;
