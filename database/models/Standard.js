const mongoose = require('mongoose');

const clauseSchema = new mongoose.Schema({
    clauseNo: { type: String, required: true },
    title: { type: String, required: true },
    text: { type: String, required: true },
    criticality: { type: String }
}, { _id: false });

const standardSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    is_number: { type: String, required: true, unique: true, index: true },
    year: { type: Number, required: true },
    title: { type: String, required: true },
    category: { type: String, required: true, index: true },
    department: { type: String, default: 'General Department' },
    is_mandatory: { type: Boolean, default: false, index: true },
    qco_order: { type: String, default: null },
    qco_notification_date: { type: String, default: null },
    enforcing_ministry: { type: String, default: null },
    scope: { type: String, required: true },
    testing_requirements: { type: [String], default: [] },
    clauses: { type: [clauseSchema], default: [] },
    scheme: { type: String, required: true },
    official_url: { type: String, required: true },
    lab_capabilities: { type: [String], default: [] },
    created_at: { type: Date, default: Date.now }
});

// Text index for search
standardSchema.index({
    is_number: 'text',
    title: 'text',
    scope: 'text',
    category: 'text'
});

module.exports = mongoose.model('Standard', standardSchema);
