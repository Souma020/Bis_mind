/* Know Your BIS - Main Application JS */

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    highlightActiveNav();
    initMobileNav();
});

// Theme Switcher Logic
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeToggleUI(savedTheme);

    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            if (window.KYBSetTheme) {
                window.KYBSetTheme(newTheme);
            } else {
                document.documentElement.setAttribute('data-theme', newTheme);
                localStorage.setItem('theme', newTheme);
            }
            updateThemeToggleUI(newTheme);
        });
    }
}

function updateThemeToggleUI(theme) {
    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn && !toggleBtn.querySelector('.sun')) {
        toggleBtn.innerHTML = theme === 'dark'
            ? '☀️ '
            : '🌙 ';
    }
}

// Active Nav Link Highlighting
function highlightActiveNav() {
    const rawPath = window.location.pathname.toLowerCase();
    let normalized = rawPath;
    if (normalized.endsWith('/index.html') || normalized === '' || normalized === '/') {
        normalized = '/';
    } else {
        normalized = normalized.replace(/^\/pages\//, '/').replace(/\.html$/, '');
    }

    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        const href = (link.getAttribute('href') || '').toLowerCase();
        let linkNorm = href.replace(/^\/pages\//, '/').replace(/\.html$/, '');
        if (linkNorm === '' || linkNorm.endsWith('/index')) linkNorm = '/';

        if (normalized === '/' && linkNorm === '/') {
            link.classList.add('active');
        } else if (linkNorm !== '/' && normalized.startsWith(linkNorm)) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Mobile Hamburger Navigation Drawer
function initMobileNav() {
    const navToggle = document.getElementById('nav-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (!navToggle || !navLinks) return;

    function toggleMenu(forceClose = false) {
        const isOpen = forceClose ? false : !navLinks.classList.contains('open');
        navLinks.classList.toggle('open', isOpen);
        navToggle.classList.toggle('active', isOpen);
        navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }

    navToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMenu();
    });

    // Close when clicking any nav link
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            toggleMenu(true);
        });
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (!navLinks.contains(e.target) && !navToggle.contains(e.target)) {
            toggleMenu(true);
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            toggleMenu(true);
        }
    });
}

// Toast Notifications Helper
function showToast(message, type = 'info') {
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    const bgColor = type === 'error' ? '#e60000' : '#25282b';
    toast.style.cssText = `
        background-color: ${bgColor};
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        font-size: 0.9rem;
        font-weight: 500;
        border: 1px solid rgba(255, 255, 255, 0.2);
        animation: fadeIn 0.3s ease;
    `;
    toast.textContent = message;

    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 4000);
}

window.showToast = showToast;
