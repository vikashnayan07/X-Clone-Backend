"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const redis = process.env.REDIS_URI
    ? new ioredis_1.default(process.env.REDIS_URI, {
        enableOfflineQueue: false,
        maxRetriesPerRequest: 1,
        lazyConnect: true,
    })
    : null;
redis === null || redis === void 0 ? void 0 : redis.on("error", (error) => {
    console.warn(`Redis unavailable: ${error.message}`);
});
function safeRedis(fallback, action) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!redis)
            return fallback;
        try {
            if (redis.status === "wait")
                yield redis.connect();
            return yield action();
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "unknown error";
            console.warn(`Redis command skipped: ${message}`);
            return fallback;
        }
    });
}
exports.redisClient = {
    get: (key) => safeRedis(null, () => redis.get(key)),
    set: (key, value) => safeRedis(null, () => redis.set(key, value)),
    setex: (key, seconds, value) => safeRedis(null, () => redis.setex(key, seconds, value)),
    del: (key) => safeRedis(0, () => redis.del(key)),
};
