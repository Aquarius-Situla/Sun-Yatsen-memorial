/* ============================================================================
 * Private Sun Yat-sen Memorial Hall — Bottom Tab Bar Component (tab-bar.js)
 * ============================================================================
 * COMMENTING STANDARDS
 * 1. Block comments only. Inline comments (//) are strictly prohibited.
 * 2. Section dividers use the === banner format.
 * 3. All prose is written in English.
 * ============================================================================ */

import { getCurrentLang, TAB_DEFINITIONS, syncTabBarLabels } from './i18n.js';

/* ============================================================================
 * Standard Apple Native Tab Bar SVG Icons
 * ============================================================================ */
export const TAB_ICONS = {
    home: `
        <svg viewBox="0 0 24 24">
            <path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1v-9.5z"/>
        </svg>
    `,
    announcement: `
        <svg viewBox="0 0 24 24">
            <path d="M11 5L6 9H2v6h4l5 4V5z"/>
            <path d="M15.54 8.46a5 5 0 010 7.07"/>
            <path d="M19.07 4.93a10 10 0 010 14.14"/>
        </svg>
    `,
    biography: `
        <svg viewBox="0 0 24 24">
            <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
            <line x1="9" y1="7" x2="15" y2="7"/>
            <line x1="9" y1="11" x2="15" y2="11"/>
        </svg>
    `,
    about: `
        <svg viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <circle cx="12" cy="8" r="0.5" fill="currentColor"/>
        </svg>
    `,
    thanks: `
        <svg viewBox="0 0 24 24">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
        </svg>
    `
};

/* ============================================================================
 * Dynamic Tab Bar Injector & Controller
 * ============================================================================ */
export function initTabBar(options = {}) {
    const {
        activeTab = 'home',
        basePath = './'
    } = options;

    let tabBarEl = document.getElementById('apple-tab-bar');

    /* Build Tab URL routing dictionary */
    const routes = {
        home:         basePath === './' ? 'index.html' : `${basePath}index.html`,
        announcement: basePath === './' ? 'pages/announcement/announcement.html' : `${basePath}pages/announcement/announcement.html`,
        biography:    basePath === './' ? 'pages/biography/biography.html' : `${basePath}pages/biography/biography.html`,
        about:        basePath === './' ? 'pages/about/about.html' : `${basePath}pages/about/about.html`,
        thanks:       basePath === './' ? 'pages/thanks/thanks.html' : `${basePath}pages/thanks/thanks.html`
    };

    /* Inject DOM if not already statically rendered */
    if (!tabBarEl) {
        tabBarEl = document.createElement('nav');
        tabBarEl.id = 'apple-tab-bar';
        tabBarEl.className = 'apple-tab-bar';
        tabBarEl.setAttribute('role', 'navigation');
        tabBarEl.setAttribute('aria-label', '底部主選單');

        const currentLang = getCurrentLang();
        const tabs = TAB_DEFINITIONS[currentLang] || TAB_DEFINITIONS.tc;

        tabBarEl.innerHTML = tabs.map(tab => {
            const isActive = tab.id === activeTab;
            const iconSvg = TAB_ICONS[tab.id] || '';
            const href = routes[tab.id] || '#';

            return `
                <a href="${href}" class="tab-item ${isActive ? 'active' : ''}" data-tab-id="${tab.id}" aria-label="${tab.label}">
                    <div class="tab-icon">${iconSvg}</div>
                    <div class="tab-label">${tab.label}</div>
                </a>
            `;
        }).join('');

        document.body.appendChild(tabBarEl);
    } else {
        /* Sync existing static element */
        syncTabBarLabels(tabBarEl);
    }

    /* Listen for language change events globally */
    window.addEventListener('sys-lang-change', () => {
        syncTabBarLabels(tabBarEl);
    });

    return tabBarEl;
}
