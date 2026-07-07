const validator = (req, res, next) => {
    const { originalUrl } = req.body;

    if (!originalUrl) {
        return res.status(400).json({
            success: false,
            error: "URL is mandatory"
        });
    }

    try {
        const url = new URL(originalUrl);
        if (url.protocol !== "http:" && url.protocol !== "https:") {
            return res.status(400).json({
                success: false,
                error: "Only HTTP/HTTPS URLs are allowed"
            });
        }
        next();
    } catch (err) {
        return res.status(400).json({
            success: false,
            error: "Invalid URL format"
        });
    }
};

module.exports = validator;