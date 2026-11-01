/* Know Your BIS - Search & Catalog JS (Vodafone Inspired) */

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('catalog-search-input');
    const categorySelect = document.getElementById('category-filter');
    const resultsGrid = document.getElementById('standards-grid');
    const searchBtn = document.getElementById('catalog-search-btn');
    const aiBtn = document.getElementById('hero-ai-btn');

    const toggleHeader = document.getElementById('catalog-toggle-header');
    const toggleBtn = document.getElementById('catalog-toggle-btn');

    if (toggleHeader) {
        toggleHeader.addEventListener('click', (e) => {
            if (e.target.closest('#catalog-toggle-btn') || e.target.closest('.category-select-wrapper') || e.target.closest('#category-filter')) {
                return;
            }
            toggleCatalog();
        });

        toggleHeader.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                if (document.activeElement === categorySelect) return;
                e.preventDefault();
                toggleCatalog();
            }
        });
    }

    if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleCatalog();
        });
    }

    if (categorySelect) {
        categorySelect.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        categorySelect.addEventListener('change', () => {
            toggleCatalog(true);
            performSearch(false);
        });
    }

    if (searchInput && resultsGrid) {
        let debounceTimer;

        const performSearch = async (shouldScroll = false) => {
            const query = searchInput.value.trim();
            const category = categorySelect ? categorySelect.value : 'All';

            // Auto-expand catalog when a search query is entered
            if (query || shouldScroll) {
                toggleCatalog(true);
            }

            try {
                const data = await APIClient.searchStandards(query, category);
                renderStandardsGrid(data.results, resultsGrid, query);

                // Update count badge in summary header
                const countBadge = document.getElementById('catalog-count-badge');
                if (countBadge && data && data.results) {
                    countBadge.textContent = query 
                        ? `${data.results.length} Found` 
                        : `${data.results.length} Standards`;
                }

                if (shouldScroll) {
                    const section = document.getElementById('standards-catalog-section');
                    if (section) {
                        section.scrollIntoView({ behavior: 'smooth' });
                    }
                }
            } catch (err) {
                resultsGrid.innerHTML = `<p style="color: var(--color-primary); font-weight: 600;">Failed to search standards: ${err.message}</p>`;
            }
        };

        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => performSearch(false), 250);
        });

        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                clearTimeout(debounceTimer);
                performSearch(true);
            }
        });

        if (searchBtn) {
            searchBtn.addEventListener('click', (e) => {
                e.preventDefault();
                clearTimeout(debounceTimer);
                performSearch(true);
            });
        }

        if (aiBtn) {
            aiBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const query = searchInput ? searchInput.value.trim() : '';
                if (query) {
                    window.location.href = `/assistant?q=${encodeURIComponent(query)}`;
                } else {
                    window.location.href = '/assistant';
                }
            });
        }

        // Initial background load
        performSearch(false);
    }
});

function toggleCatalog(forceState = null) {
    const collapsible = document.getElementById('catalog-collapsible-body');
    const toggleBtn = document.getElementById('catalog-toggle-btn');
    const header = document.getElementById('catalog-toggle-header');
    const toggleText = document.getElementById('catalog-toggle-text');
    const chevron = document.getElementById('catalog-chevron');

    if (!collapsible) return;

    const isCurrentlyOpen = collapsible.style.display !== 'none';
    const shouldOpen = forceState !== null ? forceState : !isCurrentlyOpen;

    if (shouldOpen) {
        collapsible.style.display = 'block';
        if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'true');
        if (header) header.setAttribute('aria-expanded', 'true');
        if (toggleText) toggleText.textContent = 'Collapse';
        if (chevron) chevron.textContent = '▴';
    } else {
        collapsible.style.display = 'none';
        if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
        if (header) header.setAttribute('aria-expanded', 'false');
        if (toggleText) toggleText.textContent = 'Explore Catalog';
        if (chevron) chevron.textContent = '▾';
    }
}

function renderStandardsGrid(standards, container, query = '') {
    if (!standards || standards.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3.5rem; color: var(--color-body);">
                <p style="font-size: 1.1rem; margin-bottom: 1rem;">🔍 No direct Indian Standards found matching <strong>"${query}"</strong>.</p>
                <p style="font-size: 0.95rem; margin-bottom: 1.5rem;">Would you like our AI Compliance Engine to analyze this product and identify applicable QCOs?</p>
                <div style="display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap;">
                    <a href="/recommend?q=${encodeURIComponent(query)}" class="btn btn-primary" style="font-size: 0.88rem;">Find Standard in Product Matcher ➔</a>
                    <a href="/assistant?q=${encodeURIComponent('What BIS standards apply to ' + query + '?')}" class="btn btn-outline" style="font-size: 0.88rem;">Ask AI Assistant ➔</a>
                </div>
            </div>
        `;
        return;
    }

    let html = '';
    standards.forEach(std => {
        html += `
            <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                    <div class="card-header">
                        <div>
                            <h3 class="card-title" style="margin: 0;">${std.isNumber}:${std.year}</h3>
                            <p class="card-subtitle" style="margin: 0.2rem 0 0 0;">${std.category}</p>
                        </div>
                        <span class="badge ${std.isMandatory ? 'badge-mandatory' : 'badge-voluntary'}">
                            ${std.isMandatory ? 'MANDATORY QCO' : 'VOLUNTARY'}
                        </span>
                    </div>
                    <p style="font-size: 0.95rem; font-weight: 600; color: var(--color-ink); margin-bottom: 0.5rem; line-height: 1.4;">${std.title}</p>
                    <p style="font-size: 0.88rem; color: var(--color-body); margin-bottom: 1.25rem; line-height: 1.6;">${std.scope}</p>
                    
                    <div style="font-size: 0.82rem; color: var(--color-body); background-color: var(--color-canvas-soft); border: 1px solid var(--color-border-light); padding: 0.75rem; border-radius: var(--radius-sm); margin-bottom: 1.25rem; line-height: 1.5;">
                        <strong style="color: var(--color-ink);">Department:</strong> ${std.department || 'General'}<br>
                        <strong style="color: var(--color-ink);">Licensing Scheme:</strong> ${std.scheme}
                    </div>
                </div>

                <a href="${std.officialUrl}" target="_blank" class="btn btn-outline-dark" style="width: 100%; font-size: 0.85rem;">
                    View Official Specification ➔
                </a>
            </div>
        `;
    });

    container.innerHTML = html;
}
