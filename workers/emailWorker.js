const { Worker } = require("bullmq");
const IORedis = require("ioredis");
const { sendOtpEmail } = require("../utils/email");

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

const connection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
});

const worker = new Worker(
    "emailQueue",
    async (job) => {
        console.log("Processing email job:", job.name, job.id);

        const { type, payload } = job.data;

        if (type === "OTP") {
            await sendOtpEmail(payload.user, payload.otp);
        }

        if (type === "WELCOME") {
            // await sendWelcomeEmail(payload.user);
        }

        console.log("Email sent:", type);
    },
    { connection }
);

worker.on("ready", () => {
    console.log("Email worker ready and waiting for jobs...");
});

worker.on("completed", (job) => {
    console.log("Job completed:", job.id);
});

worker.on("failed", (job, err) => {
    console.error("Job failed:", job.id, err.message);
});

worker.on("error", (err) => {
    console.error("Worker error:", err.message);
});

module.exports = worker;
