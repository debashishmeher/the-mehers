const { redisClient } = require("../config/redis");

const setCache = async (key, data, ttl = 300) => {
    await redisClient.set(key, JSON.stringify(data), {
        EX: ttl,
    });
};

const getCache = async (key) => {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
};

const delCache = async (key) => {
    await redisClient.del(key);
};

module.exports = {
    setCache,
    getCache,
    delCache,
};
