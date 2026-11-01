/* Know Your BIS - BIS Services Display JS (Vodafone Inspired) */

document.addEventListener('DOMContentLoaded', () => {
    const servicesGrid = document.getElementById('services-grid');
    if (servicesGrid) {
        loadServices();
    }
});

async function loadServices() {
    const servicesGrid = document.getElementById('services-grid');
    try {
        const data = await APIClient.getServices();
        
        if (!data || !data.services || data.services.length === 0) {
            servicesGrid.innerHTML = '<p style="color: var(--color-body);">No services found.</p>';
            return;
        }

        let html = '';
        data.services.forEach(srv => {
            html += `
                <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <div class="card-header">
                            <div>
                                <h3 class="card-title">${srv.name}</h3>
                                <p class="card-subtitle">${srv.category}</p>
                            </div>
                            ${srv.is_mandatory_available ? '<span class="badge badge-mandatory">MANDATORY SCHEMES</span>' : ''}
                        </div>
                        
                        <p style="font-size: 0.92rem; color: var(--color-body); margin-bottom: 1.25rem; line-height: 1.5;">${srv.description}</p>
                        
                        <div style="font-size: 0.85rem; background-color: var(--color-canvas-soft); border: 1px solid var(--color-border-light); padding: 0.85rem; border-radius: var(--radius-card); margin-bottom: 1.25rem;">
                            <strong style="color: var(--color-ink);">Target Audience:</strong> <span style="color: var(--color-body);">${srv.target_audience || 'Manufacturers & Citizens'}</span>
                        </div>

                        ${srv.key_steps && srv.key_steps.length > 0 ? `
                            <div style="font-size: 0.85rem; margin-bottom: 1.5rem;">
                                <strong style="color: var(--color-ink); text-transform: uppercase; letter-spacing: 0.5px; font-size: 0.78rem;">Key Implementation Steps:</strong>
                                <ol style="padding-left: 1.2rem; margin-top: 0.4rem; color: var(--color-body);">
                                    ${srv.key_steps.map(step => `<li style="margin-bottom: 0.35rem;">${step}</li>`).join('')}
                                </ol>
                            </div>
                        ` : ''}
                    </div>

                    <a href="${srv.portal_url}" target="_blank" class="btn btn-primary" style="width: 100%; font-size: 0.85rem;">
                        ACCESS OFFICIAL PORTAL ➔
                    </a>
                </div>
            `;
        });

        servicesGrid.innerHTML = html;

    } catch (err) {
        servicesGrid.innerHTML = `<p style="color: var(--color-primary); font-weight: 600;">Failed to load services: ${err.message}</p>`;
    }
}
