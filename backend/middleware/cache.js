const NodeCache = require('node-cache');
const cache = new NodeCache();

exports.cacheMiddleware = (durationInSeconds) => {
    return (req, res, next) => {
        if (req.method !== 'GET') {
            return next();
        }

        const key = req.originalUrl;
        const cachedResponse = cache.get(key);

        if (cachedResponse) {
            console.log(`[Cache Hit] ${key}`);
            return res.json(cachedResponse);
        } else {
            console.log(`[Cache Miss] ${key}`);
            const originalJson = res.json.bind(res);
            res.json = (body) => {
                if (res.statusCode === 200) {
                    cache.set(key, body, durationInSeconds);
                }
                originalJson(body);
            };
            next();
        }
    };
};

exports.clearCache = (prefix) => {
    const keys = cache.keys();
    let cleared = 0;
    for (const key of keys) {
        if (key.includes(prefix)) {
            cache.del(key);
            cleared++;
        }
    }
    console.log(`[Cache Cleared] Removed ${cleared} keys with prefix: ${prefix}`);
};
