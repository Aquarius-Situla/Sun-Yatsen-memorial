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
    /* SF Symbol: message.fill (Apple Native iMessage Speech Bubble) */
    danmaku: `
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M12 3C6.477 3 2 6.806 2 11.5C2 13.914 3.193 16.084 5.12 17.587C4.646 19.344 3.842 20.373 3.14 20.893C2.923 21.054 3.037 21.4 3.308 21.4C5.556 21.4 7.848 20.187 9.07 19.26C10.007 19.736 10.982 20 12 20C17.523 20 22 16.194 22 11.5C22 6.806 17.523 3 12 3Z"/>
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
 * iOS Standalone WebApp Viewport & Tab Bar Synchronizer
 * Fixes WebKit "chin gap" / status bar offset bug where WebKit pulls bottom: 0
 * upward by the status bar height (~59px-64px) on standalone PWA launch.
 * ============================================================================ */
export function syncStandaloneTabBar() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const isIOSStandalone = ('standalone' in window.navigator) && window.navigator.standalone;
    const isPWAStandalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;

    if (!isIOSStandalone && !isPWAStandalone) {
        return;
    }

    document.documentElement.classList.add('is-standalone');

    const tabBar = document.querySelector('.apple-tab-bar');
    if (!tabBar) return;

    /* Measure difference between physical screen height and WebKit layout viewport */
    const isPortrait = window.innerHeight >= window.innerWidth;
    const currentScreenH = isPortrait ? Math.max(window.screen.height, window.screen.width) : Math.min(window.screen.height, window.screen.width);
    const diff = currentScreenH - window.innerHeight;

    /* In WebKit standalone bug, diff equals status bar height (approx 44px - 64px).
     * When keyboard opens, diff is much larger (>200px), which must not be touched. */
    if (diff >= 10 && diff <= 120) {
        document.documentElement.style.setProperty('--tab-bar-standalone-bottom', `-${diff}px`);
        tabBar.style.setProperty('bottom', `-${diff}px`, 'important');
    } else if (diff <= 5) {
        document.documentElement.style.setProperty('--tab-bar-standalone-bottom', '0px');
        tabBar.style.removeProperty('bottom');
    }
}

/* ============================================================================
 * iOS Standalone WebApp Navigation Controller & Viewport Watcher
 * Prevents iOS WebClip from bouncing to Safari on internal anchor navigation
 * and synchronizes viewport bounds on all lifecycle milestones.
 * ============================================================================ */
if (typeof window !== 'undefined') {
    const isIOSStandalone = ('standalone' in window.navigator) && window.navigator.standalone;
    const isPWAStandalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;

    if (isIOSStandalone || isPWAStandalone) {
        /* Immediate and delayed layout stabilization */
        syncStandaloneTabBar();

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', syncStandaloneTabBar);
        }
        window.addEventListener('load', syncStandaloneTabBar);
        window.addEventListener('resize', syncStandaloneTabBar);
        window.addEventListener('orientationchange', syncStandaloneTabBar);
        window.addEventListener('pageshow', syncStandaloneTabBar);
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') syncStandaloneTabBar();
        });

        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', syncStandaloneTabBar);
            window.visualViewport.addEventListener('scroll', syncStandaloneTabBar);
        }

        setTimeout(syncStandaloneTabBar, 50);
        setTimeout(syncStandaloneTabBar, 150);
        setTimeout(syncStandaloneTabBar, 300);
        setTimeout(syncStandaloneTabBar, 600);

        /* Intercept internal anchors to prevent bouncing out to mobile Safari */
        document.addEventListener('click', (e) => {
            const anchor = e.target.closest('a');
            if (anchor && anchor.href && anchor.href.startsWith(window.location.origin)) {
                if (!anchor.getAttribute('target') && !anchor.hasAttribute('download')) {
                    const currentFullPath = window.location.pathname + window.location.search;
                    const targetUrl = new URL(anchor.href);
                    const targetFullPath = targetUrl.pathname + targetUrl.search;

                    if (targetFullPath !== currentFullPath && !anchor.href.includes('javascript:')) {
                        e.preventDefault();
                        const dest = anchor.href;
                        /* Apply fade-out, then navigate after the transition completes */
                        document.body.classList.add('tab-navigating');
                        setTimeout(() => { window.location.href = dest; }, 120);
                    }
                }
            }
        }, false);
    }
}
