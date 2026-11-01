const crypto = require('crypto');
const {
    Standard,
    Service,
    DocumentChunk,
    Conversation,
    Message,
    Feedback
} = require('../../database/models');

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Matches "IS 1786", "IS1786", "IS: 1786", "IS 1786 (Part 1)" etc. by their numeric part,
// so a query for "IS 1786" finds the standard however the number is spelled in the data.
function isNumberRegex(raw) {
    const m = String(raw || '').match(/(\d{2,6})/);
    if (!m) return new RegExp(`^${escapeRegex(String(raw || '').trim())}$`, 'i');
    return new RegExp(`^\\s*IS\\s*:?\\s*${m[1]}(?!\\d)`, 'i');
}

class DBService {
    // Standards Queries
    async getAllStandards(category, search) {
        const query = {};

        if (category && category !== 'All') {
            query.category = category;
        }

        if (search && search.trim().length > 0) {
            const regex = new RegExp(escapeRegex(search.trim()), 'i');
            query.$or = [
                { is_number: regex },
                { title: regex },
                { scope: regex }
            ];
        }

        const rows = await Standard.find(query)
            .sort({ is_mandatory: -1, is_number: 1 })
            .lean();

        return rows.map(r => this._parseStandardRow(r));
    }

    async getStandardByIdOrNumber(idOrNumber) {
        if (!idOrNumber) return null;

        const term = idOrNumber.trim();
        const termClean = term.replace(/\s+/g, '');
        const regexExact = new RegExp(`^${escapeRegex(term)}$`, 'i');
        const regexClean = new RegExp(`^${escapeRegex(termClean)}$`, 'i');

        let row = await Standard.findOne({
            $or: [
                { id: term },
                { is_number: regexExact },
                { is_number: regexClean }
            ]
        }).lean();

        // Part-number / spacing tolerant fallback: "IS 1786 (Part 1)" -> "IS 1786"
        if (!row && /\d{2,6}/.test(term)) {
            row = await Standard.findOne({ is_number: isNumberRegex(term) }).lean();
        }

        return row ? this._parseStandardRow(row) : null;
    }

    // Services Queries
    async getAllServices() {
        const rows = await Service.find().sort({ name: 1 }).lean();
        return rows.map(r => ({
            id: r.id,
            name: r.name,
            category: r.category,
            description: r.description,
            target_audience: r.target_audience,
            key_steps: r.key_steps || [],
            portal_url: r.portal_url,
            is_mandatory_available: Boolean(r.is_mandatory_available),
            created_at: r.created_at
        }));
    }

    async getServiceById(id) {
        const row = await Service.findOne({ id }).lean();
        if (!row) return null;
        return {
            id: row.id,
            name: row.name,
            category: row.category,
            description: row.description,
            target_audience: row.target_audience,
            key_steps: row.key_steps || [],
            portal_url: row.portal_url,
            is_mandatory_available: Boolean(row.is_mandatory_available),
            created_at: row.created_at
        };
    }

    // Hybrid Keyword & Semantic Retrieval for RAG
    async searchDocumentChunks(queryTerms, isNumberFilter = null, limit = 6) {
        const terms = (queryTerms || []).filter(Boolean);
        const numberRe = isNumberFilter ? isNumberRegex(isNumberFilter) : null;
        const termConditions = terms.map(term => {
            const termRegex = new RegExp(escapeRegex(term), 'i');
            return { $or: [{ content: termRegex }, { keywords: termRegex }] };
        });

        // Candidate pool: chunks of the named standard, plus chunks matching any term.
        const pool = [];
        if (numberRe) pool.push({ is_number: numberRe });
        if (termConditions.length) pool.push({ $or: termConditions });
        if (pool.length === 0) return [];

        const rows = await DocumentChunk.find(pool.length === 1 ? pool[0] : { $or: pool }).limit(60).lean();

        // Relevance = share of query terms found in the chunk (+ bonus for the exact IS number).
        const scored = rows.map(c => {
            const hay = `${c.content || ''} ${c.keywords || ''}`.toLowerCase();
            const hits = terms.filter(t => hay.includes(t.toLowerCase())).length;
            const termScore = terms.length ? hits / terms.length : 0;
            const numberHit = numberRe && c.is_number && numberRe.test(c.is_number) ? 1 : 0;
            return { c, relevance: Math.min(1, termScore * 0.7 + numberHit * 0.5 + (hits > 0 && numberHit ? 0.1 : 0)) };
        }).filter(x => x.relevance > 0);

        scored.sort((a, b) => b.relevance - a.relevance);

        // No unrelated "top chunks" fallback: nothing relevant means no evidence.
        return scored.slice(0, limit).map(({ c, relevance }) => ({
            ...c,
            relevance,
            doc_title: c.doc_title || '',
            document_type: c.document_type || 'standard_spec',
            source_name: c.source_name || 'Bureau of Indian Standards',
            source_url: c.source_url || 'https://www.bis.gov.in/'
        }));
    }

    async saveChunkEmbedding(chunkId, embedding) {
        if (!chunkId || !Array.isArray(embedding) || embedding.length === 0) return;
        try {
            await DocumentChunk.updateOne({ id: chunkId }, { $set: { embedding } });
        } catch (e) { /* best effort cache */ }
    }

    // Conversation Management
    async createConversation(title = 'New Chat Session') {
        const id = `conv_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        const conversation = await Conversation.create({ id, title });
        return {
            id: conversation.id,
            title: conversation.title,
            created_at: conversation.created_at.toISOString()
        };
    }

    async ensureConversation(id, title = 'New Chat Session') {
        if (!id) return null;
        let conv = await Conversation.findOne({ id }).lean();
        if (!conv) {
            conv = await Conversation.create({ id, title });
        }
        return conv;
    }

    async getConversationHistory(conversationId) {
        let conv = await Conversation.findOne({ id: conversationId }).lean();

        const messages = await Message.find({ conversation_id: conversationId })
            .sort({ created_at: 1 })
            .lean();

        if (!conv) {
            if (messages.length === 0) return null;
            const firstUserMsg = messages.find(m => m.sender === 'user') || messages[0];
            const title = firstUserMsg.content.length > 35 ? firstUserMsg.content.substring(0, 35) + '...' : firstUserMsg.content;
            conv = await Conversation.create({ id: conversationId, title });
        }

        return {
            conversation: conv,
            messages: messages.map(m => ({
                id: m.id,
                sender: m.sender,
                content: m.content,
                confidenceScore: m.confidence_score,
                citations: m.citations || [],
                followUpQuestions: m.follow_up_questions || [],
                llmProvider: m.llm_provider || null,
                created_at: m.created_at
            }))
        };
    }

    async addMessage({ conversationId, sender, content, confidenceScore = 1.0, citations = [], followUpQuestions = [], llmProvider = null }) {
        const id = `msg_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        const message = await Message.create({
            id,
            conversation_id: conversationId,
            sender,
            content,
            confidence_score: confidenceScore,
            citations,
            follow_up_questions: followUpQuestions,
            llm_provider: llmProvider
        });

        // Update conversation timestamp & title if first user message
        const msgCount = await Message.countDocuments({ conversation_id: conversationId });
        if (sender === 'user' && msgCount <= 2) {
            const shortTitle = content.length > 35 ? content.substring(0, 35) + '...' : content;
            await Conversation.findOneAndUpdate(
                { id: conversationId },
                { title: shortTitle, updated_at: new Date() },
                { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
            );
        } else {
            await Conversation.findOneAndUpdate(
                { id: conversationId },
                { updated_at: new Date() },
                { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
            );
        }

        return {
            id: message.id,
            conversationId,
            sender: message.sender,
            content: message.content,
            confidenceScore: message.confidence_score,
            citations: message.citations,
            followUpQuestions: message.follow_up_questions
        };
    }

    async clearConversation(conversationId) {
        await Message.deleteMany({ conversation_id: conversationId });
        await Conversation.deleteOne({ id: conversationId });
    }

    // Feedback
    async saveFeedback({ messageId, queryText, rating, comments }) {
        const id = `fb_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        await Feedback.create({
            id,
            message_id: messageId || null,
            query_text: queryText || null,
            rating,
            comments: comments || null
        });
        return { id, success: true };
    }

    // Helper
    _parseStandardRow(r) {
        return {
            id: r.id,
            isNumber: r.is_number,
            year: r.year,
            title: r.title,
            category: r.category,
            department: r.department,
            isMandatory: Boolean(r.is_mandatory),
            qcoOrder: r.qco_order,
            qcoNotificationDate: r.qco_notification_date,
            enforcingMinistry: r.enforcing_ministry,
            scope: r.scope,
            testingRequirements: r.testing_requirements || [],
            clauses: r.clauses || [],
            scheme: r.scheme,
            officialUrl: r.official_url,
            labCapabilities: r.lab_capabilities || []
        };
    }
}

module.exports = new DBService();
