const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minutes
  max: 3000,                 // limit each IP to 3000 requests per windowMs
  standardHeaders: true,   // Send rate limit info in headers
  legacyHeaders: false,    // Disable `X-RateLimit-*` headers
  message: {
    status: 429,
    message: 'Too many requests, please try again later.',
  },
  handler: (req, res, next) => {
    res.status(429).json({
      status: 429,
      message: 'Too many requests, please try again later.',
    });
  },
});

module.exports = limiter;