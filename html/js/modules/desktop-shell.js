/* ============================================================================
 * Private Sun Yat-sen Memorial Hall — Apple Desktop Shell Controller (desktop-shell.js)
 * ============================================================================
 * COMMENTING STANDARDS
 * 1. Block comments only. Inline comments are strictly prohibited.
 * 2. Section dividers use the === banner format.
 * 3. All prose is written in English.
 * ============================================================================ */

import { getCurrentLang, TAB_DEFINITIONS, syncTabBarLabels } from './i18n.js?v=20260906q';
import { TAB_ICONS } from './tab-bar.js?v=20260906q';
import { showActivityIndicator, hideActivityIndicator } from './activity-indicator.js?v=20260906q';

/* ============================================================================
 * Global Search Index (Covers all memorial topics, exhibits, and settings)
 * ============================================================================ */
const SEARCH_INDEX = [
    {
        id: 'home',
        titleTc: '紀念大廳 · 瞻仰行禮',
        titleSc: '纪念大厅 · 瞻仰行礼',
        categoryTc: '主頁',
        categorySc: '主页',
        url: 'index.html',
        icon: '🏛️',
        keywords: ['主頁', '主页', '行禮', '行礼', '遺像', '遗像', '遺囑', '遗嘱', '三鞠躬', '首頁', '首页']
    },
    {
        id: 'announcement',
        titleTc: '最新館務公告與動態',
        titleSc: '最新馆务公告与动态',
        categoryTc: '公告',
        categorySc: '公告',
        url: 'pages/announcement/announcement.html',
        icon: '📢',
        keywords: ['公告', '動態', '动态', '最新', '通知', '開放', '开放', '系統', '系统']
    },
    {
        id: 'library',
        titleTc: '文獻資料庫總覽',
        titleSc: '文献数据库总览',
        categoryTc: '資料庫',
        categorySc: '数据库',
        url: 'pages/library/library.html',
        icon: '📚',
        keywords: ['資料庫', '数据库', '文獻', '文献', '檔案', '档案', '史料']
    },
    {
        id: 'biography',
        titleTc: '國父生平傳記與年譜',
        titleSc: '国父生平传记与年谱',
        categoryTc: '傳記',
        categorySc: '传记',
        url: 'pages/biography/biography.html',
        icon: '📜',
        keywords: ['生平', '傳記', '传记', '年譜', '年谱', '孫中山', '孙中山', '孫文', '孙文', '總理', '总理', '三民主義', '三民主义']
    },
    {
        id: 'xinhai',
        titleTc: '辛亥革命特展 · 走向共和',
        titleSc: '辛亥革命特展 · 走向共和',
        categoryTc: '特展',
        categorySc: '特展',
        url: 'events/xinhai/xinhai.html',
        icon: '⚔️',
        keywords: ['辛亥', '革命', '武昌', '起義', '起义', '共和', '中華民國', '中华民国', '推翻帝制']
    },
    {
        id: 'whampoa',
        titleTc: '黃埔建軍特展 · 崢嶸歲月',
        titleSc: '黄埔建军特展 · 峥嵘岁月',
        categoryTc: '特展',
        categorySc: '特展',
        url: 'events/whampoa/whampoa.html',
        icon: '🎖️',
        keywords: ['黃埔', '黄埔', '軍校', '军校', '建軍', '建军', '校歌', '東征', '东征', '北伐', '陸軍', '陆军']
    },
    {
        id: 'mayfourth',
        titleTc: '五四運動特展 · 思想新潮',
        titleSc: '五四运动特展 · 思想新潮',
        categoryTc: '特展',
        categorySc: '特展',
        url: 'events/mayfourth/mayfourth.html',
        icon: '🕊️',
        keywords: ['五四', '運動', '运动', '新文化', '德先生', '賽先生', '赛先生', '青年', '學生', '学生']
    },
    {
        id: 'militaries',
        titleTc: '革命軍事歷程 · 抗戰勝利',
        titleSc: '革命军事历程 · 抗战胜利',
        categoryTc: '特展',
        categorySc: '特展',
        url: 'events/militaries/militaries.html',
        icon: '🛡️',
        keywords: ['軍事', '军事', '抗戰', '抗战', '三軍', '三军', '勝利', '胜利', '國軍', '国军']
    },
    {
        id: 'yatsen-birth',
        titleTc: '國父誕辰紀念特展',
        titleSc: '国父诞辰纪念特展',
        categoryTc: '紀念',
        categorySc: '纪念',
        url: 'events/yatsen/yatsen-birth.html',
        icon: '🎂',
        keywords: ['誕辰', '诞辰', '生日', '11月12日', '十一月十二日']
    },
    {
        id: 'yatsen-passing',
        titleTc: '國父逝世紀念 · 植樹節',
        titleSc: '国父逝世纪念 · 植树节',
        categoryTc: '紀念',
        categorySc: '纪念',
        url: 'events/yatsen/yatsen-passing.html',
        icon: '🌲',
        keywords: ['逝世', '3月12日', '三月十二日', '植樹節', '植树节']
    },
    {
        id: 'language',
        titleTc: '語言偏好設定 (正體/簡化字)',
        titleSc: '语言偏好设置 (正体/简化字)',
        categoryTc: '設定',
        categorySc: '设置',
        url: 'pages/library/language.html',
        icon: '🌐',
        keywords: ['語言', '语言', '繁體', '繁体', '簡體', '简体', '正體', '正体', '字體', '字体']
    },
    {
        id: 'settings',
        titleTc: '系統偏好與設定',
        titleSc: '系统偏好与设置',
        categoryTc: '設定',
        categorySc: '设置',
        url: 'pages/settings/settings.html',
        icon: '⚙️',
        keywords: ['設定', '设置', '偏好', '系統', '系统']
    },
    {
        id: 'about',
        titleTc: '關於本館與聲明',
        titleSc: '关于本馆与声明',
        categoryTc: '關於',
        categorySc: '关于',
        url: 'pages/about/about.html',
        icon: 'ℹ️',
        keywords: ['關於', '关于', '聲明', '声明', '本館', '本馆', '宗旨', '更新日誌', '更新日志']
    },
    {
        id: 'thanks',
        titleTc: '特別鳴謝名錄',
        titleSc: '特别鸣谢名录',
        categoryTc: '鳴謝',
        categorySc: '鸣谢',
        url: 'pages/thanks/thanks.html',
        icon: '🙏',
        keywords: ['鳴謝', '鸣谢', '感謝', '感谢', '貢獻', '贡献', '志工', '名錄', '名录']
    }
];

/* ============================================================================
 * Language Strings Dictionary for Desktop Sidebar
 * ============================================================================ */
const SIDEBAR_STRINGS = {
    tc: {
        brand: '私立中山紀念堂',
        searchPlaceholder: '搜尋',
        menuHeader: '導航',
        exhibitsHeader: '歷史特展',
        home: '主頁',
        announcement: '最新公告',
        library: '文獻資料庫',
        settings: '系統設定',
        exhibitXinhai: '辛亥革命風雲',
        exhibitWhampoa: '黃埔建軍歲月',
        exhibitMayfourth: '五四新文化運動',
        exhibitBiography: '國父生平傳記',
        statusAttendance: '總參典：',
        unitAttendance: '人次',
        noResults: '無相符搜尋結果'
    },
    sc: {
        brand: '私立中山纪念堂',
        searchPlaceholder: '搜索',
        menuHeader: '导航',
        exhibitsHeader: '历史特展',
        home: '主页',
        announcement: '最新公告',
        library: '文献数据库',
        settings: '系统设置',
        exhibitXinhai: '辛亥革命风云',
        exhibitWhampoa: '黄埔建军岁月',
        exhibitMayfourth: '五四新文化运动',
        exhibitBiography: '国父生平传记',
        statusAttendance: '总参典：',
        unitAttendance: '人次',
        noResults: '无相符搜索结果'
    }
};

/* ============================================================================
 * Desktop Split View Router Helpers & Core Architecture
 * ============================================================================ */

/* Dynamically determine and cache the root base URL of the site */
function computeSiteBaseUrl() {
    const loc = window.location;
    const path = loc.pathname;
    const markerRegex = new RegExp('^(.*\\/)(?:pages|events|captcha|main|css|js)\\/', 'i');
    const match = path.match(markerRegex);
    if (match) {
        return new URL(match[1], loc.origin).href;
    }
    const dir = path.substring(0, path.lastIndexOf('/') + 1);
    return new URL(dir || '/', loc.origin).href;
}

const siteBaseUrl = computeSiteBaseUrl();

function getSiteBaseUrl() {
    return siteBaseUrl;
}

/* Resolve a site-root-relative path to an absolute URL */
export function resolveSiteUrl(relPath) {
    return new URL(relPath, getSiteBaseUrl()).href;
}

/* Map URL to canonical sidebar tab ID */
export function getTabFromUrl(url) {
    const path = new URL(url, window.location.href).pathname.toLowerCase();
    if (path.includes('/biography/')) return 'biography';
    if (path.includes('/events/xinhai/')) return 'xinhai';
    if (path.includes('/events/whampoa/')) return 'whampoa';
    if (path.includes('/events/mayfourth/')) return 'mayfourth';
    if (path.includes('/events/militaries/')) return 'militaries';
    if (path.includes('/events/yatsen/yatsen-birth.html')) return 'yatsen-birth';
    if (path.includes('/events/yatsen/yatsen-passing.html')) return 'yatsen-passing';
    if (path.includes('/pages/library/language.html')) return 'settings';
    if (path.includes('/pages/library/')) return 'library';
    if (path.includes('/pages/settings/')) return 'settings';
    if (path.includes('/pages/about/') || path.includes('/pages/thanks/')) return 'settings';
    if (path.includes('/pages/announcement/')) return 'announcement';
    if (path.includes('index.html') || path.endsWith('/') || path.endsWith('/sys-memorial/')) return 'home';
    return null;
}

/* Ensure stylesheet isolation between home and subpages */
export function ensurePageStylesheets(isHome) {
    if (window.innerWidth <= 768) return;

    let homeLink = document.getElementById('sys-style-home');
    if (!homeLink) {
        homeLink = document.querySelector('link[href*="main/style.css"]');
        if (homeLink) {
            homeLink.id = 'sys-style-home';
        } else {
            homeLink = document.createElement('link');
            homeLink.id = 'sys-style-home';
            homeLink.rel = 'stylesheet';
            document.head.appendChild(homeLink);
        }
    }
    homeLink.href = resolveSiteUrl('main/style.css?v=20260906q');

    let subpageLink = document.getElementById('sys-style-subpage');
    if (!subpageLink) {
        subpageLink = document.querySelector('link[href*="subpage.css"]');
        if (subpageLink) {
            subpageLink.id = 'sys-style-subpage';
        } else {
            subpageLink = document.createElement('link');
            subpageLink.id = 'sys-style-subpage';
            subpageLink.rel = 'stylesheet';
            document.head.appendChild(subpageLink);
        }
    }
    subpageLink.href = resolveSiteUrl('css/components/subpage.css?v=20260906q');

    let varLink = document.getElementById('sys-style-variables');
    if (!varLink) {
        varLink = document.querySelector('link[href*="variables.css"]');
        if (varLink) {
            varLink.id = 'sys-style-variables';
        } else {
            varLink = document.createElement('link');
            varLink.id = 'sys-style-variables';
            varLink.rel = 'stylesheet';
            document.head.insertBefore(varLink, document.head.firstChild);
        }
    }
    varLink.href = resolveSiteUrl('css/variables.css?v=20260906q');

    let baseLink = document.getElementById('sys-style-base');
    if (!baseLink) {
        baseLink = document.querySelector('link[href*="base.css"]');
        if (baseLink) {
            baseLink.id = 'sys-style-base';
        } else {
            baseLink = document.createElement('link');
            baseLink.id = 'sys-style-base';
            baseLink.rel = 'stylesheet';
            document.head.insertBefore(baseLink, document.head.firstChild);
        }
    }
    baseLink.href = resolveSiteUrl('css/base.css?v=20260906q');

    let indLink = document.getElementById('sys-style-activity');
    if (!indLink) {
        indLink = document.querySelector('link[href*="activity-indicator.css"]');
        if (indLink) {
            indLink.id = 'sys-style-activity';
        } else {
            indLink = document.createElement('link');
            indLink.id = 'sys-style-activity';
            indLink.rel = 'stylesheet';
            document.head.appendChild(indLink);
        }
    }
    indLink.href = resolveSiteUrl('css/components/activity-indicator.css?v=20260906q');

    if (isHome) {
        homeLink.disabled = false;
        subpageLink.disabled = true;
    } else {
        homeLink.disabled = true;
        subpageLink.disabled = false;
    }
}

/* Ensure right-hand content stage container exists */
function ensureStageContainer() {
    if (window.innerWidth <= 768) return null;

    let stage = document.getElementById('desktop-stage');
    if (stage) return stage;

    stage = document.createElement('main');
    stage.id = 'desktop-stage';
    stage.className = 'desktop-stage';

    const sidebar = document.getElementById('desktop-sidebar');
    const nodesToMove = [];
    const children = Array.from(document.body.childNodes);

    children.forEach(node => {
        if (node === sidebar) return;
        if (node.nodeType === Node.ELEMENT_NODE) {
            const tag = node.tagName.toLowerCase();
            if (tag === 'script' || tag === 'style' || tag === 'link') return;
            if (node.id === 'bg-music') return;
            if (node.classList && (node.classList.contains('apple-top-nav') || node.classList.contains('apple-tab-bar'))) return;
        }
        nodesToMove.push(node);
    });

    nodesToMove.forEach(node => stage.appendChild(node));
    document.body.appendChild(stage);
    return stage;
}

/* Extract content to be injected into the stage from a parsed Document */
function extractStageContent(doc) {
    const docStage = doc.getElementById('desktop-stage');
    if (docStage) {
        return docStage.innerHTML;
    }

    const tempWrapper = document.createElement('div');
    const nodes = Array.from(doc.body.childNodes);
    nodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
            const tag = node.tagName.toLowerCase();
            if (tag === 'script' || tag === 'style' || tag === 'link') return;
            if (node.id === 'desktop-sidebar' || node.id === 'bg-music') return;
            if (node.classList && (node.classList.contains('apple-top-nav') || node.classList.contains('apple-tab-bar'))) return;
        }
        tempWrapper.appendChild(node.cloneNode(true));
    });
    return tempWrapper.innerHTML;
}

/* Synchronize sidebar navigation active indicator and item states */
function syncSidebarActiveState(sidebarEl, activeTab) {
    if (!sidebarEl || !activeTab) return;
    const navItems = sidebarEl.querySelectorAll('.desktop-nav-item');
    navItems.forEach(item => {
        if (item.getAttribute('data-sidebar-tab') === activeTab) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

/* Execute scripts associated with target page */
async function executeStageScripts(doc, targetUrl) {
    /* If target page contains zero-md and it is not registered, dynamically load it */
    if (doc.querySelector('zero-md') && !window.customElements.get('zero-md')) {
        const zeroMdUrl = resolveSiteUrl('js/zero-md.min.js');
        try {
            await import(zeroMdUrl);
        } catch (err) {
            console.error('[Router Zero-MD Load Error]:', err);
        }
    }

    const isHome = getTabFromUrl(targetUrl) === 'home';
    if (isHome) {
        if (typeof window.initApp === 'function') {
            try {
                window.initApp();
            } catch (err) {
                console.error('[Router Home Init Error]:', err);
            }
        }
        return;
    }

    /* Execute inline module scripts extracted from target document */
    const inlineModules = doc.querySelectorAll('body script[type="module"]:not([src])');
    inlineModules.forEach(oldScript => {
        const newScript = document.createElement('script');
        newScript.type = 'module';
        newScript.textContent = oldScript.textContent;
        document.body.appendChild(newScript);
        setTimeout(() => {
            if (newScript.parentNode) {
                newScript.parentNode.removeChild(newScript);
            }
        }, 300);
    });
}

/* Desktop Split Stage Navigator */
let isNavigatingStage = false;

export async function navigateDesktopStage(targetHref, pushState = true) {
    if (window.innerWidth <= 768) {
        window.location.href = targetHref;
        return;
    }

    const targetUrl = new URL(targetHref, window.location.href);

    /* Don't re-navigate to the exact same URL without hash */
    if (targetUrl.pathname === window.location.pathname && targetUrl.search === window.location.search && !targetUrl.hash) {
        return;
    }

    if (isNavigatingStage) return;
    isNavigatingStage = true;
    const safetyTimer = setTimeout(() => { isNavigatingStage = false; }, 4000);

    const targetTab = getTabFromUrl(targetUrl.href);

    /* 1. Instant indicator glide with fluid Apple Music compression physics */
    if (window.__glideNavIndicator && targetTab) {
        window.__glideNavIndicator(targetTab);
    }
    const sidebarEl = document.getElementById('desktop-sidebar');
    syncSidebarActiveState(sidebarEl, targetTab);

    /* 2. Fade out current desktop stage */
    const stage = ensureStageContainer();
    stage.classList.add('stage-fading');

    try {
        const fetchCtrl = new AbortController();
        const timeoutId = setTimeout(() => fetchCtrl.abort(), 8000);
        let fetchCompleted = false;

        const resPromise = fetch(targetUrl.href, { signal: fetchCtrl.signal })
            .then(res => {
                clearTimeout(timeoutId);
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.text();
            });

        resPromise.then(() => { fetchCompleted = true; }).catch(() => {});

        /* Wait 120ms for stage fade out animation to finish */
        await new Promise(resolve => setTimeout(resolve, 120));

        /* If content has not arrived yet, reveal centered native Apple activity indicator */
        let indicatorEl = null;
        if (!fetchCompleted) {
            stage.innerHTML = '';
            indicatorEl = showActivityIndicator(stage);
            stage.classList.remove('stage-fading');
        }

        const html = await resPromise;
        const doc = new DOMParser().parseFromString(html, 'text/html');

        /* 3. Synchronize browser history and document title */
        if (pushState) {
            window.history.pushState({ url: targetUrl.href }, doc.title, targetUrl.href);
        }
        document.title = doc.title;

        /* 4. Switch stylesheets between home and subpages WHILE STAGE IS FULLY INVISIBLE */
        const isHome = targetTab === 'home';
        ensurePageStylesheets(isHome);

        /* 5. Synchronize document.body classes */
        document.body.className = doc.body.className;
        document.body.classList.add('has-desktop-sidebar', 'has-desktop-indicator');
        if (isHome) {
            document.body.classList.add('is-desktop-home');
            document.body.classList.remove('is-desktop-subpage');
        } else {
            document.body.classList.remove('is-desktop-home');
            document.body.classList.add('is-desktop-subpage');
        }

        /* 6. Extract stage content from parsed document */
        const newContent = extractStageContent(doc);

        /* If indicator was showing, fade it out smoothly */
        if (indicatorEl) {
            hideActivityIndicator(stage);
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        stage.classList.add('stage-fading');
        stage.innerHTML = newContent;
        window.scrollTo(0, 0);

        /* 7. Execute scripts associated with the new page */
        await executeStageScripts(doc, targetUrl.href);

        /* 8. Allow browser engine to calculate layout and apply styles before revealing */
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

        /* 9. Fade fully-styled stage back in */
        stage.classList.remove('stage-fading');

        /* 10. Sync sidebar active state and language labels */
        syncSidebarActiveState(sidebarEl, targetTab);
        syncSidebarLabels(sidebarEl);
        if (window.__syncIndicatorPosition) {
            window.__syncIndicatorPosition();
        }
    } catch (err) {
        console.error('[Stage Navigation Fallback]:', err);
        window.location.href = targetUrl.href;
    } finally {
        clearTimeout(safetyTimer);
        isNavigatingStage = false;
    }
}

/* Attach Delegated Router Listeners */
let isRouterBound = false;

function setupDesktopRouter(sidebarEl, basePath) {
    ensureStageContainer();

    if (isRouterBound) return;
    isRouterBound = true;

    /* Delegated internal link click handler for desktop */
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        window.__lastClick = {
            target: e.target ? e.target.tagName : null,
            button: e.button,
            innerWidth: window.innerWidth,
            hasLink: !!link,
            href: link ? link.getAttribute('href') : null
        };

        if (!link) return;
        if (window.innerWidth <= 768) return;
        if (e.button !== 0 && typeof e.button === 'number') return;
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;

        const href = link.getAttribute('href');
        if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
        if (link.getAttribute('target') === '_blank' || link.hasAttribute('download')) return;

        const targetUrl = new URL(href, window.location.href);
        if (targetUrl.origin !== window.location.origin) return;

        /* External anchor or hash only */
        if (targetUrl.pathname === window.location.pathname && targetUrl.search === window.location.search && targetUrl.hash) {
            return;
        }

        /* Prevent reload if clicking the current page */
        if (targetUrl.pathname === window.location.pathname && targetUrl.search === window.location.search && !targetUrl.hash) {
            e.preventDefault();
            return;
        }

        e.preventDefault();
        navigateDesktopStage(targetUrl.href, true);
    });

    /* Browser back/forward button support */
    window.addEventListener('popstate', () => {
        if (window.innerWidth <= 768) return;
        navigateDesktopStage(window.location.href, false);
    });
}

/* ============================================================================
 * Desktop Shell Initialization Controller
 * ============================================================================ */
export function initDesktopShell(options = {}) {
    /* Mobile isolation guard: desktop shell is strictly disabled on mobile screens */
    if (window.innerWidth <= 768) {
        if (!window.__desktopShellResizeBound) {
            window.__desktopShellResizeBound = true;
            window.addEventListener('resize', () => {
                if (window.innerWidth > 768) {
                    initDesktopShell(options);
                }
            });
        }
        return;
    }

    let {
        activeTab = 'home',
        basePath = './'
    } = options;

    /* Smart automatic tab detection based on current URL */
    const path = window.location.pathname.toLowerCase();
    if (path.includes('/biography/')) {
        activeTab = 'biography';
    } else if (path.includes('/events/xinhai/')) {
        activeTab = 'xinhai';
    } else if (path.includes('/events/whampoa/')) {
        activeTab = 'whampoa';
    } else if (path.includes('/events/mayfourth/')) {
        activeTab = 'mayfourth';
    } else if (path.includes('/events/militaries/')) {
        activeTab = 'militaries';
    } else if (path.includes('/events/yatsen/yatsen-birth.html')) {
        activeTab = 'yatsen-birth';
    } else if (path.includes('/events/yatsen/yatsen-passing.html')) {
        activeTab = 'yatsen-passing';
    } else if (path.includes('/pages/library/language.html')) {
        activeTab = 'settings';
    } else if (path.includes('/pages/library/')) {
        activeTab = 'library';
    } else if (path.includes('/pages/settings/')) {
        activeTab = 'settings';
    } else if (path.includes('/pages/about/') || path.includes('/pages/thanks/')) {
        activeTab = 'settings';
    } else if (path.includes('/pages/announcement/')) {
        activeTab = 'announcement';
    } else if (path.includes('index.html') || path.endsWith('/') || path.endsWith('/sys-memorial/')) {
        activeTab = 'home';
    }

    /* Add layout helper class to body for wide desktop viewports */
    document.body.classList.add('has-desktop-sidebar');
    if (activeTab === 'home') {
        document.body.classList.add('is-desktop-home');
        document.body.classList.remove('is-desktop-subpage');
    } else {
        document.body.classList.remove('is-desktop-home');
        document.body.classList.add('is-desktop-subpage');
    }

    /* Ensure head links (manifest, icons, splash, stylesheets) are absolute to prevent 404/CORS when pushState alters location */
    const headLinks = document.querySelectorAll('link[rel*="icon"], link[rel="manifest"], link[rel*="startup"], link[rel*="stylesheet"]');
    const slashSlash = String.fromCharCode(47, 47);
    headLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && !href.includes(slashSlash) && !href.startsWith('/')) {
            let cleanPath = href;
            while (cleanPath.startsWith('../')) {
                cleanPath = cleanPath.substring(3);
            }
            while (cleanPath.startsWith('./')) {
                cleanPath = cleanPath.substring(2);
            }
            link.href = resolveSiteUrl(cleanPath);
        }
    });

    /* Ensure content stage container exists and stylesheets are properly isolated */
    ensureStageContainer();
    ensurePageStylesheets(activeTab === 'home');

    /* Check if sidebar already exists */
    let sidebarEl = document.getElementById('desktop-sidebar');
    if (sidebarEl && sidebarEl.dataset.initialized === 'true') {
        syncSidebarActiveState(sidebarEl, activeTab);
        syncSidebarLabels(sidebarEl);
        if (window.__syncIndicatorPosition) {
            window.__syncIndicatorPosition();
        }
        return;
    }

    if (!sidebarEl) {
        sidebarEl = createSidebarElement(activeTab, basePath);
        document.body.insertBefore(sidebarEl, document.body.firstChild);
    }

    sidebarEl.dataset.initialized = 'true';

    /* Setup Apple-style dynamic red indicator transition */
    setupAnimatedNavIndicator(sidebarEl, activeTab);

    /* Bind Search Input and Dropdown */
    setupDesktopSearch(sidebarEl, basePath);

    /* Sync Sidebar Language Labels */
    syncSidebarLabels(sidebarEl);

    /* Sync Status Display with Live Calendar & Attendance */
    syncSidebarStatus(sidebarEl);

    /* Setup Desktop Split View Stage and Router */
    if (window.innerWidth > 768) {
        setupDesktopRouter(sidebarEl, basePath);
    }

    /* Listen for Global Language Changes */
    window.addEventListener('sys-lang-change', () => {
        syncSidebarLabels(sidebarEl);
    });

    /* Re-sync indicator and stage on window resize */
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            ensureStageContainer();
            if (window.__syncIndicatorPosition) {
                window.__syncIndicatorPosition();
            }
        }
    });
}

/* ============================================================================
 * DOM Factory: Create Sidebar Node
 * ============================================================================ */
function createSidebarElement(activeTab, basePath) {
    const currentLang = getCurrentLang();
    const str = SIDEBAR_STRINGS[currentLang] || SIDEBAR_STRINGS.tc;

    const routes = {
        home: resolveSiteUrl('index.html'),
        announcement: resolveSiteUrl('pages/announcement/announcement.html'),
        library: resolveSiteUrl('pages/library/library.html'),
        settings: resolveSiteUrl('pages/settings/settings.html'),
        xinhai: resolveSiteUrl('events/xinhai/xinhai.html'),
        whampoa: resolveSiteUrl('events/whampoa/whampoa.html'),
        mayfourth: resolveSiteUrl('events/mayfourth/mayfourth.html'),
        biography: resolveSiteUrl('pages/biography/biography.html')
    };

    const aside = document.createElement('aside');
    aside.id = 'desktop-sidebar';
    aside.className = 'desktop-sidebar';
    aside.setAttribute('role', 'navigation');
    aside.setAttribute('aria-label', '桌面端導航側欄');

    aside.innerHTML = `
        <div class="desktop-sidebar-top">
            <!-- Brand Header -->
            <a href="${routes.home}" class="desktop-sidebar-brand">
                <div class="desktop-sidebar-brand-icon">🏛️</div>
                <div class="desktop-sidebar-brand-text" id="desktop-brand-text">${str.brand}</div>
            </a>

            <!-- Apple Music Search Box -->
            <div class="desktop-search-box">
                <div class="desktop-search-input-wrapper">
                    <svg viewBox="0 0 24 24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input type="text" class="desktop-search-input" id="desktop-search-input" placeholder="${str.searchPlaceholder}" autocomplete="off">
                </div>
                <div class="desktop-search-dropdown" id="desktop-search-dropdown"></div>
            </div>

            <!-- Primary Navigation Section (The 4 Core Tabs) -->
            <div class="desktop-nav-section">
                <div class="desktop-nav-header" id="desktop-menu-header">${str.menuHeader}</div>
                <a href="${routes.home}" class="desktop-nav-item ${activeTab === 'home' ? 'active' : ''}" data-sidebar-tab="home">
                    ${TAB_ICONS.home}
                    <span class="desktop-nav-label" id="label-nav-home">${str.home}</span>
                </a>
                <a href="${routes.announcement}" class="desktop-nav-item ${activeTab === 'announcement' ? 'active' : ''}" data-sidebar-tab="announcement">
                    ${TAB_ICONS.announcement}
                    <span class="desktop-nav-label" id="label-nav-announcement">${str.announcement}</span>
                </a>
                <a href="${routes.library}" class="desktop-nav-item ${activeTab === 'library' ? 'active' : ''}" data-sidebar-tab="library">
                    ${TAB_ICONS.library}
                    <span class="desktop-nav-label" id="label-nav-library">${str.library}</span>
                </a>
                <a href="${routes.settings}" class="desktop-nav-item ${activeTab === 'settings' ? 'active' : ''}" data-sidebar-tab="settings">
                    ${TAB_ICONS.settings}
                    <span class="desktop-nav-label" id="label-nav-settings">${str.settings}</span>
                </a>
            </div>

            <!-- Subgroup: Historical Exhibitions -->
            <div class="desktop-nav-section">
                <div class="desktop-nav-header" id="desktop-exhibits-header">${str.exhibitsHeader}</div>
                <a href="${routes.biography}" class="desktop-nav-item ${activeTab === 'biography' ? 'active' : ''}" data-sidebar-tab="biography">
                    <svg viewBox="0 0 24 24"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/></svg>
                    <span class="desktop-nav-label" id="label-exhibit-biography">${str.exhibitBiography}</span>
                </a>
                <a href="${routes.xinhai}" class="desktop-nav-item ${activeTab === 'xinhai' ? 'active' : ''}" data-sidebar-tab="xinhai">
                    <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                    <span class="desktop-nav-label" id="label-exhibit-xinhai">${str.exhibitXinhai}</span>
                </a>
                <a href="${routes.whampoa}" class="desktop-nav-item ${activeTab === 'whampoa' ? 'active' : ''}" data-sidebar-tab="whampoa">
                    <svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
                    <span class="desktop-nav-label" id="label-exhibit-whampoa">${str.exhibitWhampoa}</span>
                </a>
                <a href="${routes.mayfourth}" class="desktop-nav-item ${activeTab === 'mayfourth' ? 'active' : ''}" data-sidebar-tab="mayfourth">
                    <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                    <span class="desktop-nav-label" id="label-exhibit-mayfourth">${str.exhibitMayfourth}</span>
                </a>
            </div>
        </div>

        <!-- Sidebar Footer Status (Apple Profile Style) -->
        <div class="desktop-sidebar-bottom">
            <div class="desktop-profile-card">
                <div class="desktop-profile-avatar">🏛️</div>
                <div class="desktop-profile-info">
                    <div class="desktop-profile-name" id="desktop-brand-title">私立中山紀念堂</div>
                    <div class="desktop-profile-status" id="desktop-status-text">總參典人次：...</div>
                </div>
            </div>
        </div>
    `;

    return aside;
}

/* ============================================================================
 * Search Interaction Engine
 * ============================================================================ */
function setupDesktopSearch(sidebarEl, basePath) {
    const searchInput = sidebarEl.querySelector('#desktop-search-input');
    const searchDropdown = sidebarEl.querySelector('#desktop-search-dropdown');
    if (!searchInput || !searchDropdown) return;

    function renderResults(query) {
        const q = query.trim().toLowerCase();
        if (!q) {
            searchDropdown.classList.remove('active');
            searchDropdown.innerHTML = '';
            return;
        }

        const currentLang = getCurrentLang();
        const str = SIDEBAR_STRINGS[currentLang] || SIDEBAR_STRINGS.tc;

        const matched = SEARCH_INDEX.filter(item => {
            const title = (currentLang === 'sc' ? item.titleSc : item.titleTc).toLowerCase();
            const cat = (currentLang === 'sc' ? item.categorySc : item.categoryTc).toLowerCase();
            const kw = item.keywords.join(' ').toLowerCase();
            return title.includes(q) || cat.includes(q) || kw.includes(q);
        });

        if (matched.length === 0) {
            searchDropdown.innerHTML = `<div class="desktop-search-empty">${str.noResults}</div>`;
            searchDropdown.classList.add('active');
            return;
        }

        searchDropdown.innerHTML = matched.slice(0, 8).map(item => {
            const title = currentLang === 'sc' ? item.titleSc : item.titleTc;
            const category = currentLang === 'sc' ? item.categorySc : item.categoryTc;
            const targetUrl = resolveSiteUrl(item.url);

            return `
                <a href="${targetUrl}" class="desktop-search-item">
                    <span>${item.icon}</span>
                    <span style="font-weight: 500;">${title}</span>
                    <span class="desktop-search-item-badge">${category}</span>
                </a>
            `;
        }).join('');

        searchDropdown.classList.add('active');
    }

    searchDropdown.addEventListener('click', () => {
        searchDropdown.classList.remove('active');
    });

    searchInput.addEventListener('input', (e) => {
        renderResults(e.target.value);
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            searchDropdown.classList.remove('active');
            searchInput.blur();
        }
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.desktop-search-box')) {
            searchDropdown.classList.remove('active');
        }
    });
}


/* ============================================================================
 * Label Synchronization (i18n)
 * ============================================================================ */
function syncSidebarLabels(sidebarEl) {
    if (!sidebarEl) return;
    const currentLang = getCurrentLang();
    const str = SIDEBAR_STRINGS[currentLang] || SIDEBAR_STRINGS.tc;

    const brandEl = sidebarEl.querySelector('#desktop-brand-text');
    if (brandEl) brandEl.textContent = str.brand;

    const brandTitle = sidebarEl.querySelector('#desktop-brand-title');
    if (brandTitle) brandTitle.textContent = str.brand;

    const searchInput = sidebarEl.querySelector('#desktop-search-input');
    if (searchInput) searchInput.placeholder = str.searchPlaceholder;

    const menuHeader = sidebarEl.querySelector('#desktop-menu-header');
    if (menuHeader) menuHeader.textContent = str.menuHeader;

    const exhibitsHeader = sidebarEl.querySelector('#desktop-exhibits-header');
    if (exhibitsHeader) exhibitsHeader.textContent = str.exhibitsHeader;

    const navHome = sidebarEl.querySelector('#label-nav-home');
    if (navHome) navHome.textContent = str.home;

    const navAnn = sidebarEl.querySelector('#label-nav-announcement');
    if (navAnn) navAnn.textContent = str.announcement;

    const navLib = sidebarEl.querySelector('#label-nav-library');
    if (navLib) navLib.textContent = str.library;

    const navSet = sidebarEl.querySelector('#label-nav-settings');
    if (navSet) navSet.textContent = str.settings;

    const exBio = sidebarEl.querySelector('#label-exhibit-biography');
    if (exBio) exBio.textContent = str.exhibitBiography;

    const exXin = sidebarEl.querySelector('#label-exhibit-xinhai');
    if (exXin) exXin.textContent = str.exhibitXinhai;

    const exWha = sidebarEl.querySelector('#label-exhibit-whampoa');
    if (exWha) exWha.textContent = str.exhibitWhampoa;

    const exMay = sidebarEl.querySelector('#label-exhibit-mayfourth');
    if (exMay) exMay.textContent = str.exhibitMayfourth;
}

/* ============================================================================
 * Attendance & Calendar Status Synchronizer
 * ============================================================================ */
function syncSidebarStatus(sidebarEl) {
    if (!sidebarEl) return;

    const statusText = sidebarEl.querySelector('#desktop-status-text');

    function update() {
        const pageAttendance = document.getElementById('attendanceCount');
        const count = pageAttendance ? pageAttendance.textContent : '0';

        const now = new Date();
        const minguoYear = now.getFullYear() - 1911;
        const month = now.getMonth() + 1;
        const date = now.getDate();

        if (statusText) {
            statusText.textContent = `參典人次：${count} · 民國 ${minguoYear} 年`;
        }
    }

    update();
    setInterval(update, 2000);
}

/* ============================================================================
 * Animated Red Indicator Controller (Apple Fluid Shorten-Glide-Elongate Physics)
 * ============================================================================ */
function setupAnimatedNavIndicator(sidebarEl, activeTab) {
    const topContainer = sidebarEl.querySelector('.desktop-sidebar-top');
    if (!topContainer) return;

    let indicator = topContainer.querySelector('#desktop-nav-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'desktop-nav-indicator';
        indicator.className = 'desktop-nav-indicator';
        topContainer.appendChild(indicator);
    }

    document.body.classList.add('has-desktop-indicator');

    const navItems = sidebarEl.querySelectorAll('.desktop-nav-item');
    const activeItem = sidebarEl.querySelector(`.desktop-nav-item[data-sidebar-tab="${activeTab}"]`);

    function getItemPosition(itemEl) {
        if (!itemEl || !topContainer) return null;
        let top = 0;
        let curr = itemEl;
        let found = false;
        while (curr && curr !== topContainer) {
            top += curr.offsetTop;
            curr = curr.offsetParent;
            if (curr === topContainer) {
                found = true;
                break;
            }
        }
        if (!found) {
            const itemRect = itemEl.getBoundingClientRect();
            const parentRect = topContainer.getBoundingClientRect();
            top = itemRect.top - parentRect.top;
        }
        const height = itemEl.offsetHeight || 32;
        return top + (height - 16) / 2;
    }

    function moveIndicator(fromY, toY, onFinish) {
        if (typeof fromY !== 'number' || typeof toY !== 'number') {
            if (typeof toY === 'number') {
                indicator.style.top = `${toY}px`;
                indicator.style.height = '16px';
                indicator.style.opacity = '1';
            }
            if (onFinish) onFinish();
            return;
        }

        indicator.style.opacity = '1';

        if (Math.abs(toY - fromY) < 1) {
            indicator.style.top = `${toY}px`;
            indicator.style.height = '16px';
            if (onFinish) onFinish();
            return;
        }

        const isDown = toY > fromY;
        const keyframes = isDown ? [
            /* 0%: Full length at origin */
            { top: `${fromY}px`, height: '16px', easing: 'cubic-bezier(0.32, 0.72, 0, 1)' },
            /* 26%: In place, shorten towards bottom */
            { top: `${fromY + 12}px`, height: '4px', easing: 'cubic-bezier(0.25, 1, 0.5, 1)' },
            /* 66%: Move to destination top while compressed */
            { top: `${toY}px`, height: '4px', easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
            /* 88%: Slight elastic overshoot elongation */
            { top: `${toY}px`, height: '17.5px', easing: 'ease-out' },
            /* 100%: Settle at target 16px */
            { top: `${toY}px`, height: '16px' }
        ] : [
            /* 0%: Full length at origin */
            { top: `${fromY}px`, height: '16px', easing: 'cubic-bezier(0.32, 0.72, 0, 1)' },
            /* 26%: In place, shorten towards top */
            { top: `${fromY}px`, height: '4px', easing: 'cubic-bezier(0.25, 1, 0.5, 1)' },
            /* 66%: Move to destination bottom while compressed */
            { top: `${toY + 12}px`, height: '4px', easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
            /* 88%: Slight elastic overshoot elongation */
            { top: `${toY - 1.5}px`, height: '17.5px', easing: 'ease-out' },
            /* 100%: Settle at target 16px */
            { top: `${toY}px`, height: '16px' }
        ];

        const anim = indicator.animate(keyframes, {
            duration: 300,
            fill: 'forwards',
            easing: 'linear'
        });

        anim.onfinish = () => {
            indicator.style.top = `${toY}px`;
            indicator.style.height = '16px';
            if (onFinish) onFinish();
        };
    }

    /* Record session state for active tab */
    sessionStorage.setItem('sys_last_nav_tab', activeTab);

    /* Direct, rock-solid initial positioning without cross-page jump or offset glitch */
    function syncIndicatorPosition() {
        if (!activeItem) return;
        const toPos = getItemPosition(activeItem);
        if (toPos !== null) {
            indicator.style.top = `${toPos}px`;
            indicator.style.height = '16px';
            indicator.style.opacity = '1';
        }
    }

    requestAnimationFrame(syncIndicatorPosition);
    setTimeout(syncIndicatorPosition, 50);
    setTimeout(syncIndicatorPosition, 150);

    /* Re-sync on window resize */
    window.addEventListener('resize', syncIndicatorPosition);

    /* Expose fluid glide controller globally for router and subpage transitions */
    function glideNavIndicator(tabName, onFinish) {
        const targetItem = sidebarEl.querySelector(`.desktop-nav-item[data-sidebar-tab="${tabName}"]`);
        if (!targetItem) {
            if (onFinish) onFinish();
            return;
        }

        const currentActive = sidebarEl.querySelector('.desktop-nav-item.active');
        const fromY = getItemPosition(currentActive);
        const toY = getItemPosition(targetItem);

        if (currentActive) currentActive.classList.remove('active');
        targetItem.classList.add('active');

        sessionStorage.setItem('sys_last_nav_tab', tabName);

        if (fromY !== null && toY !== null && Math.abs(toY - fromY) >= 1) {
            moveIndicator(fromY, toY, onFinish);
        } else if (toY !== null) {
            indicator.style.top = `${toY}px`;
            indicator.style.height = '16px';
            indicator.style.opacity = '1';
            if (onFinish) onFinish();
        } else {
            if (onFinish) onFinish();
        }
    }

    window.__glideNavIndicator = glideNavIndicator;
    window.__syncIndicatorPosition = syncIndicatorPosition;

    /* Apple-style animated glide triggered on explicit user tab clicks */
    navItems.forEach((item) => {
        item.addEventListener('click', (e) => {
            const targetTab = item.getAttribute('data-sidebar-tab');
            const targetHref = item.getAttribute('href');
            if (!targetHref || targetHref.startsWith('javascript:')) return;

            e.preventDefault();
            e.stopPropagation();

            if (targetTab === sessionStorage.getItem('sys_last_nav_tab') && window.location.pathname.endsWith(targetHref)) {
                return;
            }

            glideNavIndicator(targetTab);
            navigateDesktopStage(targetHref, true);
        });
    });
}
