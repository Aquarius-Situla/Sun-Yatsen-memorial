/* ============================================================================
 * Private Sun Yat-sen Memorial Hall — Internationalization Module (i18n.js)
 * ============================================================================
 * COMMENTING STANDARDS
 * 1. Block comments only. Inline comments (//) are strictly prohibited.
 * 2. Section dividers use the === banner format.
 * 3. All prose is written in English.
 * ============================================================================ */

export const STORAGE_KEY = 'sys_memorial_lang';
export const DEFAULT_LANG = 'tc';

/* ============================================================================
 * Tab Definitions for Apple Native Bottom Tab Bar
 * ============================================================================ */
export const TAB_DEFINITIONS = {
    tc: [
        { id: 'home',         label: '主頁' },
        { id: 'announcement', label: '公告' },
        { id: 'library',      label: '資料庫' },
        { id: 'settings',     label: '設定' }
    ],
    sc: [
        { id: 'home',         label: '主页' },
        { id: 'announcement', label: '公告' },
        { id: 'library',      label: '资料库' },
        { id: 'settings',     label: '设置' }
    ]
};

/* ============================================================================
 * Language Getter & Setter with LocalStorage Persistence
 * ============================================================================ */
export function getCurrentLang() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'tc' || stored === 'sc') {
            return stored;
        }
    } catch (e) {
        /* LocalStorage access might fail in restricted iframe environments */
    }

    /* Fallback: inspect URL parameter if available */
    const params = new URLSearchParams(window.location.search);
    const urlLang = params.get('lang');
    if (urlLang === 'sc' || urlLang === 'tc') {
        return urlLang;
    }

    return DEFAULT_LANG;
}

export function setGlobalLang(lang) {
    if (lang !== 'tc' && lang !== 'sc') return;

    try {
        localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
        /* Silently catch storage write exceptions */
    }

    document.documentElement.lang = lang === 'tc' ? 'zh-TW' : 'zh-CN';

    /* Dispatch custom event for cross-component synchronization */
    window.dispatchEvent(new CustomEvent('sys-lang-change', {
        detail: { lang, isTraditional: lang === 'tc' }
    }));
}

/* ============================================================================
 * Tab Bar Bilingual Label Synchronizer
 * ============================================================================ */
export function syncTabBarLabels(rootEl = document) {
    const lang = getCurrentLang();
    const tabs = TAB_DEFINITIONS[lang] || TAB_DEFINITIONS.tc;

    tabs.forEach(tab => {
        const labelEl = rootEl.querySelector(`[data-tab-id="${tab.id}"] .tab-label`);
        if (labelEl) {
            labelEl.textContent = tab.label;
        }
    });
}
