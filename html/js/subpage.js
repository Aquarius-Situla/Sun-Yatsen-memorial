/* ============================================================================
 * Private Sun Yat-sen Memorial Hall — Subpage Controller (subpage.js)
 * ============================================================================
 * COMMENTING STANDARDS
 * 1. Block comments only. Inline comments (//) are strictly prohibited.
 * 2. Section dividers use the === banner format.
 * 3. All prose is written in English.
 * ============================================================================ */

/* ============================================================================
 * Markdown Styles Generator
 * ============================================================================ */
function getMarkdownStyles(isLight) {
    if (isLight) {
        return `.markdown-body {
            color: #2c1810 !important;
            background-color: transparent !important;
            font-family: -apple-system, BlinkMacSystemFont, "PingFang TC", "PingFang SC", "Microsoft JhengHei", sans-serif !important;
            line-height: 1.8;
            padding: 0 15px !important;
            overflow-wrap: break-word !important;
            word-wrap: break-word !important;
            word-break: break-all !important;
        }
        .markdown-body h1, .markdown-body h2 {
            color: #2c1810 !important;
            border-bottom-color: #c4a876 !important;
            padding-bottom: 10px;
        }
        .markdown-body a { color: #b8860b !important; text-decoration: none; }
        .markdown-body a:hover { text-decoration: underline; }
        .markdown-body ul { margin-bottom: 20px !important; }
        .markdown-body li { margin-bottom: 8px !important; }
        .markdown-body blockquote {
            border-left: 4px solid #b8860b !important;
            color: #5a3e2a !important;
            background: rgba(184,134,11,0.08) !important;
            padding: 12px 20px !important;
            border-radius: 0 6px 6px 0 !important;
        }` + (document.querySelector('.festival-hero') ? `
        .markdown-body > h1:first-child { display: none !important; }` : '');
    } else {
        return `.markdown-body {
            color: #e5e7eb !important;
            background-color: transparent !important;
            font-family: -apple-system, BlinkMacSystemFont, "PingFang TC", "PingFang SC", "Microsoft JhengHei", sans-serif !important;
            line-height: 1.8;
            padding: 0 15px !important;
            overflow-wrap: break-word !important;
            word-wrap: break-word !important;
            word-break: break-all !important;
        }
        .markdown-body h1, .markdown-body h2 {
            color: #ffffff !important;
            border-bottom-color: #333333 !important;
            padding-bottom: 10px;
        }
        .markdown-body a { color: #f1c40f !important; text-decoration: none; }
        .markdown-body a:hover { text-decoration: underline; }
        .markdown-body ul { margin-bottom: 20px !important; }
        .markdown-body li { margin-bottom: 8px !important; }
        .markdown-body blockquote {
            border-left: 4px solid #b8860b !important;
            color: #cccccc !important;
            background: rgba(184,134,11,0.07) !important;
            padding: 12px 20px !important;
            border-radius: 0 6px 6px 0 !important;
        }` + (document.querySelector('.festival-hero') ? `
        .markdown-body > h1:first-child { display: none !important; }` : '');
    }
}

import { getCurrentLang, setGlobalLang } from './modules/i18n.js?v=2021';
import { initTabBar, syncStandaloneTabBar } from './modules/tab-bar.js?v=2021';
import { setupDiagnosticTrigger } from './modules/debug-panel.js?v=2021';

/* ============================================================================
 * Subpage Initialization Engine
 * ============================================================================ */
export function initSubpage(options) {
    const {
        texts = null,
        tabs = null,
        defaultTab = null,
        activeBottomTab = null,
        basePath = '../../',
        onRendered = null
    } = options;

    /* Initialize diagnostic HUD trigger (3-tap on header) */
    setupDiagnosticTrigger();

    /* Initialize Apple Native Bottom Tab Bar if an active tab is specified */
    if (activeBottomTab) {
        initTabBar({
            activeTab: activeBottomTab,
            basePath: basePath
        });
    }

    /* Synchronize standalone viewport to eliminate chin gap on short subpages */
    syncStandaloneTabBar();

    const langBtn = document.getElementById('lang-btn');
    const mdViewer = document.getElementById('md-viewer');
    const container = document.querySelector('.markdown-container');
    const heroTitle = document.getElementById('hero-title');
    const heroDate = document.getElementById('hero-date');
    const heroDesc = document.getElementById('hero-desc');
    const pageTitle = document.getElementById('page-title');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const iosRows = document.querySelectorAll('.ios-row[data-tab]');
    const iosOptionItems = document.querySelectorAll('.ios-option-item[data-lang]');

    let isTraditional = getCurrentLang() === 'tc';
    let activeTabId = defaultTab;

    /* Check URL param for explicit override */
    const params = new URLSearchParams(window.location.search);
    if (params.get('lang') === 'sc') {
        isTraditional = false;
    } else if (params.get('lang') === 'tc') {
        isTraditional = true;
    }

    /* Initialize tab from URL if present */
    const initialTab = params.get('tab');
    if (initialTab && tabs && tabs.some(t => t.id === initialTab)) {
        activeTabId = initialTab;
    } else if (!activeTabId && tabs && tabs.length > 0) {
        activeTabId = tabs[0].id;
    }

    function updateContent() {
        document.documentElement.lang = isTraditional ? 'zh-TW' : 'zh-CN';

        if (langBtn) {
            langBtn.textContent = isTraditional ? '切换至简化字' : '切換至正體字';
        }

        /* Update iOS Inset Grouped Option Selection (e.g. Language Selector) */
        iosOptionItems.forEach(opt => {
            const optLang = opt.getAttribute('data-lang');
            const isSelected = (isTraditional && optLang === 'tc') || (!isTraditional && optLang === 'sc');
            if (isSelected) {
                opt.classList.add('selected');
            } else {
                opt.classList.remove('selected');
            }
        });

        if (tabs && tabs.length > 0) {
            /* Tabbed layout handling */
            const currentTabObj = tabs.find(t => t.id === activeTabId) || tabs[0];
            tabBtns.forEach(btn => {
                const tabId = btn.getAttribute('data-tab');
                const tabObj = tabs.find(t => t.id === tabId);
                if (tabObj) {
                    btn.textContent = isTraditional ? tabObj.labelTc : tabObj.labelSc;
                }
                if (tabId === currentTabObj.id) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });

            /* Synchronize iOS Inset Grouped Rows */
            iosRows.forEach(row => {
                const tabId = row.getAttribute('data-tab');
                const tabObj = tabs.find(t => t.id === tabId);
                if (tabObj) {
                    const titleEl = row.querySelector('.ios-row-title span') || row.querySelector('.ios-row-title');
                    if (titleEl) {
                        titleEl.textContent = isTraditional ? tabObj.labelTc : tabObj.labelSc;
                    }
                }
                if (tabId === currentTabObj.id) {
                    row.classList.add('expanded');
                } else {
                    row.classList.remove('expanded');
                }
            });

            const newSrc = isTraditional ? currentTabObj.srcTc : currentTabObj.srcSc;
            if (mdViewer && mdViewer.getAttribute('src') !== newSrc) {
                if (container) container.classList.remove('loaded');
                mdViewer.setAttribute('src', newSrc);
            }
        } else if (texts) {
            /* Standard subpage / hero banner handling */
            const t = texts[isTraditional ? 'tc' : 'sc'];
            if (langBtn && t.btn) langBtn.textContent = t.btn;
            if (heroTitle && t.title) heroTitle.textContent = t.title;
            if (heroDate && t.date) heroDate.textContent = t.date;
            if (heroDesc && t.desc) heroDesc.textContent = t.desc;
            if (pageTitle && t.pageTitle) pageTitle.textContent = t.pageTitle;

            if (mdViewer && t.src && mdViewer.getAttribute('src') !== t.src) {
                if (container) container.classList.remove('loaded');
                mdViewer.setAttribute('src', t.src);
            }
        }

        /* Synchronize Apple Native Back Button Text */
        const navBackText = document.getElementById('nav-back-text');
        const navBackLink = document.getElementById('nav-back-link');
        if (navBackText) {
            const explicitTc = navBackLink ? navBackLink.getAttribute('data-back-text-tc') : null;
            const explicitSc = navBackLink ? navBackLink.getAttribute('data-back-text-sc') : null;

            if (explicitTc && explicitSc) {
                navBackText.textContent = isTraditional ? explicitTc : explicitSc;
            } else if (window.location.pathname.includes('/events/') || window.location.pathname.includes('/announcement/')) {
                navBackText.textContent = isTraditional ? '公告' : '公告';
            } else {
                navBackText.textContent = isTraditional ? '資料庫' : '资料库';
            }
        }

        /* Synchronize Apple Native Frosted Top Navigation Bar Title */
        const topNavTitle = document.getElementById('top-nav-title');
        if (topNavTitle) {
            if (window.location.pathname.includes('/about/')) {
                topNavTitle.textContent = isTraditional ? '關於與聲明' : '关于与声明';
            } else if (window.location.pathname.includes('/thanks/')) {
                topNavTitle.textContent = isTraditional ? '特別鳴謝' : '特别鸣谢';
            } else if (window.location.pathname.includes('/biography/')) {
                topNavTitle.textContent = isTraditional ? '國父生平' : '国父生平';
            } else if (window.location.pathname.includes('/announcement/detail.html')) {
                if (texts && texts[isTraditional ? 'tc' : 'sc'] && texts[isTraditional ? 'tc' : 'sc'].title) {
                    topNavTitle.textContent = texts[isTraditional ? 'tc' : 'sc'].title;
                }
            } else if (window.location.pathname.includes('/announcement/')) {
                topNavTitle.textContent = isTraditional ? '公告' : '公告';
            } else if (window.location.pathname.includes('/library/language.html')) {
                topNavTitle.textContent = isTraditional ? '語言偏好' : '语言偏好';
            } else if (window.location.pathname.includes('/library/')) {
                topNavTitle.textContent = isTraditional ? '資料庫' : '资料库';
            } else if (texts && texts[isTraditional ? 'tc' : 'sc'] && texts[isTraditional ? 'tc' : 'sc'].title) {
                topNavTitle.textContent = texts[isTraditional ? 'tc' : 'sc'].title;
            }
        }
    }

    /* Smart Back Navigation Handler */
    const navBackBtn = document.getElementById('nav-back-link');
    if (navBackBtn) {
        navBackBtn.addEventListener('click', (e) => {
            if (window.history.length > 1 && document.referrer && document.referrer.startsWith(window.location.origin)) {
                e.preventDefault();
                window.history.back();
            }
        });
    }

    /* Option Items Event Listeners (Global Language Click) */
    iosOptionItems.forEach(opt => {
        opt.addEventListener('click', () => {
            const newLang = opt.getAttribute('data-lang');
            if (newLang === 'tc' || newLang === 'sc') {
                isTraditional = newLang === 'tc';
                setGlobalLang(newLang);
                updateContent();
            }
        });
    });

    /* General Accordion Row Click Handlers */
    const allAccordionRows = document.querySelectorAll('.ios-row[data-accordion-target]');
    allAccordionRows.forEach(row => {
        row.addEventListener('click', () => {
            const targetId = row.getAttribute('data-accordion-target');
            const targetEl = document.getElementById(targetId);
            const isExpanded = row.classList.contains('expanded');

            if (isExpanded) {
                row.classList.remove('expanded');
                if (targetEl) targetEl.classList.remove('open');
            } else {
                row.classList.add('expanded');
                if (targetEl) targetEl.classList.add('open');
            }
        });
    });

    /* Tab-switching iOS Rows */
    iosRows.forEach(row => {
        row.addEventListener('click', () => {
            const targetTab = row.getAttribute('data-tab');
            if (targetTab && targetTab !== activeTabId) {
                activeTabId = targetTab;
                updateContent();
            }
        });
    });

    /* Global Language Synchronization Listener */
    window.addEventListener('sys-lang-change', (e) => {
        if (e.detail && e.detail.lang) {
            isTraditional = e.detail.lang === 'tc';
            updateContent();
        }
    });

    if (langBtn) {
        langBtn.addEventListener('click', () => {
            isTraditional = !isTraditional;
            setGlobalLang(isTraditional ? 'tc' : 'sc');
            updateContent();
        });
    }

    if (tabBtns.length > 0 && tabs) {
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.getAttribute('data-tab');
                if (targetTab && targetTab !== activeTabId) {
                    activeTabId = targetTab;
                    updateContent();
                }
            });
        });
    }

    if (mdViewer) {
        mdViewer.addEventListener('zero-md-rendered', () => {
            if (container) container.classList.add('loaded');
            if (mdViewer.shadowRoot) {
                const links = mdViewer.shadowRoot.querySelectorAll('a');
                links.forEach(link => {
                    const href = link.getAttribute('href');
                    if (href && href.startsWith('http')) {
                        link.setAttribute('target', '_blank');
                        link.setAttribute('rel', 'noopener noreferrer');
                    }
                });
            }
            if (typeof onRendered === 'function') {
                onRendered({ isTraditional, activeTabId, mdViewer });
            }
        });
    }

    /* Page Navigation & Back Transition */
    const topBackBtn = document.querySelector('.top-back-btn');
    if (topBackBtn) {
        topBackBtn.addEventListener('click', function(e) {
            e.preventDefault();
            document.body.classList.add('page-transition');
            setTimeout(() => {
                const currentParams = new URLSearchParams(window.location.search);
                if (currentParams.get('from') === 'announcement') {
                    window.location.href = '../../pages/announcement/announcement.html?tab=memorial';
                } else {
                    window.location.href = this.getAttribute('href') || this.href;
                }
            }, 300);
        });
    }

    /* Theme Switcher for Zero-MD */
    const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: light)');
    function updateMarkdownTheme() {
        if (!mdViewer) return;
        const isLight = colorSchemeQuery.matches;
        const template = mdViewer.querySelector('template');
        if (template) {
            const link = template.content.querySelector('link');
            if (link) {
                link.href = isLight
                    ? 'https://cdn.jsdelivr.net/gh/sindresorhus/github-markdown-css@4/github-markdown.css'
                    : 'https://cdn.jsdelivr.net/gh/sindresorhus/github-markdown-css@4/github-markdown-dark.css';
            }
            const style = template.content.querySelector('style');
            if (style) {
                style.textContent = getMarkdownStyles(isLight);
            }
        }
        const currentSrc = mdViewer.getAttribute('src');
        if (currentSrc) {
            mdViewer.removeAttribute('src');
            requestAnimationFrame(() => mdViewer.setAttribute('src', currentSrc));
        }
    }

    colorSchemeQuery.addEventListener('change', updateMarkdownTheme);
    if (colorSchemeQuery.matches) {
        updateMarkdownTheme();
    }

    /* Initial Render */
    updateContent();

    return {
        isTraditional: () => isTraditional,
        setTraditional: (val) => {
            isTraditional = !!val;
            updateContent();
        },
        getActiveTab: () => activeTabId,
        setActiveTab: (tabId) => {
            activeTabId = tabId;
            updateContent();
        },
        updateContent
    };
}
