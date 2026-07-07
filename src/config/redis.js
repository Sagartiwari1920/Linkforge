require("dotenv").config();
const redis = require("redis");

const redisClient = redis.createClient({
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
        // Retry connecting instead of giving up after a dropped/idle connection
        reconnectStrategy: (retries) => Math.min(retries * 100, 3000)
    }
});

// CRITICAL: without this listener, any connection error (dropped/idle
// connection, network blip, etc.) crashes the entire Node process,
// since an unhandled "error" event on an EventEmitter throws.
redisClient.on("error", (err) => {
    console.error("Redis client error:", err.message);
});

redisClient.on("reconnecting", () => {
    console.log("Redis client reconnecting...");
});

module.exports = redisClient;
