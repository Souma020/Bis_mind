const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

module.exports = {
    PORT: process.env.PORT || 3000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
    OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || 'google/gemini-3.5-flash-lite',
    PREFERRED_AI_PROVIDER: process.env.PREFERRED_AI_PROVIDER || 'auto',
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/know_your_bis',
    CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
    LOG_LEVEL: process.env.LOG_LEVEL || 'info'
};
