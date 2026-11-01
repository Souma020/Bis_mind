const dns = require('dns');
try {
    dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) { }

const app = require('./backend/app');
const { PORT } = require('./backend/config/env');
const { connectDB } = require('./database/init');
const { seedDatabase } = require('./database/seed');
const { Standard } = require('./database/models');

async function startServer() {
    try {
        await connectDB();

        const count = await Standard.countDocuments();
        if (count === 0) {
            console.log('Database empty. Running initial database seed...');
            await seedDatabase();
        }
    } catch (err) {
        console.error('Error during MongoDB initialization/seed:', err.message);
    }

    const server = app.listen(PORT, () => {

        console.log(`🇮🇳 Know Your BIS - AI Compliance & Standards Platform`);

        console.log(`Database: MongoDB (Mongoose)`);
        console.log(`Server running at: http://localhost:${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`API Health Check: http://localhost:${PORT}/api/health`);

    });

    return server;
}

const serverPromise = startServer();

module.exports = serverPromise;
