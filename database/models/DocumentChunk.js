const mongoose = require('mongoose');

const documentChunkSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    document_id: { type: String, required: true, index: true },
    chunk_index: { type: Number, required: true },
    content: { type: String, required: true },
    is_number: { type: String, default: null, index: true },
    clause_no: { type: String, default: null },
    clause_title: { type: String, default: null },
    keywords: { type: String, default: '' },
    doc_title: { type: String, default: '' },
    document_type: { type: String, default: 'standard_spec' },
    source_name: { type: String, default: 'Bureau of Indian Standards' },
    source_url: { type: String, default: 'https://www.bis.gov.in/' },
    embedding: { type: [Number], default: [] },
    created_at: { type: Date, default: Date.now }
});

// Text index for keyword and content search
documentChunkSchema.index({
    content: 'text',
    keywords: 'text'
});

module.exports = mongoose.model('DocumentChunk', documentChunkSchema);
