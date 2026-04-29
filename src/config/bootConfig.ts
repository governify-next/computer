import dotenv from 'dotenv';
import path from 'path';

// Load .env file
const envPath = process.env.GOV_BOOT_ENV_PATH || path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath, quiet: true });

export const bootEnv = {
    // Service configuration
    NODE_ENV: process.env.NODE_ENV || 'development',
    GOV_LOG_LEVEL: process.env.GOV_LOG_LEVEL || 'INFO',
    GOV_SERVICE_NAME: process.env.GOV_SERVICE_NAME || 'computer',
    PORT: process.env.PORT || '5901',

    // Internal service URLs
    COLLECTOR_SERVICE_URL: process.env.COLLECTOR_SERVICE_URL || 'http://localhost:5902',

    // Database URIs
    MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/governify',
    REDIS_URI: process.env.REDIS_URI || 'redis://localhost:6379',

    // JWT configuration
    SERVICE_AUTHENTICATION_ENABLED: process.env.SERVICE_AUTHENTICATION_ENABLED === 'true',
    JWT_SECRET: process.env.JWT_SECRET || 'governify_secret_key',

    // Redis settings
    REDIS_ENABLED: process.env.REDIS_ENABLED === 'true',
    REDIS_MAX_RETRIES: Number(process.env.REDIS_MAX_RETRIES || '5'),
    REDIS_RETRY_DELAY_MS: Number(process.env.REDIS_RETRY_DELAY_MS || '2000'),
    REDIS_SLOW_RECONNECTION_STRATEGY: process.env.REDIS_SLOW_RECONNECTION_STRATEGY === 'true',
    REDIS_SLOW_RECONNECTION_MAX_RETRIES: Number(
        process.env.REDIS_SLOW_RECONNECTION_MAX_RETRIES || '10',
    ),
    REDIS_RETRY_SLOW_DELAY_MS: Number(process.env.REDIS_RETRY_SLOW_DELAY_MS || '10000'),

    // Fetch Result polling configuration
    FETCH_RESULT_POLLING_MAX_ATTEMPTS: Number(
        process.env.FETCH_RESULT_POLLING_MAX_ATTEMPTS || '300',
    ),
    FETCH_RESULT_POLLING_INTERVAL_MS: Number(
        process.env.FETCH_RESULT_POLLING_INTERVAL_MS || '1000',
    ),
};
