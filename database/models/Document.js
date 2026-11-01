const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    source_id: { type: String, default: null },
    title: { type: String, required: true },
    document_type: { type: String, required: true }, // 'standard_spec', 'qco_order', 'lab_guideline', 'scheme_doc'
    is_number: { type: String, default: null },
    year: { type: Number, default: null },
    category: { type: String, default: null },
    content: { type: String, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Document', documentSchema);
