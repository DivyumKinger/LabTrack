const redis = require('redis');
require('dotenv').config();

let redisClient;

const initializeRedis = async () => {
  // Create the client
  redisClient = redis.createClient({
    url: process.env.REDIS_URL
  });

  // Attach listeners
  redisClient.on('connect', () => {
    console.log('Connected to Redis successfully!');
  });

  redisClient.on('error', (err) => {
    console.error('Redis connection error:', err);
  });

  // Await the connection
  try {
    await redisClient.connect();
  } catch (err) {
    console.error('Failed to connect to Redis:', err);
    // Exit the process if Redis connection fails, as caching is critical
    process.exit(1);
  }
};

const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call initializeRedis() first.');
  }
  return redisClient;
};

module.exports = { initializeRedis, getRedisClient };