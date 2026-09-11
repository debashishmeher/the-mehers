// config/redis.js
const { createClient } = require("redis");

const redisClient = createClient({
    url: process.env.REDIS_URL || "redis://127.0.0.1:6379/2",
});

redisClient.on("error", (err) => {
    console.error("Redis error:", err);
});

redisClient.on("connect", () => { });

const connectRedis = async () => {
    if (!redisClient.isOpen) {
        await redisClient.connect();
    }
};

module.exports = {
    redisClient,
    connectRedis,
};