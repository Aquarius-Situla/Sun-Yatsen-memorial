/* ============================================================================
 * Private Sun Yat-sen Memorial Hall — Bottom Tab Bar Component (tab-bar.js)
 * ============================================================================
 * COMMENTING STANDARDS
 * 1. Block comments only. Inline comments are strictly prohibited.
 * 2. Section dividers use the === banner format.
 * 3. All prose is written in English.
 * ============================================================================ */

import { getCurrentLang, TAB_DEFINITIONS, syncTabBarLabels } from './i18n.js?v=20260907a';
import { showActivityIndicator, hideActivityIndicator } from './activity-indicator.js?v=20260907a';
import { resolveSiteUrl, getTabFromUrl } from './desktop-shell.js?v=20260907a';
import { isMobileLayout, isDesktopLayout } from './device-detect.js?v=20260907a';

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
        /* Sync existing static element active states and bilingual labels */
        const allTabs = tabBarEl.querySelectorAll('.tab-item');
        allTabs.forEach(t => {
            if (t.getAttribute('data-tab-id') === activeTab) {
                t.classList.add('active');
            } else {
                t.classList.remove('active');
            }
        });
        syncTabBarLabels(tabBarEl);
    }

    /* Listen for language change events globally */
    window.addEventListener('sys-lang-change', () => {
        syncTabBarLabels(tabBarEl);
    });

    /* Synchronize standalone positioning immediately after mounting or binding */
    syncStandaloneTabBar();

    /* If on a subpage, mark body and hide tab bar on mobile */
    if (isSubpageRoute()) {
        document.body.classList.add('is-subpage');
        if (tabBarEl && isMobileLayout()) {
            tabBarEl.style.setProperty('display', 'none', 'important');
        }
    }

    return tabBarEl;
}

/* ============================================================================
 * Subpage Route Detection Helper
 * ============================================================================ */
export function isSubpageRoute(pathname) {
    const p = (pathname || (typeof window !== 'undefined' ? window.location.pathname : '')).toLowerCase();
    if (p.includes('/detail.html') ||
        p.includes('/biography/') ||
        p.includes('/events/') ||
        p.includes('/about/') ||
        p.includes('/thanks/') ||
        p.includes('/language.html')) {
        return true;
    }
    if (typeof document !== 'undefined') {
        if (document.body && (document.body.classList.contains('is-subpage') || document.body.classList.contains('page-subpage'))) {
            return true;
        }
        if (document.querySelector('.nav-back-link')) {
            return true;
        }
    }
    return false;
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
 * Section 3: Apple Mobile Tab Bar Tap Feedback & Instant Activity Indicator
 * ============================================================================ */

/* Canonical root routes mapped to absolute site paths */
const CANONICAL_TAB_ROUTES = {
    home: 'index.html',
    announcement: 'pages/announcement/announcement.html',
    library: 'pages/library/library.html',
    settings: 'pages/settings/settings.html'
};

/* Top Navigation Bar Titles for Mobile Tabs */
const MOBILE_TOP_TITLES = {
    tc: {
        home: '',
        announcement: '公告',
        library: '資料庫',
        settings: '設定',
        biography: '傳記',
        xinhai: '辛亥特展',
        whampoa: '黃埔特展',
        mayfourth: '五四特展',
        militaries: '軍事特展',
        about: '關於本館',
        thanks: '特別鳴謝'
    },
    sc: {
        home: '',
        announcement: '公告',
        library: '资料库',
        settings: '设置',
        biography: '传记',
        xinhai: '辛亥特展',
        whampoa: '黄埔特展',
        mayfourth: '五四特展',
        militaries: '军事特展',
        about: '关于本馆',
        thanks: '特别鸣谢'
    }
};

/* Synchronize Tab Bar and Top Nav on Navigation */
export function updateMobileNavState(targetTabId) {
    const onSubpage = isSubpageRoute();

    /* If currently on a subpage, keep bottom tab bar hidden and top nav visible */
    if (onSubpage) {
        document.body.classList.add('is-subpage');
        const tabBar = document.getElementById('apple-tab-bar');
        if (tabBar && isMobileLayout()) {
            tabBar.style.setProperty('display', 'none', 'important');
        }
        const topNav = document.querySelector('.apple-top-nav');
        if (topNav) {
            if (isMobileLayout()) {
                topNav.classList.remove('nav-hidden');
                topNav.style.removeProperty('display');
                topNav.style.setProperty('display', 'flex', 'important');
            } else {
                topNav.style.setProperty('display', 'none', 'important');
            }
        }
        return;
    }

    /* Map subpage pseudo-tabs to canonical bottom tabs */
    let activeBottomTabId = targetTabId;
    if (targetTabId === 'biography' || targetTabId === 'xinhai' || targetTabId === 'whampoa' || targetTabId === 'mayfourth' || targetTabId === 'militaries') {
        activeBottomTabId = 'library';
    } else if (targetTabId === 'about' || targetTabId === 'thanks') {
        activeBottomTabId = 'settings';
    }

    /* 1. Instant tab bar selection state feedback: extinguish current tab, illuminate target tab */
    const allTabs = document.querySelectorAll('#apple-tab-bar .tab-item');
    allTabs.forEach(t => {
        if (t.getAttribute('data-tab-id') === activeBottomTabId) {
            t.classList.add('active');
        } else {
            t.classList.remove('active');
        }
    });

    /* 2. Instant Top Navigation Bar update & Clean Unloading of Home Elements */
    let topNav = document.querySelector('.apple-top-nav');
    if (targetTabId === 'home') {
        if (topNav) {
            topNav.classList.add('nav-hidden');
            topNav.style.setProperty('display', 'none', 'important');
        }
        /* Restore home top elements */
        const homeTopTrigger = document.querySelector('.top-hover-trigger');
        if (homeTopTrigger) {
            homeTopTrigger.classList.remove('nav-hidden');
            homeTopTrigger.style.removeProperty('display');
            homeTopTrigger.style.removeProperty('opacity');
            homeTopTrigger.style.removeProperty('visibility');
            homeTopTrigger.style.removeProperty('pointer-events');
        }
        const mobileArrow = document.getElementById('mobile-arrow-btn');
        if (mobileArrow) {
            mobileArrow.classList.remove('nav-hidden');
            mobileArrow.style.removeProperty('display');
            mobileArrow.style.removeProperty('opacity');
            mobileArrow.style.removeProperty('visibility');
            mobileArrow.style.removeProperty('pointer-events');
        }
        const dropdownNav = document.querySelector('.dropdown-nav-bar');
        if (dropdownNav) {
            dropdownNav.classList.remove('nav-hidden');
            dropdownNav.style.removeProperty('display');
            dropdownNav.style.removeProperty('opacity');
            dropdownNav.style.removeProperty('visibility');
            dropdownNav.style.removeProperty('pointer-events');
        }
    } else {
        /* Immediately unload and hide Home page dropdown navigation bar, arrow hint, and status banners */
        const homeElementsToHide = [
            document.querySelector('.top-hover-trigger'),
            document.getElementById('mobile-arrow-btn'),
            document.querySelector('.dropdown-nav-bar'),
            document.getElementById('memorial-banner'),
            document.getElementById('sit-down-banner')
        ];
        homeElementsToHide.forEach(el => {
            if (el) {
                el.classList.add('nav-hidden');
                el.style.setProperty('display', 'none', 'important');
                el.style.setProperty('opacity', '0', 'important');
                el.style.setProperty('visibility', 'hidden', 'important');
                el.style.setProperty('pointer-events', 'none', 'important');
            }
        });

        if (!topNav) {
            topNav = document.createElement('header');
            topNav.className = 'apple-top-nav';
            topNav.innerHTML = '<h1 class="nav-title" id="top-nav-title"></h1>';
            document.body.insertBefore(topNav, document.body.firstChild);
        }
        if (isMobileLayout()) {
            topNav.classList.remove('nav-hidden');
            topNav.style.setProperty('display', 'flex', 'important');
        } else {
            topNav.style.setProperty('display', 'none', 'important');
        }
        const titleEl = topNav.querySelector('#top-nav-title');
        if (titleEl) {
            const lang = getCurrentLang();
            const dict = MOBILE_TOP_TITLES[lang] || MOBILE_TOP_TITLES.tc;
            titleEl.textContent = dict[targetTabId] || dict[activeBottomTabId] || '';
        }
    }
}

/* Prefetch target URL helper */
function prefetchUrl(url) {
    if (!url) return;
    try {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        document.head.appendChild(link);
    } catch (err) {
        /* Silently ignore prefetch issues */
    }
}

/* ============================================================================
 * Section 4: Mobile Event Listeners & Clean Navigation Controller
 * ============================================================================ */
if (typeof window !== 'undefined') {
    let isMobileNavigating = false;

    function navigateMobile(targetHref, targetTabId) {
        if (!targetHref || targetHref.startsWith('#') || targetHref.startsWith('javascript:')) return;

        const currentPath = window.location.pathname.replace(/\/index\.html$/, '/');
        const targetUrl = new URL(targetHref, window.location.href);
        const targetPath = targetUrl.pathname.replace(/\/index\.html$/, '/');

        /* If tapping the currently active tab on the same page, smooth scroll to top */
        if (currentPath === targetPath) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        if (isMobileNavigating) return;
        isMobileNavigating = true;

        /* 1. Mark body as navigating */
        document.body.classList.add('tab-navigating');

        /* 2. Instant visual feedback: extinguish this page's tab, light up target tab, hide home arrow/banner */
        updateMobileNavState(targetTabId);

        /* 3. Instant center activity indicator */
        showActivityIndicator(document.body);

        /* 4. Let browser engine render the updated frame before full navigation */
        requestAnimationFrame(() => {
            setTimeout(() => {
                window.location.href = targetHref;
            }, 50);
        });
    }

    /* Expose globally for cross-module integration */
    window.__triggerMobileNav = (targetHref, targetTabId) => {
        updateMobileNavState(targetTabId);
        window.location.href = targetHref;
    };

    /* Instant tactile visual feedback on physical touch contact */
    document.addEventListener('touchstart', (e) => {
        if (isDesktopLayout()) return;
        const tabItem = e.target.closest('#apple-tab-bar .tab-item');
        if (!tabItem) return;

        const tabId = tabItem.getAttribute('data-tab-id');
        const targetHref = (tabId && CANONICAL_TAB_ROUTES[tabId])
            ? resolveSiteUrl(CANONICAL_TAB_ROUTES[tabId])
            : tabItem.getAttribute('href');

        if (!targetHref || targetHref.startsWith('#') || targetHref.startsWith('javascript:')) return;

        const currentPath = window.location.pathname.replace(/\/index\.html$/, '/');
        const targetUrl = new URL(targetHref, window.location.href);
        const targetPath = targetUrl.pathname.replace(/\/index\.html$/, '/');

        if (currentPath === targetPath) return;

        /* Instantly extinguish active tab on physical touchdown */
        updateMobileNavState(tabId);
        showActivityIndicator(document.body);
        prefetchUrl(targetHref);
    }, { passive: true });

    /* Click on tab bar: trigger clean navigation */
    document.addEventListener('click', (e) => {
        if (isDesktopLayout()) return;
        const tabItem = e.target.closest('#apple-tab-bar .tab-item');
        if (!tabItem) return;

        const tabId = tabItem.getAttribute('data-tab-id');
        const targetHref = (tabId && CANONICAL_TAB_ROUTES[tabId])
            ? resolveSiteUrl(CANONICAL_TAB_ROUTES[tabId])
            : tabItem.getAttribute('href');

        if (!targetHref || targetHref.startsWith('#') || targetHref.startsWith('javascript:')) return;

        e.preventDefault();
        navigateMobile(targetHref, tabId);
    }, false);

    /* Click on Home page navigation links leaving Home (e.g. dropdown menu or banners):
     * Unload Home top elements and extinguish Home bottom tab without blocking subpages */
    document.addEventListener('click', (e) => {
        if (isDesktopLayout()) return;
        if (e.target.closest('#apple-tab-bar')) return;

        const currentPath = window.location.pathname.replace(/\/index\.html$/, '/');
        const isHomePage = currentPath.endsWith('/') || currentPath.endsWith('/sys-memorial/') || currentPath.includes('index.html');
        if (!isHomePage) {
            /* On subpages and hub menus, allow instant native navigation into subpages without outside spinner */
            return;
        }

        const targetLink = e.target.closest('.dropdown-nav-bar a, #nav-festival-banner, [data-home-nav]');
        if (!targetLink) return;

        let href = targetLink.getAttribute('href') || targetLink.getAttribute('data-href');
        if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

        try {
            const targetUrl = new URL(href, window.location.href);
            if (targetUrl.origin !== window.location.origin) return;

            const targetPath = targetUrl.pathname.replace(/\/index\.html$/, '/');
            if (currentPath === targetPath) return;

            const matchedTab = getTabFromUrl(targetUrl.href) || 'library';

            /* Immediately unload Home arrow & banners and extinguish Home tab */
            updateMobileNavState(matchedTab);

            /* For canonical main tabs, show full-page indicator; for subpages, navigate directly so subpage spins inside */
            if (targetUrl.pathname.endsWith('/announcement.html') || targetUrl.pathname.endsWith('/library.html') || targetUrl.pathname.endsWith('/settings.html')) {
                showActivityIndicator(document.body);
            }

            e.preventDefault();
            window.location.href = targetUrl.href;
        } catch (err) {
            /* Fallback to default browser handling */
        }
    }, false);

    /* Restore pristine state on page restore (bfcache) */
    window.addEventListener('pageshow', () => {
        isMobileNavigating = false;
        document.body.classList.remove('tab-navigating');
        hideActivityIndicator(document.body);

        /* Subpages: ensure bottom tab bar is hidden and top nav is visible */
        if (isSubpageRoute()) {
            document.body.classList.add('is-subpage');
            const topNav = document.querySelector('.apple-top-nav');
            if (topNav) {
                if (isMobileLayout()) {
                    topNav.classList.remove('nav-hidden');
                    topNav.style.removeProperty('display');
                    topNav.style.setProperty('display', 'flex', 'important');
                } else {
                    topNav.style.setProperty('display', 'none', 'important');
                }
            }
            const tabBar = document.getElementById('apple-tab-bar');
            if (tabBar && isMobileLayout()) {
                tabBar.style.setProperty('display', 'none', 'important');
            }
            return;
        }

        /* Hub menu pages: restore bottom tab bar */
        const tabBar = document.getElementById('apple-tab-bar');
        if (tabBar) {
            tabBar.style.removeProperty('display');
        }

        /* Re-sync active tab and top nav according to the restored page's true URL */
        const path = window.location.pathname.toLowerCase();
        let currentTab = 'home';
        if (path.includes('/announcement/')) currentTab = 'announcement';
        else if (path.includes('/library/')) currentTab = 'library';
        else if (path.includes('/settings/')) currentTab = 'settings';
        else if (path.includes('index.html') || path.endsWith('/') || path.endsWith('/sys-memorial/')) currentTab = 'home';
        updateMobileNavState(currentTab);
    });
}
