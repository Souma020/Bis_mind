/* Know Your BIS - Product Standard Recommender Logic (Vodafone Inspired) */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('recommend-form');
    const input = document.getElementById('product-input');
    const resultsContainer = document.getElementById('recommend-results');
    const exampleBtns = document.querySelectorAll('.example-btn');

    if (form && input && resultsContainer) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const productDesc = input.value.trim();
            if (!productDesc) return;

            await runRecommendation(productDesc);
        });

        exampleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const text = btn.getAttribute('data-query');
                input.value = text;
                runRecommendation(text);
            });
        });
    }
});

async function runRecommendation(productDescription) {
    const resultsContainer = document.getElementById('recommend-results');
    resultsContainer.innerHTML = `
        <div style="text-align: center; padding: 3.5rem;">
            <div class="typing-indicator" style="justify-content: center;">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
            <p style="margin-top: 1rem; color: var(--color-body); font-weight: 500;">Analyzing product scope against official Indian Standards and Quality Control Orders...</p>
        </div>
    `;

    try {
        const data = await APIClient.recommendStandard(productDescription);

        let html = '';

        // Top Summary Card
        const confidencePercent = Math.round((data.confidenceScore || 0.85) * 100);
        html += `
            <div class="card" style="border-left: 4px solid var(--color-primary); margin-bottom: 2.5rem;">
                <div class="card-header">
                    <div>
                        <h2 class="card-title" style="font-size: 1.35rem;">COMPLIANCE ANALYSIS FOR "${data.query}"</h2>
                        <p class="card-subtitle">Official Standard Identification & QCO Status</p>
                    </div>
                    <div>
                        <span class="badge badge-scheme">Match Confidence: ${confidencePercent}%</span>
                    </div>
                </div>
                <div class="markdown-body" style="margin-top: 1rem;">
                    ${parseSimpleMarkdown(data.recommendationText)}
                </div>
            </div>
        `;

        // Matched Standards Grid
        if (data.matchedStandards && data.matchedStandards.length > 0) {
            html += `<h3 style="margin-bottom: 1.25rem; font-weight: 800; text-transform: uppercase; letter-spacing: -0.5px; color: var(--color-ink);">RELEVANT INDIAN STANDARDS (${data.matchedStandards.length})</h3>`;
            html += `<div class="grid-2" style="margin-bottom: 3rem;">`;

            data.matchedStandards.forEach(std => {
                html += `
                    <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
                        <div>
                            <div class="card-header">
                                <div>
                                    <h3 class="card-title">${std.isNumber}:${std.year}</h3>
                                    <p class="card-subtitle">${std.category}</p>
                                </div>
                                <span class="badge ${std.isMandatory ? 'badge-mandatory' : 'badge-voluntary'}">
                                    ${std.isMandatory ? 'MANDATORY QCO' : 'VOLUNTARY'}
                                </span>
                            </div>
                            <p style="font-size: 0.95rem; font-weight: 700; color: var(--color-ink); margin-bottom: 0.5rem;">${std.title}</p>
                            <p style="font-size: 0.88rem; color: var(--color-body); margin-bottom: 1.25rem; line-height: 1.5;">${std.scope}</p>
                            
                            <div style="font-size: 0.84rem; background-color: var(--color-canvas-soft); border: 1px solid var(--color-border-light); padding: 0.85rem; border-radius: var(--radius-card); margin-bottom: 1.25rem;">
                                <strong style="color: var(--color-ink);">Certification Scheme:</strong> ${std.scheme}<br>
                                ${std.isMandatory ? '<strong style="color: var(--color-ink);">Order:</strong> ' + std.qcoOrder : ''}
                            </div>
                        </div>

                        <a href="${std.officialUrl}" target="_blank" class="btn btn-outline-dark" style="width: 100%; font-size: 0.82rem;">
                            VIEW OFFICIAL SPECIFICATION ➔
                        </a>
                    </div>
                `;
            });

            html += `</div>`;
        }

        resultsContainer.innerHTML = html;

    } catch (err) {
        resultsContainer.innerHTML = `
            <div class="card" style="border-left: 4px solid var(--color-primary);">
                <h3 style="color: var(--color-primary); font-weight: 700;">ANALYSIS ERROR</h3>
                <p style="color: var(--color-body); margin-top: 0.5rem;">Failed to analyze product: ${err.message}</p>
            </div>
        `;
    }
}

// Markdown Parser Helper
function parseSimpleMarkdown(text) {
    if (!text) return '';
    let parsed = text;
    parsed = parsed.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    parsed = parsed.replace(/^#### (.*$)/gim, '<h4 style="font-weight: 700; text-transform: uppercase; margin: 0.75rem 0 0.25rem 0;">$1</h4>');
    parsed = parsed.replace(/^### (.*$)/gim, '<h3 style="font-weight: 700; text-transform: uppercase; margin: 1rem 0 0.5rem 0;">$1</h3>');
    parsed = parsed.replace(/^## (.*$)/gim, '<h2 style="font-weight: 800; text-transform: uppercase; margin: 1.25rem 0 0.5rem 0;">$1</h2>');
    parsed = parsed.replace(/^# (.*$)/gim, '<h1 style="font-weight: 800; text-transform: uppercase; margin: 1.5rem 0 0.5rem 0;">$1</h1>');
    parsed = parsed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    parsed = parsed.replace(/\*(.*?)\*/g, '<em>$1</em>');
    parsed = parsed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color: var(--color-primary); font-weight: 600;">$1</a>');
    parsed = parsed.replace(/^\s*-\s+(.*$)/gim, '<li style="margin-bottom: 0.35rem;">$1</li>');
    parsed = parsed.replace(/^\s*\d+\.\s+(.*$)/gim, '<li style="margin-bottom: 0.35rem;">$1</li>');
    parsed = parsed.replace(/\n\n/g, '<br><br>');
    return parsed;
}
