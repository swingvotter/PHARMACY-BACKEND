const redis = require("redis");

const redisClient = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: 17638,
    reconnectStrategy: (retries) => Math.min(retries * 50, 1000), // Auto-reconnect
  },
  password: process.env.REDIS_PASSWORD,
});

redisClient.on("error", (err) => {
  console.error("❌ Redis error:", err);
});

redisClient.on("connect", () => {
  console.log("✅ Connected to Redis Cloud");
});

redisClient.on("end", () => {
  console.warn("⚠️ Redis connection closed");
});

redisClient
  .connect()
  .catch((err) => console.error("❌ Redis connection error:", err));

module.exports = redisClient;
