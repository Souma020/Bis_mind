const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Standard, DocumentChunk } = require('../../database/models');
const { GEMINI_API_KEY, OPENROUTER_API_KEY } = require('../config/env');
const llmService = require('../services/llmService');

router.get('/health', async (req, res) => {
    try {
        const isConnected = mongoose.connection.readyState === 1;
        let stdCount = 0;
        let chunkCount = 0;

        if (isConnected) {
            stdCount = await Standard.countDocuments();
            chunkCount = await DocumentChunk.countDocuments();
        }

        let aiProviderDesc = 'Offline Grounded Engine';
        if (GEMINI_API_KEY && OPENROUTER_API_KEY) {
            aiProviderDesc = 'Google Gemini + OpenRouter (Dual Provider Failover)';
        } else if (GEMINI_API_KEY) {
            aiProviderDesc = 'Google Gemini API';
        } else if (OPENROUTER_API_KEY) {
            aiProviderDesc = 'OpenRouter API';
        }

        res.json({
            status: isConnected ? 'healthy' : 'degraded',
            application: 'Know Your BIS AI Platform',
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            database: {
                type: 'MongoDB',
                connected: isConnected,
                totalStandards: stdCount,
                totalChunks: chunkCount
            },
            aiProvider: aiProviderDesc
        });
    } catch (err) {
        res.status(500).json({
            status: 'unhealthy',
            error: err.message,
            timestamp: new Date().toISOString()
        });
    }
});

// GET /api/ai-status - Live Quota, Token Usage, and Model Details
router.get('/ai-status', async (req, res) => {
    try {
        const status = await llmService.getAIStatus();
        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            data: status
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message,
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router;
