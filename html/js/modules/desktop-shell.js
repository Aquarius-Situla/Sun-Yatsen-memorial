/* ============================================================================
 * Private Sun Yat-sen Memorial Hall — Apple Desktop Shell Controller (desktop-shell.js)
 * ============================================================================
 * COMMENTING STANDARDS
 * 1. Block comments only. Inline comments (//) are strictly prohibited.
 * 2. Section dividers use the === banner format.
 * 3. All prose is written in English.
 * ============================================================================ */

import { getCurrentLang, TAB_DEFINITIONS, syncTabBarLabels } from './i18n.js';
import { TAB_ICONS } from './tab-bar.js';

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
 * Desktop Shell Initialization Controller
 * ============================================================================ */
export function initDesktopShell(options = {}) {
    const {
        activeTab = 'home',
        basePath = './'
    } = options;

    /* Add layout helper class to body for wide desktop viewports */
    document.body.classList.add('has-desktop-sidebar');

    /* Check if sidebar already exists */
    let sidebarEl = document.getElementById('desktop-sidebar');
    if (!sidebarEl) {
        sidebarEl = createSidebarElement(activeTab, basePath);
        document.body.insertBefore(sidebarEl, document.body.firstChild);
    }

    /* Bind Search Input and Dropdown */
    setupDesktopSearch(sidebarEl, basePath);

    /* Sync Sidebar Language Labels */
    syncSidebarLabels(sidebarEl);

    /* Sync Status Display with Live Calendar & Attendance */
    syncSidebarStatus(sidebarEl);

    /* Listen for Global Language Changes */
    window.addEventListener('sys-lang-change', () => {
        syncSidebarLabels(sidebarEl);
    });
}

/* ============================================================================
 * DOM Factory: Create Sidebar Node
 * ============================================================================ */
function createSidebarElement(activeTab, basePath) {
    const currentLang = getCurrentLang();
    const str = SIDEBAR_STRINGS[currentLang] || SIDEBAR_STRINGS.tc;

    const routes = {
        home: basePath === './' ? 'index.html' : `${basePath}index.html`,
        announcement: basePath === './' ? 'pages/announcement/announcement.html' : `${basePath}pages/announcement/announcement.html`,
        library: basePath === './' ? 'pages/library/library.html' : `${basePath}pages/library/library.html`,
        settings: basePath === './' ? 'pages/settings/settings.html' : `${basePath}pages/settings/settings.html`,
        xinhai: basePath === './' ? 'events/xinhai/xinhai.html' : `${basePath}events/xinhai/xinhai.html`,
        whampoa: basePath === './' ? 'events/whampoa/whampoa.html' : `${basePath}events/whampoa/whampoa.html`,
        mayfourth: basePath === './' ? 'events/mayfourth/mayfourth.html' : `${basePath}events/mayfourth/mayfourth.html`,
        biography: basePath === './' ? 'pages/biography/biography.html' : `${basePath}pages/biography/biography.html`
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
                <a href="${routes.biography}" class="desktop-nav-item" data-sidebar-tab="biography">
                    <svg viewBox="0 0 24 24"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/></svg>
                    <span class="desktop-nav-label" id="label-exhibit-biography">${str.exhibitBiography}</span>
                </a>
                <a href="${routes.xinhai}" class="desktop-nav-item" data-sidebar-tab="xinhai">
                    <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                    <span class="desktop-nav-label" id="label-exhibit-xinhai">${str.exhibitXinhai}</span>
                </a>
                <a href="${routes.whampoa}" class="desktop-nav-item" data-sidebar-tab="whampoa">
                    <svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
                    <span class="desktop-nav-label" id="label-exhibit-whampoa">${str.exhibitWhampoa}</span>
                </a>
                <a href="${routes.mayfourth}" class="desktop-nav-item" data-sidebar-tab="mayfourth">
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
            const targetUrl = basePath === './' ? item.url : `${basePath}${item.url}`;

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
