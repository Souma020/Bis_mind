const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true, unique: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    target_audience: { type: String, default: '' },
    key_steps: { type: [String], default: [] },
    portal_url: { type: String, required: true },
    is_mandatory_available: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Service', serviceSchema);
