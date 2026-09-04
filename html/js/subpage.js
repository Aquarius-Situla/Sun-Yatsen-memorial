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
        }`;
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
        }`;
    }
}

/* ============================================================================
 * Subpage Initialization Engine
 * ============================================================================ */
export function initSubpage(options) {
    const {
        texts = null,
        tabs = null,
        defaultTab = null,
        onRendered = null
    } = options;

    const langBtn = document.getElementById('lang-btn');
    const mdViewer = document.getElementById('md-viewer');
    const container = document.querySelector('.markdown-container');
    const heroTitle = document.getElementById('hero-title');
    const heroDate = document.getElementById('hero-date');
    const pageTitle = document.getElementById('page-title');
    const tabBtns = document.querySelectorAll('.tab-btn');

    let isTraditional = true;
    let activeTabId = defaultTab;

    /* Check URL param for language */
    const params = new URLSearchParams(window.location.search);
    if (params.get('lang') === 'sc') {
        isTraditional = false;
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
            if (pageTitle && t.pageTitle) pageTitle.textContent = t.pageTitle;

            if (mdViewer && t.src && mdViewer.getAttribute('src') !== t.src) {
                if (container) container.classList.remove('loaded');
                mdViewer.setAttribute('src', t.src);
            }
        }
    }

    if (langBtn) {
        langBtn.addEventListener('click', () => {
            isTraditional = !isTraditional;
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
