const { createClient } = require('redis');

const redisClient = createClient({
  legacyMode: true, // needed for compatibility with rate-limit-redis
  url: 'redis://localhost:6379', // or your cloud Redis URL
});

redisClient.on('error', (err) => console.error('Redis Error:', err));

(async () => {
  await redisClient.connect();
})();

module.exports = redisClient;