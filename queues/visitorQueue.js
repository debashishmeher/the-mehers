const { Queue } = require("bullmq");
const visitorQueue = new Queue("visitorQueue")

module.exports = visitorQueue;