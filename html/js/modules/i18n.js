/* ============================================================================
 * Private Sun Yat-sen Memorial Hall — Internationalization Module (i18n.js)
 * ============================================================================
 * COMMENTING STANDARDS
 * 1. Block comments only. Inline comments are strictly prohibited.
 * 2. Section dividers use the === banner format.
 * 3. All prose is written in English.
 * ============================================================================ */

import tcLocale from './i18n/locales/tc.js?v=20260907b';
import scLocale from './i18n/locales/sc.js?v=20260907b';

export const STORAGE_KEY = 'sys_memorial_lang';
export const DEFAULT_LANG = 'tc';

/* ============================================================================
 * Registry & State Management
 * ============================================================================ */
const registry = new Map();
const aliasMap = new Map();
let initialized = false;

/* Register pre-bundled and global locales */
export function registerLocale(locale) {
    if (!locale || !locale.code || !locale.translations) return;

    registry.set(locale.code, locale);
    aliasMap.set(locale.code.toLowerCase(), locale.code);

    if (Array.isArray(locale.aliases)) {
        locale.aliases.forEach(alias => {
            aliasMap.set(alias.toLowerCase(), locale.code);
        });
    }

    if (initialized) {
        applyTranslations();
    }
}

/* Register default bundled locales */
registerLocale(tcLocale);
registerLocale(scLocale);

if (typeof globalThis !== 'undefined' && globalThis.__SYS_LOCALES__) {
    Object.keys(globalThis.__SYS_LOCALES__).forEach(code => {
        registerLocale(globalThis.__SYS_LOCALES__[code]);
    });
}

/* ============================================================================
 * Alias Resolution Engine
 * ============================================================================ */
export function resolveLocaleCode(input) {
    if (!input || typeof input !== 'string') return DEFAULT_LANG;
    const normalized = input.trim().toLowerCase();

    if (aliasMap.has(normalized)) {
        return aliasMap.get(normalized);
    }

    /* Fallback prefix matching (e.g. "zh-tw" -> "tc", "zh-cn" -> "sc") */
    const prefix = normalized.split('-')[0].split('_')[0];
    if (aliasMap.has(prefix)) {
        return aliasMap.get(prefix);
    }

    return registry.has(DEFAULT_LANG) ? DEFAULT_LANG : (registry.keys().next().value || DEFAULT_LANG);
}

/* ============================================================================
 * Browser Fingerprint Language Detection
 * ============================================================================ */
export function detectBrowserLanguage() {
    if (typeof navigator === 'undefined') return DEFAULT_LANG;

    const navLanguages = navigator.languages || [
        navigator.language ||
        navigator.userLanguage ||
        navigator.browserLanguage ||
        ''
    ];

    for (const rawLang of navLanguages) {
        if (!rawLang || typeof rawLang !== 'string') continue;
        const lang = rawLang.trim().toLowerCase();

        /* Traditional Chinese indicators (Taiwan, Hong Kong, Macau, Hant script) */
        if (
            lang.includes('tw') ||
            lang.includes('hk') ||
            lang.includes('mo') ||
            lang.includes('hant') ||
            lang === 'cht'
        ) {
            return 'tc';
        }

        /* Simplified Chinese indicators (China Mainland, Singapore, Hans script) */
        if (
            lang.includes('cn') ||
            lang.includes('sg') ||
            lang.includes('hans') ||
            lang === 'chs'
        ) {
            return 'sc';
        }

        /* If language is generic Chinese ("zh"), inspect timezone fingerprint */
        if (lang.startsWith('zh')) {
            try {
                const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
                if (/Taipei|Hong_Kong|Macau/i.test(timeZone)) {
                    return 'tc';
                }
                if (/Shanghai|Chongqing|Urumqi|Harbin|Beijing/i.test(timeZone)) {
                    return 'sc';
                }
            } catch (e) {
                /* Ignore timezone resolution failure */
            }
            return DEFAULT_LANG;
        }
    }

    return DEFAULT_LANG;
}

/* ============================================================================
 * Language Preference Mode & Effective Language Getters
 * ============================================================================ */
export function getLanguageMode() {
    /* 1. URL parameter override takes immediate precedence */
    if (typeof window !== 'undefined' && window.location) {
        try {
            const params = new URLSearchParams(window.location.search);
            const urlLang = params.get('lang');
            if (urlLang === 'auto' || urlLang === 'tc' || urlLang === 'sc') {
                return urlLang;
            }
        } catch (e) {
            /* Ignore URL parsing error */
        }
    }

    /* 2. Stored user preference */
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'tc' || stored === 'sc' || stored === 'auto') {
            return stored;
        }
    } catch (e) {
        /* LocalStorage access may fail in restricted iframe environments */
    }

    /* Default mode is 'auto' following browser fingerprint */
    return 'auto';
}

export function getCurrentLang() {
    const mode = getLanguageMode();
    if (mode === 'auto') {
        return detectBrowserLanguage();
    }
    return resolveLocaleCode(mode);
}

export const getLocale = getCurrentLang;
export const getLanguage = getCurrentLang;

/* ============================================================================
 * Global Language Setter
 * ============================================================================ */
export function setGlobalLang(input) {
    let mode = 'auto';
    if (input === 'tc' || input === 'sc' || input === 'auto') {
        mode = input;
    } else if (typeof input === 'string') {
        const resolved = resolveLocaleCode(input);
        mode = resolved === 'tc' || resolved === 'sc' ? resolved : 'auto';
    }

    try {
        localStorage.setItem(STORAGE_KEY, mode);
    } catch (e) {
        /* Silently catch storage write exceptions */
    }

    const effectiveLang = (mode === 'auto') ? detectBrowserLanguage() : mode;
    if (typeof document !== 'undefined') {
        document.documentElement.lang = (effectiveLang === 'tc') ? 'zh-TW' : 'zh-CN';
    }

    applyTranslations();
    syncTabBarLabels();

    /* Dispatch standard and compatibility events */
    if (typeof window !== 'undefined') {
        try {
            window.dispatchEvent(new CustomEvent('sys-lang-change', {
                detail: {
                    lang: effectiveLang,
                    mode: mode,
                    isTraditional: effectiveLang === 'tc',
                    locale: effectiveLang
                }
            }));
            window.dispatchEvent(new CustomEvent('situla:languagechange', {
                detail: {
                    language: effectiveLang,
                    locale: effectiveLang,
                    mode: mode
                }
            }));
            window.dispatchEvent(new CustomEvent('i18n:localeChanged', {
                detail: {
                    language: effectiveLang,
                    locale: effectiveLang,
                    mode: mode
                }
            }));
        } catch (e) {
            /* Ignore event dispatch errors */
        }
    }
}

export const setLanguage = setGlobalLang;

/* ============================================================================
 * Translation Lookup with Parameter Interpolation {0}, {1}
 * ============================================================================ */
export function t(key, ...args) {
    if (!key) return '';

    const current = getCurrentLang();
    const activeDict = registry.get(current)?.translations;
    const fallbackDict = registry.get(DEFAULT_LANG)?.translations || registry.values().next().value?.translations;

    let str = (activeDict && typeof activeDict[key] === 'string')
        ? activeDict[key]
        : ((fallbackDict && typeof fallbackDict[key] === 'string') ? fallbackDict[key] : key);

    if (args.length > 0 && typeof str === 'string') {
        args.forEach((arg, i) => {
            str = str.replace(new RegExp(`\\{${i}\\}`, 'g'), String(arg !== undefined ? arg : ''));
        });
    }

    return str;
}

/* ============================================================================
 * Declarative DOM Localizer
 * ============================================================================ */
export function applyTranslations(root = (typeof document !== 'undefined' ? document : null)) {
    if (!root) return;

    /* 1. Text Content */
    root.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translated = t(key);
        if (translated && translated !== key) {
            el.textContent = translated;
        }
    });

    /* 2. Input Placeholders */
    root.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        const translated = t(key);
        if (translated && translated !== key) {
            el.setAttribute('placeholder', translated);
        }
    });

    /* 3. Title Tooltips */
    root.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        const translated = t(key);
        if (translated && translated !== key) {
            el.setAttribute('title', translated);
        }
    });

    /* 4. Accessibility aria-label */
    root.querySelectorAll('[data-i18n-aria-label]').forEach(el => {
        const key = el.getAttribute('data-i18n-aria-label');
        const translated = t(key);
        if (translated && translated !== key) {
            el.setAttribute('aria-label', translated);
        }
    });

    /* 5. Page Title */
    const pageTitleEl = root.querySelector('[data-page-title-key]');
    if (pageTitleEl) {
        const key = pageTitleEl.getAttribute('data-page-title-key');
        const translated = t(key);
        if (translated && translated !== key) {
            document.title = translated;
        }
    }
}

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
 * Tab Bar Bilingual Label Synchronizer
 * ============================================================================ */
export function syncTabBarLabels(rootEl = (typeof document !== 'undefined' ? document : null)) {
    if (!rootEl) return;
    const lang = getCurrentLang();
    const tabs = TAB_DEFINITIONS[lang] || TAB_DEFINITIONS.tc;

    tabs.forEach(tab => {
        const labelEl = rootEl.querySelector(`[data-tab-id="${tab.id}"] .tab-label`);
        if (labelEl) {
            labelEl.textContent = tab.label;
        }
    });
}

/* ============================================================================
 * Engine Object & Global Exports
 * ============================================================================ */
export function getAvailableLanguages() {
    return Array.from(registry.values()).map(l => ({
        code: l.code,
        name: l.name || l.code
    }));
}

const i18nEngine = {
    t,
    register: registerLocale,
    setGlobalLang,
    setLanguage: setGlobalLang,
    getLanguageMode,
    getCurrentLang,
    getLanguage: getCurrentLang,
    getLocale: getCurrentLang,
    detectBrowserLanguage,
    getAvailableLanguages,
    applyTranslations,
    resolveLocaleCode,
    syncTabBarLabels,
    TAB_DEFINITIONS,
    STORAGE_KEY,
    DEFAULT_LANG
};

/* Listen for live browser language change when in auto mode */
if (typeof window !== 'undefined') {
    window.addEventListener('languagechange', () => {
        if (getLanguageMode() === 'auto') {
            const effectiveLang = detectBrowserLanguage();
            if (typeof document !== 'undefined') {
                document.documentElement.lang = (effectiveLang === 'tc') ? 'zh-TW' : 'zh-CN';
            }
            applyTranslations();
            syncTabBarLabels();
            try {
                window.dispatchEvent(new CustomEvent('sys-lang-change', {
                    detail: {
                        lang: effectiveLang,
                        mode: 'auto',
                        isTraditional: effectiveLang === 'tc',
                        locale: effectiveLang
                    }
                }));
            } catch (e) {
                /* Ignore event dispatch errors */
            }
        }
    });

    globalThis.t = t;
    globalThis.setGlobalLang = setGlobalLang;
    globalThis.setLanguage = setGlobalLang;
    globalThis.getCurrentLang = getCurrentLang;
    globalThis.getLanguageMode = getLanguageMode;
    globalThis.i18n = i18nEngine;
}

/* Initialize DOM translations on load */
if (typeof document !== 'undefined') {
    const initialLang = getCurrentLang();
    document.documentElement.lang = (initialLang === 'tc') ? 'zh-TW' : 'zh-CN';
    initialized = true;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            applyTranslations();
            syncTabBarLabels();
        });
    } else {
        applyTranslations();
        syncTabBarLabels();
    }
}

export default i18nEngine;
