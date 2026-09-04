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
 * Authentic Apple SF Symbols Vector Icons (24x24 Pixel-Perfect Fill Glyphs)
 * ============================================================================ */
export const TAB_ICONS = {
    /* SF Symbol: house.fill */
    home: `
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.707 2.293a1 1 0 0 0-1.414 0l-9 9A1 1 0 0 0 3 13h1v7a2 2 0 0 0 2 2h4a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h4a2 2 0 0 0 2-2v-7h1a1 1 0 0 0 .707-1.707l-9-9z"/>
        </svg>
    `,
    /* SF Symbol: bell.fill */
    announcement: `
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2a2 2 0 0 0-2 2c0 .06.003.119.008.177C6.862 4.793 4.5 7.632 4.5 11v3.414l-1.707 1.707A1 1 0 0 0 3.5 18h17a1 1 0 0 0 .707-1.879L19.5 14.414V11c0-3.368-2.362-6.207-5.508-6.823.005-.058.008-.117.008-.177a2 2 0 0 0-2-2zm-2.5 17a2.5 2.5 0 0 0 5 0h-5z"/>
        </svg>
    `,
    /* SF Symbol: book.fill */
    biography: `
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 4.5c-1.85-1.5-4.5-1.5-7.5-1.5A1 1 0 0 0 3.5 4v13.5a1 1 0 0 0 1 1c2.85 0 5.4.3 7 1.5 1.6-1.2 4.15-1.5 7-1.5a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1c-3 0-5.65 0-7.5 1.5zm-1 12.8c-1.5-.9-3.8-1.3-6.5-1.3V5.5c2.5 0 4.8.3 6.5 1.4v10.4zm2 0V6.9c1.7-1.1 4-1.4 6.5-1.4v10.5c-2.7 0-5 .4-6.5 1.3z"/>
        </svg>
    `,
    /* SF Symbol: info.circle.fill */
    about: `
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
        </svg>
    `,
    /* SF Symbol: heart.fill */
    thanks: `
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
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
