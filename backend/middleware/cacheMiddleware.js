const { getRedisClient } = require('../database/redisConnector');

const cacheMiddleware = (durationInSeconds) => {
  return async (req, res, next) => {
    const redisClient = getRedisClient();
    const key = `__express__${req.originalUrl || req.url}`; // Unique key for each URL

    try {
      // 1. Check if data for this key is in the cache
      const cachedData = await redisClient.get(key);

      if (cachedData) {
        // 2. If cache hit, send the cached data and end the request
        console.log(`Cache HIT for ${key}`);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('X-Cache', 'HIT');
        return res.send(JSON.parse(cachedData));
      }

      // 3. If cache miss, proceed to the route handler
      console.log(`Cache MISS for ${key}`);
      res.setHeader('X-Cache', 'MISS');

      // Monkey-patch res.send to intercept the response
      const originalSend = res.send.bind(res);
      res.send = (body) => {
        try {
          // 4. Cache the response data before sending it
          redisClient.set(key, JSON.stringify(body), {
            EX: durationInSeconds, // Set expiration
            NX: false, // Set if not exists - we overwrite here, so false
          });
          console.log(`Cached data for ${key} for ${durationInSeconds} seconds.`);
        } catch (cacheError) {
          console.error('Error saving to cache:', cacheError);
        }
        // Call the original send function to send the response to the client
        originalSend(body);
      };

      next();
    } catch (err) {
      console.error('Cache middleware error:', err);
      // If there's an error with Redis, just proceed without caching
      next();
    }
  };
};

module.exports = cacheMiddleware;
