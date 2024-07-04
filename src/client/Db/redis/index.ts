import Redis from "ioredis";

export const redisClient = new Redis(
  "rediss://default:AcjEAAIncDE5YTcwZDM1ZTEzYjY0Y2MzOWEyNzEyZWUzYzc3MGNmNHAxNTEzOTY@adapted-fish-51396.upstash.io:6379"
);
