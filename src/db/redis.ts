import { createClient, RedisClientType } from 'redis';
import { getLogger } from '../utils/logger.js';
import { bootEnv } from '../config/bootConfig.js';

const logger = getLogger().setTag('redis.ts');

const REDIS_URI = bootEnv.REDIS_URI;
const REDIS_ENABLED = bootEnv.REDIS_ENABLED;

const MAX_FAST_RETRIES = bootEnv.REDIS_MAX_RETRIES;
const REDIS_RETRY_DELAY_MS = bootEnv.REDIS_RETRY_DELAY_MS;

const REDIS_SLOW_RECONNECTION_MAX_RETRIES = bootEnv.REDIS_SLOW_RECONNECTION_MAX_RETRIES;
const REDIS_SLOW_RECONNECTION_STRATEGY = bootEnv.REDIS_SLOW_RECONNECTION_STRATEGY;
const REDIS_RETRY_SLOW_DELAY_MS = bootEnv.REDIS_RETRY_SLOW_DELAY_MS;

let client: RedisClientType;
export let isConnected = false;
let wasDisconnected = false;

const createRedisClient = () => {
    client = createClient({
        url: REDIS_URI,
        socket: {
            reconnectStrategy: (retries) => {
                if (retries < MAX_FAST_RETRIES) {
                    logger.warn(
                        `Redis fast retry ${retries + 1}/${MAX_FAST_RETRIES} in ${REDIS_RETRY_DELAY_MS}ms`,
                    );
                    return REDIS_RETRY_DELAY_MS;
                }

                if (
                    REDIS_SLOW_RECONNECTION_STRATEGY &&
                    retries < MAX_FAST_RETRIES + REDIS_SLOW_RECONNECTION_MAX_RETRIES
                ) {
                    logger.warn(
                        `Redis slow retry ${retries - MAX_FAST_RETRIES + 1}/${REDIS_SLOW_RECONNECTION_MAX_RETRIES} in ${REDIS_RETRY_SLOW_DELAY_MS}ms`,
                    );
                    return REDIS_RETRY_SLOW_DELAY_MS;
                }

                logger.warn(`Redis retry limit reached. No more retries`);
                return false;
            },
        },
    });

    client.on('connect', () => {
        logger.info(`Connecting to Redis at ${REDIS_URI}`);
    });

    client.on('ready', () => {
        if (wasDisconnected) {
            logger.info(`Redis reconnected at ${REDIS_URI}`);
            wasDisconnected = false;
        } else {
            logger.info(`Redis connected at ${REDIS_URI}`);
        }

        isConnected = true;
    });

    client.on('end', () => {
        logger.warn('Redis connection closed');
        isConnected = false;
        wasDisconnected = true;
    });

    client.on('reconnecting', () => {
        logger.warn('Redis reconnecting...');
        isConnected = false;
        wasDisconnected = true;
    });

    client.on('error', (err) => {
        logger.debug('Redis error:', err);
    });
};

export const connectRedis = async () => {
    if (!REDIS_ENABLED) {
        logger.warn('Redis disabled. Using in-memory fallback');
        return;
    }

    createRedisClient();

    try {
        await client.connect();
    } catch (err) {
        logger.debug('Redis connection failed', err);
    }
};

// Cache helpers ----------------------------------------
export const setCache = async (key: string, value: unknown, ttl = 300) => {
    if (!isConnected) return;
    try {
        await client.set(key, JSON.stringify(value), { EX: ttl });
    } catch (err) {
        logger.error(`Error setting redis cache (${key}):`, err);
    }
};

export const getCache = async <T = unknown>(key: string): Promise<T | null> => {
    if (!isConnected) return null;
    try {
        const value = await client.get(key);
        return value ? JSON.parse(value) : null;
    } catch (err) {
        logger.error(`Error getting redis cache (${key}):`, err);
        return null;
    }
};

export const delCache = async (key: string) => {
    if (!isConnected) return;
    try {
        await client.del(key);
    } catch (err) {
        logger.error(`Error deleting redis cache (${key}):`, err);
    }
};

export const clearByPattern = async (pattern: string) => {
    if (!isConnected) return;
    try {
        const keys = await client.keys(pattern);
        if (keys.length) {
            await Promise.all(keys.map((k) => client.del(k)));
        }
    } catch (err) {
        logger.error(`Error clearing redis cache by pattern (${pattern}):`, err);
    }
};

export const getByPattern = async <T = unknown>(pattern: string): Promise<T[]> => {
    if (!isConnected) return [];
    try {
        const keys = await client.keys(pattern);
        const values = await Promise.all(keys.map((k) => client.get(k)));
        return values.filter(Boolean).map((v) => JSON.parse(v as string));
    } catch (err) {
        logger.error(`Error getting redis cache by pattern (${pattern}):`, err);
        return [];
    }
};
