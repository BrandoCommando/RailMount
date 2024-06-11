const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

/**
 * Set constants from environment variables
 *
 * @constant  {string}  CORS_WHITELIST  Allowed CORS domains, comma-separated
 */
const CORS_WHITELIST = process.env.CORS_WHITELIST;

// Set CORS policy
const whitelist = CORS_WHITELIST ? CORS_WHITELIST.split(' ') : null;

const corsOpts = {
  origin: (origin, cb) => {
    // Allow if origin domain is in the whitelist or there is no whitelist
    if (!whitelist || whitelist.includes(origin)) {
      cb(null, true);
    } else {
      cb(new Error('Not allowed by CORS: ' + origin));
    }
  }
};

const allowCrossDomain = (req, res, next) => {
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,Content-Type,Content-Length,Is-Job,No-Job,Allow-Job,Send-Total');

  try {
  var origin = req.headers.origin || req.headers.host;
  if (!!origin && (!whitelist || whitelist.includes(origin))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', true);
  }
  } catch(e) {
    console.error("Bad origin?", e);
  }

  if (req.method === 'OPTIONS') {
    res.status(200).end();
  } else {
    next();
  }
};

// Set rate limit
const limiterOpts = {
  windowMs: 3 * 60 * 1000, // 3 minutes
  max: async(req,res) => {
    if(req.path.startsWith('/job')||req.headers['Allow-Job']||req.path.startsWith('/job/')) return 500; // for job checks, limit to 500
    return 50; // limit each IP to 50 requests per windowMs
  }
};


module.exports = [
  allowCrossDomain,
  cors(corsOpts),
  rateLimit(limiterOpts)
];
