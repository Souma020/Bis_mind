const mongoose = require('mongoose');

const sourceSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    url: { type: String, required: true, unique: true },
    type: { type: String, required: true }, // 'official_portal', 'qco_notification', 'standards_catalog', 'lab_directory'
    publisher: { type: String, default: 'Bureau of Indian Standards' },
    trust_tier: { type: Number, default: 1 }, // 1: Official Govt/BIS, 2: Accredited Lab, 3: General
    last_fetched_at: { type: Date, default: Date.now },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Source', sourceSchema);
