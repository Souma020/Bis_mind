const dbService = require('./dbService');
const embeddingService = require('./embeddingService');
const llmService = require('./llmService');

class RAGEngine {
    async processQuery({ conversationId, query, conversationHistory = [], language = 'en' }) {
        if (!query || query.trim().length === 0) {
            throw new Error('Query text is required.');
        }

        // 0. Non-English queries: retrieval (keywords, intent, embeddings) works on
        //    English text, so translate the query for retrieval only. The original
        //    query is still what the LLM answers, in the selected language.
        const retrievalQuery = language !== 'en'
            ? await llmService.translateToEnglish(query)
            : query;

        // 1. Intent Detection
        const intent = this._detectIntent(retrievalQuery);

        // 2. Entity & IS Number Extraction
        const entities = this._extractEntities(retrievalQuery);

        // 3. Keyword Search + Semantic Vector Search (Hybrid Retrieval)
        const retrievedChunks = await this._retrieveEvidence(retrievalQuery, entities);

        // 4. Ranking & Evidence Filtering
        const rankedChunks = await this._rankAndFilterEvidence(retrievalQuery, retrievedChunks);

        // 5. LLM Grounded Generation (Gemini or Grounded Engine)
        const llmResult = await llmService.generateGroundedAnswer({
            query,
            contextChunks: rankedChunks,
            conversationHistory,
            language
        });

        // 6. Citation Validation & Source Metadata Enrichment
        const citations = this._validateAndExtractCitations(rankedChunks);

        // 7. Calculate Confidence Indicator Score
        const confidenceScore = this._calculateConfidenceScore(rankedChunks, intent);

        // 8. Generate Follow-up Question Suggestions
        let followUpQuestions = this._generateFollowUpQuestions(intent, entities, retrievalQuery);
        if (language !== 'en') {
            followUpQuestions = await llmService.translateTexts(followUpQuestions, language);
        }
        const languageFallback = language !== 'en'
            && llmResult.source && llmResult.source.provider === 'Offline Grounded Engine';

        // Save messages in conversation history if conversationId provided
        let messageRecord = null;
        if (conversationId) {
            await dbService.addMessage({
                conversationId,
                sender: 'user',
                content: query
            });

            messageRecord = await dbService.addMessage({
                conversationId,
                sender: 'assistant',
                content: llmResult.text,
                confidenceScore,
                citations,
                followUpQuestions,
                llmProvider: llmResult.source
            });
        }

        return {
            messageId: messageRecord ? messageRecord.id : null,
            intent,
            extractedEntities: entities,
            answer: llmResult.text,
            confidenceScore,
            citations,
            followUpQuestions,
            retrievedChunksCount: rankedChunks.length,
            llmProvider: llmResult.source,
            languageFallback
        };
    }

    _detectIntent(query) {
        const q = query.toLowerCase();
        if (q.includes('recommend') || q.includes('manufacture') || q.includes('product') || q.includes('standard for')) {
            return 'PRODUCT_RECOMMENDATION';
        }
        if (q.includes('qco') || q.includes('mandatory') || q.includes('compulsory') || q.includes('order')) {
            return 'MANDATORY_STATUS_QUERY';
        }
        if (q.includes('hallmark') || q.includes('huid') || q.includes('gold') || q.includes('jewel')) {
            return 'HALLMARKING_QUERY';
        }
        if (q.includes('lab') || q.includes('testing') || q.includes('test report') || q.includes('lims')) {
            return 'TESTING_AND_LAB_QUERY';
        }
        if (q.includes('fee') || q.includes('licence') || q.includes('license') || q.includes('apply') || q.includes('manakonline')) {
            return 'CERTIFICATION_PROCESS_QUERY';
        }
        return 'GENERAL_STANDARD_QUERY';
    }

    _extractEntities(query) {
        const isMatch = query.match(/\bis\s*\d+(\s*\(\s*part\s*\d+\s*\))?/i);
        const numbers = query.match(/\b\d{3,5}\b/g);

        const keywords = query.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 3 && !['what', 'which', 'how', 'when', 'where', 'is', 'the', 'for', 'with', 'show', 'tell'].includes(w));

        return {
            isNumberMatch: isMatch ? isMatch[0].toUpperCase() : (numbers ? `IS ${numbers[0]}` : null),
            keywords
        };
    }

    async _retrieveEvidence(query, entities) {
        const queryTerms = entities.keywords;
        const isNumberFilter = entities.isNumberMatch;

        // Retrieve DB chunks
        return await dbService.searchDocumentChunks(queryTerms, isNumberFilter, 8);
    }

    async _rankAndFilterEvidence(query, chunks) {
        if (!chunks || chunks.length === 0) return [];

        const queryEmbedding = await embeddingService.getEmbedding(query);
        const queryLocal = embeddingService.createTFIDFVector(query);

        const scoredChunks = await Promise.all(chunks.map(async (chunk) => {
            // Use the stored embedding when it has the same dimension as the query's;
            // otherwise embed now and cache it. If dimensions still differ (e.g. Gemini
            // for the query but the local fallback for the chunk) compare both locally.
            let chunkEmbedding = Array.isArray(chunk.embedding) ? chunk.embedding : [];
            if (chunkEmbedding.length !== queryEmbedding.length) {
                chunkEmbedding = await embeddingService.getEmbedding(chunk.content);
                if (chunkEmbedding.length === queryEmbedding.length && chunk.id) {
                    dbService.saveChunkEmbedding(chunk.id, chunkEmbedding);
                }
            }
            let simScore = chunkEmbedding.length === queryEmbedding.length
                ? embeddingService.cosineSimilarity(queryEmbedding, chunkEmbedding)
                : embeddingService.cosineSimilarity(queryLocal, embeddingService.createTFIDFVector(chunk.content || ''));

            // Blend in keyword relevance computed at retrieval time
            let finalScore = simScore + 0.3 * (chunk.relevance || 0);
            if (chunk.is_number && query.toLowerCase().includes(chunk.is_number.toLowerCase())) {
                finalScore += 0.35;
            }
            return { chunk, score: finalScore };
        }));

        scoredChunks.sort((a, b) => b.score - a.score);

        // Keep the top 4 pieces of evidence
        return scoredChunks.slice(0, 4).map(sc => sc.chunk);
    }

    _validateAndExtractCitations(chunks) {
        const citations = [];
        const seenUrls = new Set();

        for (const chunk of chunks) {
            const isNo = chunk.is_number || 'BIS Citation';
            const url = chunk.source_url || 'https://www.bis.gov.in/';
            
            if (!seenUrls.has(url + isNo)) {
                seenUrls.add(url + isNo);
                citations.push({
                    isNumber: isNo,
                    title: chunk.doc_title || 'Official BIS Record',
                    clause: chunk.clause_no ? `Clause ${chunk.clause_no}` : null,
                    sourceName: chunk.source_name || 'Bureau of Indian Standards',
                    url: url,
                    verified: true
                });
            }
        }
        return citations;
    }

    _calculateConfidenceScore(chunks, intent) {
        if (!chunks || chunks.length === 0) return 0.2;
        // Based on how relevant the evidence is, not just how much of it there is.
        const rels = chunks.map(c => (typeof c.relevance === 'number' ? c.relevance : 0.4));
        const best = Math.max(...rels);
        const avg = rels.reduce((a, b) => a + b, 0) / rels.length;
        const support = Math.min(chunks.length, 3) / 3;
        const score = 0.25 + 0.45 * best + 0.15 * avg + 0.1 * support;
        return Math.round(Math.min(0.97, score) * 100) / 100;
    }

    _generateFollowUpQuestions(intent, entities, query) {
        const isNo = entities.isNumberMatch || 'this standard';
        switch (intent) {
            case 'PRODUCT_RECOMMENDATION':
                return [
                    `Is certification mandatory for ${isNo} under Quality Control Orders?`,
                    `What laboratory testing tests are required for ${isNo}?`,
                    `How do I apply for an ISI Mark license on Manakonline?`
                ];
            case 'MANDATORY_STATUS_QUERY':
                return [
                    `What is the punishment or penalty for selling non-compliant goods without BIS mark?`,
                    `Which government ministry issued the QCO notification?`,
                    `How to verify an authentic ISI license number?`
                ];
            case 'HALLMARKING_QUERY':
                return [
                    `How do I verify a 6-digit HUID code using the BIS CARE App?`,
                    `What are the official purity standards for 22K and 18K gold?`,
                    `Where can I find authorized Assaying & Hallmarking Centres near me?`
                ];
            default:
                return [
                    `What are the specific chemical and mechanical testing requirements for ${isNo}?`,
                    `Is there a mandatory Quality Control Order (QCO) for ${isNo}?`,
                    `What is the step-by-step process to get BIS product certification?`
                ];
        }
    }
}

module.exports = new RAGEngine();
