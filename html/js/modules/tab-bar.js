/* ============================================================================
 * Private Sun Yat-sen Memorial Hall — Bottom Tab Bar Component (tab-bar.js)
 * ============================================================================
 * COMMENTING STANDARDS
 * 1. Block comments only. Inline comments are strictly prohibited.
 * 2. Section dividers use the === banner format.
 * 3. All prose is written in English.
 * ============================================================================ */

import { getCurrentLang, TAB_DEFINITIONS, syncTabBarLabels } from './i18n.js';
import { showActivityIndicator, hideActivityIndicator } from './activity-indicator.js?v=20260906k';
import { ensurePageStylesheets, resolveSiteUrl, getTabFromUrl } from './desktop-shell.js?v=20260906k';

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
    }
}

/* ============================================================================
 * Section 3: Apple Mobile Tab Bar Dynamic Transition & Activity Indicator
 * ============================================================================ */

let isNavigatingMobile = false;

/* Canonical root routes mapped to absolute site paths */
const CANONICAL_TAB_ROUTES = {
    home: 'index.html',
    announcement: 'pages/announcement/announcement.html',
    library: 'pages/library/library.html',
    settings: 'pages/settings/settings.html'
};

/* Localized Top Nav Titles for Instant Header Display */
const MOBILE_TOP_NAV_TITLES = {
    tc: {
        announcement: '公告',
        library: '資料庫',
        settings: '設定'
    },
    sc: {
        announcement: '公告',
        library: '数据库',
        settings: '设置'
    }
};

/**
 * Executes Apple native mobile tab transition:
 * 1. Instantly highlights clicked tab in bottom bar
 * 2. Instantly mounts / updates frosted top nav bar (for subpages) or hides it (for home)
 * 3. Shows centered Apple daisy spinner (UIActivityIndicatorView) in between bars
 * 4. Asynchronously fetches target page, isolates stylesheets, and smoothly injects content
 * @param {string} targetHref - The destination URL
 * @param {boolean} pushState - Whether to record in browser history
 */
export async function navigateMobileTab(targetHref, pushState = true) {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    if (window.innerWidth > 768) return;

    let targetTab = getTabFromUrl(targetHref);
    let targetUrl;
    if (targetTab && CANONICAL_TAB_ROUTES[targetTab]) {
        targetUrl = new URL(resolveSiteUrl(CANONICAL_TAB_ROUTES[targetTab]));
    } else {
        targetUrl = new URL(targetHref, window.location.href);
        targetTab = getTabFromUrl(targetUrl.href);
    }

    if (!targetTab) {
        window.location.href = targetUrl.href;
        return;
    }

    const tabBarEl = document.getElementById('apple-tab-bar');
    const activeItem = tabBarEl ? tabBarEl.querySelector('.tab-item.active') : null;
    const currentTab = activeItem ? activeItem.getAttribute('data-tab-id') : null;

    /* Normalize current and target paths */
    const normCurrent = (window.location.pathname + window.location.search).replace(/\/index\.html$/, '/');
    const normTarget = (targetUrl.pathname + targetUrl.search).replace(/\/index\.html$/, '/');

    /* If tapping active page, smoothly scroll to top without reload */
    if (normCurrent === normTarget || (currentTab === targetTab && normCurrent.endsWith('/') && normTarget.endsWith('/'))) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    if (isNavigatingMobile) return;
    isNavigatingMobile = true;
    const safetyTimer = setTimeout(() => { isNavigatingMobile = false; }, 4000);

    /* 1. Instantly update active tab in bottom bar & canonicalize links */
    if (tabBarEl) {
        const items = tabBarEl.querySelectorAll('.tab-item');
        items.forEach(it => {
            const itTab = it.getAttribute('data-tab-id');
            if (itTab && CANONICAL_TAB_ROUTES[itTab]) {
                it.href = resolveSiteUrl(CANONICAL_TAB_ROUTES[itTab]);
            }
            if (itTab === targetTab) {
                it.classList.add('active');
            } else {
                it.classList.remove('active');
            }
        });
    }

    /* 2. Instantly mount / update Apple Frosted Top Navigation Bar */
    let topNav = document.querySelector('.apple-top-nav');
    if (targetTab === 'home') {
        if (topNav) topNav.style.display = 'none';
    } else {
        if (!topNav) {
            topNav = document.createElement('header');
            topNav.className = 'apple-top-nav';
            topNav.innerHTML = '<h1 class="nav-title" id="top-nav-title"></h1>';
            document.body.insertBefore(topNav, document.body.firstChild);
        }
        topNav.style.display = 'flex';
        const titleEl = topNav.querySelector('#top-nav-title');
        if (titleEl) {
            const lang = getCurrentLang();
            const dict = MOBILE_TOP_NAV_TITLES[lang] || MOBILE_TOP_NAV_TITLES.tc;
            titleEl.textContent = dict[targetTab] || '';
        }
    }

    /* 3. Instantly isolate stylesheets and hide old page content */
    const isHome = targetTab === 'home';
    ensurePageStylesheets(isHome);

    const oldContentSelectors = '.ios-group-container, .container, .markdown-container, .festival-hero, .top-hover-trigger, .memorial-banner, .status-banner';
    const oldContents = document.querySelectorAll(oldContentSelectors);
    oldContents.forEach(el => {
        el.style.opacity = '0';
        el.style.pointerEvents = 'none';
    });

    /* 4. Display centered Apple daisy spinner (UIActivityIndicatorView) */
    const indicatorEl = showActivityIndicator(document.body);

    try {
        const fetchCtrl = new AbortController();
        const timeoutId = setTimeout(() => fetchCtrl.abort(), 8000);
        const res = await fetch(targetUrl.href, { signal: fetchCtrl.signal });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');

        /* 5. Synchronize document title and browser history */
        if (pushState) {
            window.history.pushState({ tabId: targetTab }, doc.title, targetUrl.href);
        }
        document.title = doc.title;

        /* 6. Synchronize body classes */
        document.body.className = doc.body.className;

        /* 7. Remove old content nodes */
        oldContents.forEach(el => {
            if (el.parentNode) el.parentNode.removeChild(el);
        });

        /* 8. Extract and inject target page nodes */
        const fragment = document.createDocumentFragment();
        const newNodes = Array.from(doc.body.childNodes);
        newNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
                const tag = node.tagName.toLowerCase();
                if (tag === 'script' || tag === 'style' || tag === 'link') return;
                if (node.id === 'bg-music' || node.id === 'apple-tab-bar' || node.id === 'desktop-sidebar') return;
                if (node.classList && (node.classList.contains('apple-top-nav') || node.classList.contains('apple-tab-bar'))) return;
            }
            fragment.appendChild(node.cloneNode(true));
        });

        if (tabBarEl) {
            document.body.insertBefore(fragment, tabBarEl);
        } else {
            document.body.appendChild(fragment);
        }

        window.scrollTo(0, 0);

        /* 9. Execute target page scripts */
        if (isHome) {
            if (typeof window.initApp === 'function') {
                try {
                    window.initApp();
                } catch (e) {
                    console.error('[Mobile Home Init Error]:', e);
                }
            }
        } else {
            const inlineModules = doc.querySelectorAll('body script[type="module"]:not([src])');
            inlineModules.forEach(oldScript => {
                const newScript = document.createElement('script');
                newScript.type = 'module';
                newScript.textContent = oldScript.textContent;
                document.body.appendChild(newScript);
            });
        }

        /* 10. Smoothly dismiss activity indicator */
        hideActivityIndicator(document.body);
    } catch (err) {
        console.error('[Mobile Tab Router Error]:', err);
        window.location.href = targetUrl.href;
    } finally {
        clearTimeout(safetyTimer);
        isNavigatingMobile = false;
    }
}

/* ============================================================================
 * Section 4: Mobile Event Listeners & History Controller
 * ============================================================================ */
if (typeof window !== 'undefined') {
    /* Intercept mobile tab bar clicks */
    document.addEventListener('click', (e) => {
        if (window.innerWidth > 768) return;
        const tabItem = e.target.closest('#apple-tab-bar .tab-item');
        if (tabItem) {
            const tabId = tabItem.getAttribute('data-tab-id');
            const targetHref = (tabId && CANONICAL_TAB_ROUTES[tabId])
                ? resolveSiteUrl(CANONICAL_TAB_ROUTES[tabId])
                : tabItem.getAttribute('href');
            if (targetHref && !targetHref.startsWith('#') && !targetHref.startsWith('javascript:')) {
                e.preventDefault();
                navigateMobileTab(targetHref, true);
                return;
            }
        }

        /* Non-tab internal anchors in standalone PWA mode */
        const isIOSStandalone = ('standalone' in window.navigator) && window.navigator.standalone;
        const isPWAStandalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
        if (isIOSStandalone || isPWAStandalone) {
            const anchor = e.target.closest('a');
            if (anchor && anchor.href && anchor.href.startsWith(window.location.origin)) {
                if (!anchor.getAttribute('target') && !anchor.hasAttribute('download')) {
                    const currentFullPath = window.location.pathname + window.location.search;
                    const targetUrl = new URL(anchor.href);
                    const targetFullPath = targetUrl.pathname + targetUrl.search;

                    const normCurrent = currentFullPath.replace(/\/index\.html$/, '/');
                    const normTarget = targetFullPath.replace(/\/index\.html$/, '/');

                    if (normCurrent === normTarget) {
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
        }
    }, false);

    /* Seamless browser back/forward navigation on mobile */
    window.addEventListener('popstate', () => {
        if (window.innerWidth <= 768) {
            navigateMobileTab(window.location.href, false);
        }
    });
}
