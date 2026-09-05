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
    /* SF Symbol: gearshape.fill (Apple Native Settings Cog) */
    settings: `
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zm7.43-2.91a8.1 8.1 0 0 0 .05-1.18c0-.4-.02-.8-.05-1.18l2.06-1.61c.19-.15.24-.42.12-.64l-1.95-3.38a.502.502 0 0 0-.61-.22l-2.43.98c-.5-.39-1.05-.72-1.64-.97l-.37-2.58a.499.499 0 0 0-.49-.41h-3.9a.5.5 0 0 0-.49.41l-.37 2.58c-.59.25-1.14.58-1.64.97l-2.43-.98a.498.498 0 0 0-.61.22L2.79 8c-.12.22-.07.49.12.64l2.06 1.61c-.03.38-.05.78-.05 1.18 0 .4.02.8.05 1.18L2.91 14.22c-.19.15-.24.42-.12.64l1.95 3.38c.12.21.38.3.61.22l2.43-.98c.5.39 1.05.72 1.64.97l.37 2.58c.05.24.25.41.49.41h3.9c.24 0 .44-.17.49-.41l.37-2.58c.59-.25 1.14-.58 1.64-.97l2.43.98c.23.09.49 0 .61-.22l1.95-3.38c.12-.22.07-.49-.12-.64l-2.06-1.61z"/>
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
        settings:     basePath === './' ? 'pages/settings/settings.html' : `${basePath}pages/settings/settings.html`
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

    /* Synchronize standalone positioning immediately after mounting or binding */
    syncStandaloneTabBar();

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
    if (!tabBar) {
        /* Retry when element is ready in DOM */
        requestAnimationFrame(syncStandaloneTabBar);
        return;
    }

    /* Clear any inline bottom property so CSS clamp(100dvh - 100lvh) governs positioning */
    tabBar.style.removeProperty('bottom');
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
        window.addEventListener('pageshow', (e) => {
            syncStandaloneTabBar();
            /* On bfcache restore, remove any stale navigation class that could block interaction */
            if (e.persisted) {
                document.body.classList.remove('tab-navigating');
            }
        });
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') syncStandaloneTabBar();
        });

        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', syncStandaloneTabBar);
        }

        setTimeout(syncStandaloneTabBar, 50);
        setTimeout(syncStandaloneTabBar, 150);
        setTimeout(syncStandaloneTabBar, 300);
        setTimeout(syncStandaloneTabBar, 600);

        /* Intercept internal anchors to prevent bouncing out to mobile Safari */
        document.addEventListener('click', (e) => {
            if (e.defaultPrevented) return;
            const anchor = e.target.closest('a');
            if (anchor && anchor.href && anchor.href.startsWith(window.location.origin)) {
                if (!anchor.getAttribute('target') && !anchor.hasAttribute('download')) {
                    const currentFullPath = window.location.pathname + window.location.search;
                    const targetUrl = new URL(anchor.href);
                    const targetFullPath = targetUrl.pathname + targetUrl.search;

                    /* Normalize root path '/' and '/index.html' */
                    const normCurrent = currentFullPath.replace(/\/index\.html$/, '/');
                    const normTarget = targetFullPath.replace(/\/index\.html$/, '/');

                    if (normCurrent === normTarget) {
                        /* Active page tapped: smoothly scroll to top without full-page reload */
                        e.preventDefault();
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        return;
                    }

                    if (!anchor.href.includes('javascript:')) {
                        e.preventDefault();
                        window.location.href = anchor.href;
                    }
                }
            }
        }, false);
    }
}
