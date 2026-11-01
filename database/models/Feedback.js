const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    message_id: { type: String, default: null },
    query_text: { type: String, default: null },
    rating: { type: Number, enum: [1, -1], required: true },
    comments: { type: String, default: null },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Feedback', feedbackSchema);
