const mongoose = require('mongoose');
const dns = require('dns');
const { Resolver } = dns.promises;
const { MONGODB_URI } = require('../backend/config/env');

// Set public DNS servers at process level
try {
    dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
    if (typeof dns.setDefaultResultOrder === 'function') {
        dns.setDefaultResultOrder('ipv4first');
    }
} catch (e) {}

let isConnected = false;

/**
 * Resolves MongoDB Atlas mongodb+srv:// using public DNS (Google 8.8.8.8 / Cloudflare 1.1.1.1)
 * Converts it to a direct mongodb:// replica set string to bypass local Windows/ISP SRV blocks.
 */
async function resolveAtlasSrv(uri) {
    if (!uri || !uri.startsWith('mongodb+srv://')) {
        return uri;
    }

    try {
        const resolver = new Resolver();
        resolver.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

        // Parse URI
        const parsed = new URL(uri.replace('mongodb+srv://', 'http://'));
        const hostname = parsed.hostname;
        const srvHost = `_mongodb._tcp.${hostname}`;

        // Resolve SRV records
        const srvRecords = await resolver.resolveSrv(srvHost);
        if (!srvRecords || srvRecords.length === 0) {
            return uri;
        }

        const hostList = srvRecords.map(r => `${r.name}:${r.port}`).join(',');

        // Resolve TXT records for replica set options
        let txtParams = [];
        try {
            const txtRecords = await resolver.resolveTxt(hostname);
            if (txtRecords && txtRecords.length > 0) {
                txtParams = txtRecords.flat();
            }
        } catch (_) {}

        // Combine query options
        const searchParams = new URLSearchParams(parsed.search ? parsed.search.slice(1) : '');
        txtParams.forEach(param => {
            const [k, v] = param.split('=');
            if (k && v && !searchParams.has(k)) {
                searchParams.set(k, v);
            }
        });

        if (!searchParams.has('ssl') && !searchParams.has('tls')) {
            searchParams.set('ssl', 'true');
        }
        if (!searchParams.has('authSource')) {
            searchParams.set('authSource', 'admin');
        }

        const user = parsed.username ? decodeURIComponent(parsed.username) : '';
        const pass = parsed.password ? decodeURIComponent(parsed.password) : '';
        const authPart = user ? `${encodeURIComponent(user)}:${encodeURIComponent(pass)}@` : '';
        const pathname = parsed.pathname || '/know_your_bis';

        const directUri = `mongodb://${authPart}${hostList}${pathname}?${searchParams.toString()}`;
        return directUri;
    } catch (err) {
        console.warn('Could not manually resolve Atlas SRV records:', err.message);
        return uri;
    }
}

async function connectDB(customUri = null) {
    if (isConnected && mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    let uri = customUri || MONGODB_URI || 'mongodb://localhost:27017/know_your_bis';

    try {
        mongoose.set('strictQuery', true);
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 20000,
            autoIndex: true
        });

        isConnected = true;
        console.log(`Connected to MongoDB successfully: ${uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')}`);
        return mongoose.connection;
    } catch (err) {
        // Fallback for querySrv ECONNREFUSED on Windows
        if (uri.startsWith('mongodb+srv://') && (err.message.includes('querySrv') || err.message.includes('ECONNREFUSED'))) {
            console.log('Detected querySrv ECONNREFUSED from local DNS. Resolving Atlas replica set via Google Public DNS (8.8.8.8)...');
            try {
                const directUri = await resolveAtlasSrv(uri);
                if (directUri !== uri) {
                    await mongoose.connect(directUri, {
                        serverSelectionTimeoutMS: 20000,
                        autoIndex: true
                    });
                    isConnected = true;
                    console.log('Connected to MongoDB Atlas successfully via direct replica set fallback!');
                    return mongoose.connection;
                }
            } catch (fallbackErr) {
                console.error('Fallback Atlas connection failed:', fallbackErr.message);
            }
        }

        isConnected = false;
        console.error('Failed to connect to MongoDB:', err.message);
        throw err;
    }
}

async function disconnectDB() {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
        isConnected = false;
        console.log('MongoDB connection closed.');
    }
}

function getConnection() {
    return mongoose.connection;
}

module.exports = {
    connectDB,
    disconnectDB,
    getConnection
};
