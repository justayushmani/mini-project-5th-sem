import crypto from 'crypto';
import 'dotenv/config';

/**
 * Environment configuration with validation.
 * All env vars are validated at startup — the app will fail fast
 * if required variables are missing.
 */

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name, defaultValue) {
  return process.env[name] || defaultValue;
}

const env = {
  // Core
  nodeEnv: optionalEnv('NODE_ENV', 'development'),
  port: parseInt(optionalEnv('PORT', '5000'), 10),
  isDev: optionalEnv('NODE_ENV', 'development') === 'development',
  isProd: optionalEnv('NODE_ENV', 'development') === 'production',

  // Database — required
  databaseUrl: requireEnv('DATABASE_URL'),

  // Auth
  jwtSecret: optionalEnv('JWT_SECRET', crypto.randomBytes(32).toString('hex')),
  jwtExpiresIn: optionalEnv('JWT_EXPIRES_IN', '7d'),

  // Frontend
  frontendUrl: optionalEnv('FRONTEND_URL', 'http://localhost:5173'),

  // Groq AI — optional until Phase 7
  groqApiKey: optionalEnv('GROQ_API_KEY', ''),
  groqModel: optionalEnv('GROQ_MODEL', 'llama-3.3-70b-versatile'),

  // Qdrant — optional until Phase 9
  qdrantUrl: optionalEnv('QDRANT_URL', ''),
  qdrantApiKey: optionalEnv('QDRANT_API_KEY', ''),
  qdrantCollection: optionalEnv('QDRANT_COLLECTION', 'yojana_schemes'),
};

export default env;
