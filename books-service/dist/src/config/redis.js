"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeRedis = exports.getRedisClient = exports.connectRedis = void 0;
const redis_1 = require("redis");
const logger_1 = __importDefault(require("../utils/logger"));
const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';
let redisClient = null;
const connectRedis = async () => {
    try {
        redisClient = (0, redis_1.createClient)({
            url: REDIS_URL,
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 10) {
                        logger_1.default.error('Redis: Too many reconnection attempts, giving up');
                        return new Error('Too many retries');
                    }
                    return Math.min(retries * 100, 3000);
                },
            },
        });
        redisClient.on('error', (err) => {
            logger_1.default.error('Redis Client Error:', err);
        });
        redisClient.on('connect', () => {
            logger_1.default.info('📦 Redis connected successfully');
        });
        redisClient.on('ready', () => {
            logger_1.default.info('✅ Redis client ready');
        });
        await redisClient.connect();
        return redisClient;
    }
    catch (error) {
        logger_1.default.error('Failed to connect to Redis:', error.message);
        logger_1.default.warn('⚠️  Running without Redis cache - API calls will not be cached');
        return null;
    }
};
exports.connectRedis = connectRedis;
const getRedisClient = () => {
    return redisClient;
};
exports.getRedisClient = getRedisClient;
const closeRedis = async () => {
    if (redisClient && redisClient.isOpen) {
        await redisClient.quit();
        logger_1.default.info('Redis connection closed');
    }
};
exports.closeRedis = closeRedis;
