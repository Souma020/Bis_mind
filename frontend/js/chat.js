/* Know Your BIS - AI Assistant Chatbot Logic (Vodafone Inspired) */

document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('chat-messages')) return;

    initChatbot();
});

let currentConversationId = localStorage.getItem('current_conversation_id') || null;

function initChatbot() {
    const sendBtn = document.getElementById('chat-send-btn');
    const inputArea = document.getElementById('chat-input');
    const newChatBtn = document.getElementById('new-chat-btn');
    const clearChatBtn = document.getElementById('clear-chat-btn');

    setupLanguageSelector();

    if (sendBtn && inputArea) {
        sendBtn.addEventListener('click', handleUserSendMessage);
        inputArea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleUserSendMessage();
            }
        });
    }

    if (newChatBtn) {
        newChatBtn.addEventListener('click', startNewChatSession);
    }

    if (clearChatBtn) {
        clearChatBtn.addEventListener('click', clearCurrentChat);
    }

    const urlParams = new URLSearchParams(window.location.search);
    const initialQuery = urlParams.get('q');

    if (initialQuery) {
        startNewChatSession();
        inputArea.value = initialQuery;
        setTimeout(() => handleUserSendMessage(), 100);
    } else {
        let history = JSON.parse(localStorage.getItem('chat_sessions_history') || '[]');
        // Filter out any previous empty dummy sessions
        history = history.filter(h => h.title && h.title !== 'New Session' && h.title !== 'Current Session');
        localStorage.setItem('chat_sessions_history', JSON.stringify(history));

        if (currentConversationId) {
            loadConversationHistory(currentConversationId);
        } else if (history.length > 0) {
            currentConversationId = history[0].id;
            localStorage.setItem('current_conversation_id', currentConversationId);
            loadConversationHistory(currentConversationId);
        } else {
            currentConversationId = `conv_${Date.now()}`;
            localStorage.setItem('current_conversation_id', currentConversationId);
            renderWelcomeGreeting();
            updateHistorySidebar();
        }
    }
}

function renderWelcomeGreeting() {
    const messagesContainer = document.getElementById('chat-messages');
    messagesContainer.innerHTML = '';

    const t = chatText();
    appendAssistantMessage({
        answer: t.welcome,
        confidenceScore: 1.0,
        citations: [],
        followUpQuestions: t.starters
    });
}

function setupLanguageSelector() {
    const select = document.getElementById('language-select');
    applyChatLanguageUI();
    if (!select) return;

    select.innerHTML = '';
    Object.entries(CHAT_LANGUAGES).forEach(([code, cfg]) => {
        const opt = document.createElement('option');
        opt.value = code;
        opt.textContent = cfg.label;
        select.appendChild(opt);
    });
    select.value = getChatLanguage();

    select.addEventListener('change', () => {
        setChatLanguage(select.value);
        applyChatLanguageUI();

        // If the chat only shows the welcome message, re-render it in the new language.
        // Existing conversations are left untouched; new replies use the new language.
        const hasUserMessages = document.querySelector('#chat-messages .message-bubble.user');
        if (!hasUserMessages) renderWelcomeGreeting();
    });
}

function applyChatLanguageUI() {
    const t = chatText();
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send-btn');
    if (input) input.placeholder = t.placeholder;
    if (sendBtn) sendBtn.textContent = t.send;
    document.documentElement.setAttribute('data-chat-lang', getChatLanguage());
}

function startNewChatSession() {
    currentConversationId = `conv_${Date.now()}`;
    localStorage.setItem('current_conversation_id', currentConversationId);

    renderWelcomeGreeting();
    updateHistorySidebar();
}

async function loadConversationHistory(convId) {
    try {
        const historyData = await APIClient.getChatHistory(convId);
        const messagesContainer = document.getElementById('chat-messages');
        messagesContainer.innerHTML = '';

        if (historyData && historyData.messages && historyData.messages.length > 0) {
            historyData.messages.forEach(msg => {
                if (msg.sender === 'user') {
                    appendUserMessage(msg.content);
                } else {
                    appendAssistantMessage({
                        messageId: msg.id,
                        answer: msg.content,
                        confidenceScore: msg.confidenceScore,
                        citations: msg.citations,
                        followUpQuestions: msg.followUpQuestions,
                        llmProvider: msg.llmProvider
                    });
                }
            });
        } else {
            renderWelcomeGreeting();
        }
        updateHistorySidebar();
    } catch (err) {
        console.warn('Could not load history for', convId, err.message);
        renderWelcomeGreeting();
        updateHistorySidebar();
    }
}

async function handleUserSendMessage() {
    const inputArea = document.getElementById('chat-input');
    const query = inputArea.value.trim();
    if (!query) return;

    // Clear input
    inputArea.value = '';

    // Append User Message
    appendUserMessage(query);

    // Show Typing Indicator
    showTypingIndicator();

    try {
        const response = await APIClient.sendMessage({
            message: query,
            conversationId: currentConversationId,
            language: getChatLanguage()
        });

        removeTypingIndicator();

        if (response.conversationId) {
            currentConversationId = response.conversationId;
            localStorage.setItem('current_conversation_id', currentConversationId);
        }

        appendAssistantMessage(response);
        updateHistorySidebar(query);

    } catch (err) {
        removeTypingIndicator();
        appendAssistantMessage({
            answer: `${chatText().error} ${err.message}`,
            confidenceScore: 0,
            citations: [],
            followUpQuestions: []
        });
    }
}

function appendUserMessage(text) {
    const messagesContainer = document.getElementById('chat-messages');
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message-bubble user';
    msgDiv.textContent = text;
    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function appendAssistantMessage({ messageId, answer, confidenceScore, citations, followUpQuestions, languageFallback }) {
    const t = chatText();
    const messagesContainer = document.getElementById('chat-messages');
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message-bubble assistant';

    let html = '';

    // Confidence meter
    if (confidenceScore !== undefined && confidenceScore !== null && confidenceScore > 0) {
        const percent = Math.round(confidenceScore * 100);
        html += `
            <div class="confidence-meter">
                <span style="font-weight: 600; text-transform: uppercase; font-size: 0.78rem; letter-spacing: 0.5px;">${t.confidence}: ${percent}%</span>
                <div class="confidence-bar">
                    <div class="confidence-fill" style="width: ${percent}%"></div>
                </div>
            </div>
        `;
    }

    // Parsed Markdown Answer
    html += `<div class="markdown-body">${parseSimpleMarkdown(answer)}</div>`;

    // Shown only when a non-English language was selected but no AI provider was available
    if (languageFallback && t.offlineNote) {
        html += `<div style="margin-top: 0.75rem; font-size: 0.82rem; color: var(--color-body);">${t.offlineNote}</div>`;
    }

    // Citations Drawer
    if (citations && citations.length > 0) {
        html += `<div class="citations-box"><strong style="text-transform: uppercase; font-size: 0.8rem; letter-spacing: 0.5px;">Verified Sources & Citations:</strong><br>`;
        citations.forEach(c => {
            html += `<a href="${c.url}" target="_blank" class="citation-chip">📌 ${c.isNumber} ${c.clause ? '(' + c.clause + ')' : ''}</a>`;
        });
        html += `</div>`;
    }

    // Follow up questions
    if (followUpQuestions && followUpQuestions.length > 0) {
        html += `<div style="margin-top: 1.25rem; font-size: 0.82rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-body);">${t.followUps}</div>`;
        html += `<div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem;">`;
        followUpQuestions.forEach(q => {
            html += `<button class="quick-tag follow-up-btn" style="background-color: var(--color-canvas); color: var(--color-ink); border: 1px solid var(--color-border); font-size: 0.82rem; padding: 0.35rem 0.9rem;">${q}</button>`;
        });
        html += `</div>`;
    }

    // Feedback Buttons (Thumbs Up / Down)
    if (messageId) {
        html += `
            <div style="margin-top: 1rem; display: flex; align-items: center; gap: 0.75rem; font-size: 0.82rem; color: var(--color-body);">
                <span>${t.helpful}</span>
                <button class="feedback-btn" data-id="${messageId}" data-rating="1" style="background: none; border: 1px solid var(--color-border); border-radius: var(--radius-full); width: 28px; height: 28px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; font-size: 0.85rem;">👍</button>
                <button class="feedback-btn" data-id="${messageId}" data-rating="-1" style="background: none; border: 1px solid var(--color-border); border-radius: var(--radius-full); width: 28px; height: 28px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; font-size: 0.85rem;">👎</button>
            </div>
        `;
    }

    msgDiv.innerHTML = html;
    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Attach listener to follow-up buttons
    msgDiv.querySelectorAll('.follow-up-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('chat-input').value = btn.textContent;
            handleUserSendMessage();
        });
    });

    // Attach listener to feedback buttons
    msgDiv.querySelectorAll('.feedback-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const rating = parseInt(btn.getAttribute('data-rating'));
            const id = btn.getAttribute('data-id');
            await APIClient.submitFeedback({ messageId: id, rating });
            btn.parentElement.innerHTML = '<span style="color: var(--color-primary); font-weight: 600;">' + chatText().thanks + '</span>';
        });
    });
}

function showTypingIndicator() {
    const messagesContainer = document.getElementById('chat-messages');
    const indicator = document.createElement('div');
    indicator.id = 'typing-indicator-box';
    indicator.className = 'message-bubble assistant';
    indicator.innerHTML = `
        <div class="typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <span style="font-size: 0.85rem; color: var(--color-body); margin-left: 0.5rem; font-weight: 500;">${chatText().typing}</span>
        </div>
    `;
    messagesContainer.appendChild(indicator);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function removeTypingIndicator() {
    const box = document.getElementById('typing-indicator-box');
    if (box) box.remove();
}

async function clearCurrentChat() {
    if (currentConversationId) {
        await deleteChatSession(currentConversationId);
    } else {
        startNewChatSession();
    }
}

async function deleteChatSession(sessionId) {
    if (!sessionId) return;

    try {
        await APIClient.clearChat(sessionId);
    } catch (err) {
        console.warn('Could not clear session on server:', err.message);
    }

    let history = JSON.parse(localStorage.getItem('chat_sessions_history') || '[]');
    history = history.filter(h => h.id !== sessionId);
    localStorage.setItem('chat_sessions_history', JSON.stringify(history));

    if (sessionId === currentConversationId) {
        if (history.length > 0) {
            currentConversationId = history[0].id;
            localStorage.setItem('current_conversation_id', currentConversationId);
            loadConversationHistory(currentConversationId);
        } else {
            startNewChatSession();
        }
    } else {
        updateHistorySidebar();
    }
}

function updateHistorySidebar(titleOverride = null) {
    const historyList = document.getElementById('history-list');
    if (!historyList) return;

    let history = JSON.parse(localStorage.getItem('chat_sessions_history') || '[]');
    
    // Add or update current session ONLY when a message is sent (titleOverride provided)
    if (currentConversationId && titleOverride) {
        const existingIdx = history.findIndex(h => h.id === currentConversationId);
        const displayTitle = titleOverride.length > 30 ? titleOverride.substring(0, 30) + '...' : titleOverride;

        if (existingIdx >= 0) {
            history[existingIdx].title = displayTitle;
        } else {
            history.unshift({ id: currentConversationId, title: displayTitle, date: new Date().toLocaleTimeString() });
        }
        localStorage.setItem('chat_sessions_history', JSON.stringify(history.slice(0, 20)));
    }

    historyList.innerHTML = '';

    if (history.length === 0) {
        historyList.innerHTML = '<div style="font-size: 0.82rem; color: var(--color-body); padding: 0.5rem 0;">No saved sessions.</div>';
        return;
    }

    history.forEach(item => {
        const div = document.createElement('div');
        div.className = `history-item ${item.id === currentConversationId ? 'active' : ''}`;
        
        const titleSpan = document.createElement('span');
        titleSpan.className = 'history-item-title';
        titleSpan.textContent = item.title || 'Chat Session';
        titleSpan.title = item.title || 'Chat Session';

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'history-delete-btn';
        deleteBtn.innerHTML = '&times;';
        deleteBtn.title = 'Delete chat session';
        deleteBtn.setAttribute('aria-label', `Delete ${item.title}`);

        deleteBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            await deleteChatSession(item.id);
        });

        div.appendChild(titleSpan);
        div.appendChild(deleteBtn);

        div.addEventListener('click', () => {
            if (currentConversationId !== item.id) {
                currentConversationId = item.id;
                localStorage.setItem('current_conversation_id', currentConversationId);
                loadConversationHistory(currentConversationId);
                updateHistorySidebar();
            }
        });
        historyList.appendChild(div);
    });

    localStorage.setItem('chat_sessions_history', JSON.stringify(history.slice(0, 20)));
}

// Markdown Parser Helper
function parseSimpleMarkdown(text) {
    if (!text) return '';
    let parsed = text;

    // Convert HTML characters safely
    parsed = parsed.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // Headers
    parsed = parsed.replace(/^#### (.*$)/gim, '<h4 style="font-weight: 700; text-transform: uppercase; margin: 0.75rem 0 0.25rem 0;">$1</h4>');
    parsed = parsed.replace(/^### (.*$)/gim, '<h3 style="font-weight: 700; text-transform: uppercase; margin: 1rem 0 0.5rem 0;">$1</h3>');
    parsed = parsed.replace(/^## (.*$)/gim, '<h2 style="font-weight: 800; text-transform: uppercase; margin: 1.25rem 0 0.5rem 0;">$1</h2>');
    parsed = parsed.replace(/^# (.*$)/gim, '<h1 style="font-weight: 800; text-transform: uppercase; margin: 1.5rem 0 0.5rem 0;">$1</h1>');

    // Bold & Italic
    parsed = parsed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    parsed = parsed.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // GitHub Alerts
    parsed = parsed.replace(/&gt;\s*\[!IMPORTANT\]\n&gt;\s*(.*)/gi, '<div style="background-color: #fee2e2; border-left: 4px solid var(--color-primary); padding: 0.85rem; margin: 0.75rem 0; border-radius: var(--radius-card); color: #990000; font-size: 0.92rem;"><strong>IMPORTANT:</strong> $1</div>');
    parsed = parsed.replace(/&gt;\s*\[!NOTE\]\n&gt;\s*(.*)/gi, '<div style="background-color: var(--color-canvas-soft); border-left: 4px solid var(--color-ink); padding: 0.85rem; margin: 0.75rem 0; border-radius: var(--radius-card); color: var(--color-ink); font-size: 0.92rem;"><strong>NOTE:</strong> $1</div>');

    // Links [Text](URL)
    parsed = parsed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color: var(--color-primary); font-weight: 600;">$1</a>');

    // Unordered Lists
    parsed = parsed.replace(/^\s*-\s+(.*$)/gim, '<li style="margin-bottom: 0.35rem;">$1</li>');
    parsed = parsed.replace(/(<li>.*<\/li>)/sim, '<ul style="padding-left: 1.25rem; margin: 0.5rem 0;">$1</ul>');

    // Line breaks
    parsed = parsed.replace(/\n\n/g, '<br><br>');

    return parsed;
}
