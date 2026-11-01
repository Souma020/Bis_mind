const express = require('express');
const router = express.Router();
const ragEngine = require('../services/ragEngine');
const dbService = require('../services/dbService');
const { normalizeLanguage } = require('../config/languages');

// POST /api/chat - Main AI Chat endpoint
router.post('/chat', async (req, res, next) => {
    try {
        const { message, conversationId, language } = req.body;
        const lang = normalizeLanguage(language);

        if (!message || message.trim().length === 0) {
            return res.status(400).json({ error: 'Message field is required.' });
        }

        let convId = conversationId;

        // Auto-create or ensure conversation in DB
        if (!convId) {
            const newConv = await dbService.createConversation();
            convId = newConv.id;
        } else {
            await dbService.ensureConversation(convId);
        }

        // Fetch existing history for context
        const historyData = await dbService.getConversationHistory(convId);
        const history = historyData ? historyData.messages : [];

        // Process through RAG Pipeline
        const result = await ragEngine.processQuery({
            conversationId: convId,
            query: message.trim(),
            conversationHistory: history,
            language: lang
        });

        res.json({
            conversationId: convId,
            messageId: result.messageId,
            answer: result.answer,
            confidenceScore: result.confidenceScore,
            citations: result.citations,
            followUpQuestions: result.followUpQuestions,
            intent: result.intent,
            llmProvider: result.llmProvider,
            language: lang,
            languageFallback: result.languageFallback
        });
    } catch (err) {
        next(err);
    }
});

// GET /api/chat/:conversationId - Get history
router.get('/chat/:conversationId', async (req, res, next) => {
    try {
        const { conversationId } = req.params;
        const history = await dbService.getConversationHistory(conversationId);
        if (!history) {
            return res.status(404).json({ error: 'Conversation not found.' });
        }
        res.json(history);
    } catch (err) {
        next(err);
    }
});

// DELETE /api/chat/:conversationId - Clear chat
router.delete('/chat/:conversationId', async (req, res, next) => {
    try {
        const { conversationId } = req.params;
        await dbService.clearConversation(conversationId);
        res.json({ success: true, message: 'Conversation history cleared.' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
