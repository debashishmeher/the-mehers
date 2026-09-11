const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, "../config.env") });

const { Worker } = require("bullmq");
const IORedis = require("ioredis");
const { sendOtpEmail, sendWelcomeEmail } = require("../utils/email");

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379/1";

const connection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
});

const worker = new Worker(
    "emailQueue",
    async (job) => {
        const { type, payload } = job.data;

        if (type === "OTP") {
            await sendOtpEmail(payload.user, payload.otp);
        }

        if (type === "WELCOME") {
            await sendWelcomeEmail(payload.user);
        }
    },
    { connection }
);

worker.on("ready", () => {});

worker.on("completed", () => {});

worker.on("failed", (job, err) => {
    console.error("Job failed:", job.id, err.message);
});

worker.on("error", (err) => {
    console.error("Worker error:", err.message);
});

module.exports = worker;