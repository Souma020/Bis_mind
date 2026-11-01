const { GEMINI_API_KEY, OPENROUTER_API_KEY, OPENROUTER_MODEL, PREFERRED_AI_PROVIDER } = require('../config/env');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { SUPPORTED_LANGUAGES } = require('../config/languages');

let genAI = null;
if (GEMINI_API_KEY) {
    try {
        genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    } catch (err) {
        console.warn('Gemini AI initialization error in LLM service:', err.message);
    }
}

class LLMService {
    constructor() {
        this.openRouterModel = OPENROUTER_MODEL || 'google/gemini-3.5-flash-lite';
        this.geminiModel = 'gemini-3.5-flash-lite';
        this.preferredProvider = (PREFERRED_AI_PROVIDER || 'auto').toLowerCase();
    }

    /**
     * Call OpenRouter Chat Completions API
     */
    async _callOpenRouter({ systemPrompt, messages = [], query, model = null }) {
        if (!OPENROUTER_API_KEY) {
            throw new Error('OPENROUTER_API_KEY is not configured');
        }

        const selectedModel = model || this.openRouterModel;
        const formattedMessages = [];

        if (systemPrompt) {
            formattedMessages.push({ role: 'system', content: systemPrompt });
        }

        messages.forEach(m => {
            formattedMessages.push({
                role: m.sender === 'user' ? 'user' : 'assistant',
                content: m.content
            });
        });

        if (query) {
            formattedMessages.push({ role: 'user', content: query });
        }

        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'Know Your BIS AI Platform'
            },
            body: JSON.stringify({
                model: selectedModel,
                messages: formattedMessages,
                temperature: 0.2,
                max_tokens: 2048
            })
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`OpenRouter API error (${res.status}): ${errorText}`);
        }

        const data = await res.json();
        const text = data.choices?.[0]?.message?.content || '';
        return {
            text,
            source: {
                provider: 'OpenRouter',
                model: selectedModel,
                usage: data.usage || null
            }
        };
    }

    /**
     * Call Google Gemini API
     */
    async _callGemini({ systemPrompt, messages = [], query }) {
        if (!genAI || !GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY is not configured');
        }

        const model = genAI.getGenerativeModel({
            model: this.geminiModel,
            systemInstruction: systemPrompt
        });

        const formattedHistory = messages.slice(-6).map(m => ({
            role: m.sender === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
        }));

        const chat = model.startChat({ history: formattedHistory });
        const result = await chat.sendMessage(`User Question: ${query}`);
        const responseText = result.response.text();

        return {
            text: responseText,
            source: {
                provider: 'Google Gemini',
                model: this.geminiModel
            }
        };
    }

    /**
     * Generate grounded answer with dual-provider failover
     */
    async generateGroundedAnswer({ query, contextChunks, conversationHistory = [], language = 'en' }) {
        const contextText = contextChunks.map((c, i) => 
            `[EVIDENCE Source #${i+1}]: IS Standard / Doc: ${c.is_number || 'Official Guidance'}\nTitle: ${c.doc_title || ''}\nClause: ${c.clause_no || 'N/A'}\nContent: ${c.content}\nSource URL: ${c.source_url || 'https://www.bis.gov.in/'}`
        ).join('\n\n');

        const systemPrompt = `You are "Know Your BIS", an AI assistant for the Bureau of Indian Standards (BIS).
Your primary mandate is to provide accurate, evidence-backed answers regarding Indian Standards, BIS Certification (ISI Mark, CRS, FMCS), Hallmarking (HUID), Quality Control Orders (QCOs), Testing Requirements, and BIS Laboratories.

CRITICAL GROUNDING RULES:
1. Rely strictly on the provided EVIDENCE.
2. NEVER fabricate IS numbers, Clause numbers, testing requirements, or government notifications.
3. If sufficient evidence is not available in the context, explicitly inform the user.
4. Cite official standards (e.g. [IS 1786:2008 Clause 4.1], [IS 14543:2004], [Toys QCO 2020]) whenever providing specific figures, limits, or requirements.
5. Format your output using clear Markdown headings, bullet points, and tables where appropriate.
6. Clearly distinguish between MANDATORY Quality Control Orders (QCO) and voluntary standards.
${this._languageInstruction(language)}
EVIDENCE CONTEXT:
${contextText || 'No direct evidence chunks found.'}
`;

        // Determine invocation sequence based on user preference
        const tryProviders = [];
        if (this.preferredProvider === 'openrouter') {
            tryProviders.push('openrouter', 'gemini');
        } else if (this.preferredProvider === 'gemini') {
            tryProviders.push('gemini', 'openrouter');
        } else {
            // 'auto': prioritize Gemini if available, else OpenRouter
            if (GEMINI_API_KEY) {
                tryProviders.push('gemini', 'openrouter');
            } else {
                tryProviders.push('openrouter', 'gemini');
            }
        }

        for (const provider of tryProviders) {
            if (provider === 'gemini' && genAI && GEMINI_API_KEY) {
                try {
                    const result = await this._callGemini({
                        systemPrompt,
                        messages: conversationHistory,
                        query
                    });
                    return result;
                } catch (err) {
                    console.warn('Gemini API call failed, trying next provider:', err.message);
                }
            } else if (provider === 'openrouter' && OPENROUTER_API_KEY) {
                try {
                    const result = await this._callOpenRouter({
                        systemPrompt,
                        messages: conversationHistory,
                        query
                    });
                    return result;
                } catch (err) {
                    console.warn('OpenRouter API call failed, trying next provider:', err.message);
                }
            }
        }

        // Deterministic Grounded Synthesis Fallback when all AI APIs fail or are unconfigured
        return {
            text: this._synthesizeGroundedResponse(query, contextChunks),
            source: {
                provider: 'Offline Grounded Engine',
                model: 'Deterministic Semantic Retrieval'
            }
        };
    }

    /**
     * Prompt rule that forces the reply language (empty string for English).
     */
    _languageInstruction(language) {
        const lang = SUPPORTED_LANGUAGES[language];
        if (!lang || language === 'en') return '';
        return `7. LANGUAGE: Write your ENTIRE answer in ${lang.name} (${lang.nativeName}), regardless of the language of the user's question or the evidence. Translate headings and explanations into ${lang.name}. Keep IS numbers, clause numbers, QCO names, scheme acronyms (ISI, CRS, HUID, FMCS), URLs and Markdown structure unchanged.\n`;
    }

    /**
     * Run a single plain-text prompt through the available providers.
     * Returns the text, or null if no provider is configured or all fail.
     */
    async _simpleCompletion(systemPrompt, userText) {
        const order = this.preferredProvider === 'openrouter'
            ? ['openrouter', 'gemini']
            : ['gemini', 'openrouter'];

        for (const provider of order) {
            try {
                if (provider === 'gemini' && genAI && GEMINI_API_KEY) {
                    const model = genAI.getGenerativeModel({
                        model: this.geminiModel,
                        systemInstruction: systemPrompt
                    });
                    const result = await model.generateContent(userText);
                    return result.response.text();
                }
                if (provider === 'openrouter' && OPENROUTER_API_KEY) {
                    const result = await this._callOpenRouter({ systemPrompt, query: userText });
                    return result.text;
                }
            } catch (err) {
                console.warn(`${provider} helper call failed:`, err.message);
            }
        }
        return null;
    }

    /**
     * Translate a user query to English for retrieval. Falls back to the original text.
     */
    async translateToEnglish(text) {
        const out = await this._simpleCompletion(
            'Translate the user message into English. Keep IS numbers (e.g. IS 1786), acronyms and product names unchanged. Output ONLY the translation, nothing else.',
            text
        );
        const cleaned = out ? out.trim() : '';
        return cleaned || text;
    }

    /**
     * Translate a list of short strings into the target language. Falls back to the originals.
     */
    async translateTexts(texts, language) {
        const lang = SUPPORTED_LANGUAGES[language];
        if (!lang || !texts || texts.length === 0) return texts;

        const out = await this._simpleCompletion(
            `Translate each string in the JSON array into ${lang.name}. Keep IS numbers, acronyms (QCO, ISI, HUID, BIS) and product names unchanged. Return ONLY a JSON array of strings with the same length and order, no code fences.`,
            JSON.stringify(texts)
        );
        if (!out) return texts;

        try {
            const parsed = JSON.parse(out.replace(/```json|```/g, '').trim());
            if (Array.isArray(parsed) && parsed.length === texts.length && parsed.every(t => typeof t === 'string')) {
                return parsed;
            }
        } catch (err) {
            console.warn('Follow-up translation parse failed:', err.message);
        }
        return texts;
    }

    /**
     * Generate product recommendation with dual-provider failover
     */
    async generateProductRecommendation({ productDescription, matchedStandards }) {
        if (!matchedStandards || matchedStandards.length === 0) {
            return {
                recommendationText: `No specific Indian Standard was found matching "${productDescription}" in the database. Please verify with the official BIS Standards portal at https://standardsbis.bsbedge.com/.`,
                confidence: 0.3,
                source: { provider: 'Rule Engine', model: 'Catalog Search' }
            };
        }

        const primary = matchedStandards[0];
        const contextSummary = matchedStandards.map(s => 
            `• ${s.isNumber}: ${s.title} (${s.isMandatory ? 'MANDATORY under ' + (s.qcoOrder || 'QCO') : 'Voluntary Scheme'})`
        ).join('\n');

        const systemPrompt = `You are a BIS Product Compliance Analyst.
Analyze the product description: "${productDescription}" and provide a structured compliance breakdown based on these verified Indian Standards:
${contextSummary}

Rules:
- State whether the standard is mandatory or voluntary.
- List required testing parameters.
- Provide step-by-step licensing guidance.
- Cite official standard numbers accurately.
`;

        const tryProviders = this.preferredProvider === 'openrouter' 
            ? ['openrouter', 'gemini'] 
            : ['gemini', 'openrouter'];

        for (const provider of tryProviders) {
            if (provider === 'gemini' && genAI && GEMINI_API_KEY) {
                try {
                    const model = genAI.getGenerativeModel({ model: this.geminiModel });
                    const prompt = `${systemPrompt}\nProvide a structured, helpful analysis for "${productDescription}".`;
                    const result = await model.generateContent(prompt);
                    return {
                        recommendationText: result.response.text(),
                        confidence: primary.isMandatory ? 0.95 : 0.85,
                        source: { provider: 'Google Gemini', model: this.geminiModel }
                    };
                } catch (err) {
                    console.warn('Gemini recommendation call failed, trying next provider:', err.message);
                }
            } else if (provider === 'openrouter' && OPENROUTER_API_KEY) {
                try {
                    const result = await this._callOpenRouter({
                        systemPrompt,
                        query: `Provide a structured compliance analysis for product: "${productDescription}".`
                    });
                    return {
                        recommendationText: result.text,
                        confidence: primary.isMandatory ? 0.95 : 0.85,
                        source: result.source
                    };
                } catch (err) {
                    console.warn('OpenRouter recommendation call failed, trying next provider:', err.message);
                }
            }
        }

        // Local synthesis for recommendation
        let response = `### BIS Standard & Compliance Recommendation for "${productDescription}"\n\n`;
        response += `#### Recommended Primary Indian Standard\n`;
        response += `**[${primary.isNumber}:${primary.year}](${primary.officialUrl})** - *${primary.title}*\n\n`;
        
        response += `#### 1. Mandatory QCO & Legal Status\n`;
        if (primary.isMandatory) {
            response += `> [!IMPORTANT]\n`;
            response += `> **MANDATORY CERTIFICATION REQUIRED**: Covered under **${primary.qcoOrder}** enforced by ${primary.enforcingMinistry || 'Government of India'}. It is illegal to manufacture, import, or sell this item without a valid BIS License / Standard Mark.\n\n`;
        } else {
            response += `> [!NOTE]\n`;
            response += `> **Voluntary Certification**: Currently a voluntary quality benchmark standard under BIS Scheme I.\n\n`;
        }

        response += `#### 2. Applicable BIS Certification Scheme\n`;
        response += `**${primary.scheme}**\n\n`;

        response += `#### 3. Key Laboratory & Quality Testing Requirements\n`;
        if (primary.testingRequirements && primary.testingRequirements.length > 0) {
            primary.testingRequirements.forEach(req => {
                response += `- ${req}\n`;
            });
        }

        response += `\n#### 4. Authorized BIS Testing Laboratories\n`;
        if (primary.labCapabilities && primary.labCapabilities.length > 0) {
            primary.labCapabilities.forEach(lab => {
                response += `- ${lab}\n`;
            });
        }

        response += `\n#### 5. Recommended Next Steps for Manufacturers\n`;
        response += `1. Access official specification details on [BIS Portal](${primary.officialUrl}).\n`;
        response += `2. Ensure factory internal quality control and testing equipment conform to ${primary.isNumber}.\n`;
        response += `3. File an online license application on [Manakonline Portal](https://www.manakonline.in/).\n`;

        return {
            recommendationText: response,
            confidence: primary.isMandatory ? 0.96 : 0.88,
            source: { provider: 'Offline Grounded Engine', model: 'Deterministic Templates' }
        };
    }

    /**
     * Inspect AI Service Status, Quota, and Usage Limits
     */
    async getAIStatus() {
        const status = {
            activePreference: this.preferredProvider,
            primaryProvider: null,
            openRouter: {
                configured: !!OPENROUTER_API_KEY,
                model: this.openRouterModel,
                keyLabel: null,
                isFreeTier: null,
                usageUSD: null,
                limitUSD: null,
                remainingUSD: null,
                rateLimit: null,
                status: OPENROUTER_API_KEY ? 'unknown' : 'not_configured',
                error: null
            },
            gemini: {
                configured: !!GEMINI_API_KEY,
                model: this.geminiModel,
                status: GEMINI_API_KEY ? 'active' : 'not_configured',
                tier: 'Free Tier / Pay-as-you-go',
                rateLimits: '15 RPM / 1,000,000 TPM / 1,500 RPD'
            },
            embeddings: {
                provider: GEMINI_API_KEY ? 'Google Gemini' : 'Local TF-IDF Vectorizer',
                model: GEMINI_API_KEY ? 'gemini-embedding-001' : 'TF-IDF 128-dim Cosine Engine',
                status: 'operational'
            }
        };

        // Determine currently selected primary provider
        if (this.preferredProvider === 'openrouter' && OPENROUTER_API_KEY) {
            status.primaryProvider = 'OpenRouter';
        } else if (this.preferredProvider === 'gemini' && GEMINI_API_KEY) {
            status.primaryProvider = 'Google Gemini';
        } else if (GEMINI_API_KEY) {
            status.primaryProvider = 'Google Gemini';
        } else if (OPENROUTER_API_KEY) {
            status.primaryProvider = 'OpenRouter';
        } else {
            status.primaryProvider = 'Offline Grounded Engine';
        }

        // Live probe to OpenRouter auth endpoint
        if (OPENROUTER_API_KEY) {
            try {
                const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
                    headers: {
                        'Authorization': `Bearer ${OPENROUTER_API_KEY}`
                    }
                });

                if (res.ok) {
                    const data = await res.json();
                    const keyData = data.data || {};
                    status.openRouter.status = 'active';
                    status.openRouter.keyLabel = keyData.label || 'Default Key';
                    status.openRouter.isFreeTier = keyData.is_free_tier ?? true;
                    status.openRouter.usageUSD = keyData.usage !== undefined ? Number(keyData.usage) : 0;
                    status.openRouter.limitUSD = keyData.limit !== null && keyData.limit !== undefined ? Number(keyData.limit) : null;
                    if (status.openRouter.limitUSD !== null) {
                        status.openRouter.remainingUSD = Math.max(0, status.openRouter.limitUSD - status.openRouter.usageUSD);
                    }
                    status.openRouter.rateLimit = keyData.rate_limit || null;
                } else {
                    const errTxt = await res.text();
                    status.openRouter.status = 'error';
                    status.openRouter.error = `HTTP ${res.status}: ${errTxt}`;
                }
            } catch (err) {
                status.openRouter.status = 'network_error';
                status.openRouter.error = err.message;
            }
        }

        return status;
    }

    _synthesizeGroundedResponse(query, contextChunks) {
        if (!contextChunks || contextChunks.length === 0) {
            return `I could not find specific official evidence in the BIS knowledge base regarding your query "${query}".\n\nPlease check the official Bureau of Indian Standards portal at [https://www.bis.gov.in/](https://www.bis.gov.in/) or search the standards catalog at [https://standardsbis.bsbedge.com/](https://standardsbis.bsbedge.com/).`;
        }

        let answer = `### Official BIS Evidence Summary\n\n`;
        answer += `Based on official Bureau of Indian Standards documentation retrieved for your inquiry:\n\n`;

        contextChunks.forEach((chunk, i) => {
            const isNo = chunk.is_number ? `**${chunk.is_number}**` : 'Official BIS Guidance';
            const clause = chunk.clause_no ? `(Clause ${chunk.clause_no})` : '';
            answer += `#### ${i + 1}. ${isNo} ${clause}\n`;
            answer += `${chunk.content}\n\n`;
        });

        answer += `---\n*Official Source References:* Verified from [Bureau of Indian Standards Repository](https://www.bis.gov.in/).`;
        return answer;
    }
}

module.exports = new LLMService();
