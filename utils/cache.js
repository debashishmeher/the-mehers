const { redisClient } = require("../config/redis");

const setCache = async (key, data, ttl = 300) => {
    try {
        await redisClient.set(key, JSON.stringify(data), {
            EX: ttl,
        });
    } catch (err) {
        console.warn(`setCache failed for key ${key}:`, err.message);
    }
};

const getCache = async (key) => {
    try {
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
    } catch (err) {
        console.warn(`getCache failed for key ${key}:`, err.message);
        return null;
    }
};

const delCache = async (key) => {
    try {
        await redisClient.del(key);
    } catch (err) {
        console.warn(`delCache failed for key ${key}:`, err.message);
    }
};

module.exports = {
    setCache,
    getCache,
    delCache,
};
