import Redis from "ioredis";

const redis = process.env.REDIS_URI
  ? new Redis(process.env.REDIS_URI, {
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    })
  : null;

redis?.on("error", (error) => {
  console.warn(`Redis unavailable: ${error.message}`);
});

async function safeRedis<T>(fallback: T, action: () => Promise<T>) {
  if (!redis) return fallback;

  try {
    if (redis.status === "wait") await redis.connect();
    return await action();
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    console.warn(`Redis command skipped: ${message}`);
    return fallback;
  }
}

export const redisClient = {
  get: (key: string) => safeRedis<string | null>(null, () => redis!.get(key)),
  set: (key: string, value: string) =>
    safeRedis<"OK" | null>(null, () => redis!.set(key, value)),
  setex: (key: string, seconds: number, value: string | number) =>
    safeRedis<"OK" | null>(null, () => redis!.setex(key, seconds, value)),
  del: (key: string) => safeRedis<number>(0, () => redis!.del(key)),
};
