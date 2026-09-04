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
    /* SF Symbol: house.fill (Image 1 Apple Podcasts '首頁') */
    home: `
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.1a1.2 1.2 0 0 0-.85.35L2.6 10.9a1.2 1.2 0 0 0 .85 2.05H4v7.75c0 .66.54 1.2 1.2 1.2h13.6c.66 0 1.2-.54 1.2-1.2V12.95h.55a1.2 1.2 0 0 0 .85-2.05L12.85 2.45A1.2 1.2 0 0 0 12 2.1z"/>
        </svg>
    `,
    /* SF Symbol: square.grid.2x2.fill (Image 1 Apple Podcasts '瀏覽') */
    announcement: `
        <svg viewBox="0 0 24 24" fill="currentColor">
            <rect x="2.5" y="2.5" width="8.5" height="8.5" rx="2.5"/>
            <rect x="13" y="2.5" width="8.5" height="8.5" rx="2.5"/>
            <rect x="2.5" y="13" width="8.5" height="8.5" rx="2.5"/>
            <rect x="13" y="13" width="8.5" height="8.5" rx="2.5"/>
        </svg>
    `,
    /* SF Symbol: Apple Podcasts Library Tray Silhouette with Archive Records Emblem */
    library: `
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 2a1.2 1.2 0 0 0-1.2 1.2V4h12.4v-.8A1.2 1.2 0 0 0 17 2H7z"/>
            <path d="M5 5.5A1.2 1.2 0 0 0 3.8 6.7V7.5h16.4v-.8A1.2 1.2 0 0 0 19 5.5H5z"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M3.4 9A1.4 1.4 0 0 0 2 10.45l1.15 9.2A2.4 2.4 0 0 0 5.53 21.8h12.94a2.4 2.4 0 0 0 2.38-2.15l1.15-9.2A1.4 1.4 0 0 0 20.6 9H3.4zm5.1 3.5a.75.75 0 0 1 .75-.75h5.5a.75.75 0 0 1 0 1.5h-5.5a.75.75 0 0 1-.75-.75zm0 3a.75.75 0 0 1 .75-.75h5.5a.75.75 0 0 1 0 1.5h-5.5a.75.75 0 0 1-.75-.75zm1.5 3a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75z"/>
        </svg>
    `,
    /* SF Symbol: bubble.left.and.bubble.right.fill (Apple Native Speech Stream / Danmaku) */
    danmaku: `
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 3.5c3.86 0 7 2.69 7 6 0 1.73-.85 3.28-2.21 4.32.14.79.6 1.86 1.29 2.45.1.09.05.26-.1.28-1.56.17-2.77-.45-3.42-.9-.46.07-.94.1-1.44.1-.22 0-.44-.01-.65-.03A5.95 5.95 0 0 1 16.75 13c0-3.71-3.25-6.72-7.25-6.72-.43 0-.85.04-1.27.11.91-1.68 4.09-2.89 7.77-2.89z"/>
            <path d="M9.5 7.5C5.36 7.5 2 10.19 2 13.5c0 1.73.85 3.28 2.21 4.32-.14.79-.6 1.86-1.29 2.45-.1.09-.05.26.1.28 1.56.17 2.77-.45 3.42-.9.55.08 1.13.12 1.8.12 4.14 0 7.5-2.69 7.5-6s-3.36-6-7.5-6z"/>
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
        library:      basePath === './' ? 'pages/library/library.html' : `${basePath}pages/library/library.html`,
        danmaku:      basePath === './' ? 'index.html?open=danmaku' : `${basePath}index.html?open=danmaku`
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

    /* Interactive click handling for Danmaku sheet trigger */
    tabBarEl.addEventListener('click', (e) => {
        const danmakuItem = e.target.closest('[data-tab-id="danmaku"]');
        if (danmakuItem) {
            const messageModal = document.getElementById('message-modal');
            if (messageModal) {
                e.preventDefault();
                messageModal.classList.add('active');
                const messageInput = document.getElementById('message-input');
                if (messageInput) {
                    setTimeout(() => messageInput.focus(), 150);
                }
            }
        }
    });

    return tabBarEl;
}

/* ============================================================================
 * iOS Standalone WebApp Navigation Controller
 * Prevents iOS WebClip from bouncing to Safari on internal anchor navigation
 * ============================================================================ */
if (typeof window !== 'undefined') {
    const isIOSStandalone = ('standalone' in window.navigator) && window.navigator.standalone;
    const isPWAStandalone = window.matchMedia('(display-mode: standalone)').matches;

    if (isIOSStandalone || isPWAStandalone) {
        document.addEventListener('click', (e) => {
            const anchor = e.target.closest('a');
            if (anchor && anchor.href && anchor.href.startsWith(window.location.origin)) {
                if (!anchor.getAttribute('target') && !anchor.hasAttribute('download')) {
                    const currentFullPath = window.location.pathname + window.location.search;
                    const targetUrl = new URL(anchor.href);
                    const targetFullPath = targetUrl.pathname + targetUrl.search;

                    if (targetFullPath !== currentFullPath && !anchor.href.includes('javascript:')) {
                        e.preventDefault();
                        window.location.href = anchor.href;
                    }
                }
            }
        }, false);
    }
}
