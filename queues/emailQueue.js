const { Queue } = require("bullmq");
// const { redisClient } = require("../config/redis");

const emailQueue = new Queue("emailQueue")


module.exports = emailQueue;