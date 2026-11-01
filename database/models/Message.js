const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    conversation_id: { type: String, required: true, index: true },
    sender: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true },
    confidence_score: { type: Number, default: 1.0 },
    citations: { type: [mongoose.Schema.Types.Mixed], default: [] },
    follow_up_questions: { type: [String], default: [] },
    llm_provider: { type: mongoose.Schema.Types.Mixed, default: null },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);
