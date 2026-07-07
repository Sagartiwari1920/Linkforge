const redisClient = require("../config/redis");

const rateLimiter = async (req, res, next) => {
    try {
        const ip = req.ip;

        const count = await redisClient.incr(ip);

        if ( count===1) {
            await redisClient.expire(ip, 1);
        }

        console.log(
            "count:", count,
            "ttl:", await redisClient.ttl(ip)
        );

        if (count > 10) {
            return res.status(429).json({
                message: "Too many requests! Slow down"
            });
        }

        next();
    } catch (err) {
        next(err);
    }
};

module.exports = rateLimiter;