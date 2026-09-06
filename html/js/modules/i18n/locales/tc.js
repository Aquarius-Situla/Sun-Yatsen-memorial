/* ============================================================================
 * Private Sun Yat-sen Memorial Hall — Language Pack: Traditional Chinese (tc)
 * ============================================================================
 * COMMENTING STANDARDS
 * 1. Block comments only. Inline comments are strictly prohibited.
 * 2. Section dividers use the === banner format.
 * 3. All prose is written in English.
 * ============================================================================ */

const locale = {
    code: 'tc',
    name: '正體中文',
    aliases: ['zh-TW', 'zh-HK', 'zh-MO', 'zh-Hant', 'tw', 'hk', 'tc'],
    translations: {
        /* Tab Bar Definitions */
        "tab_home": "主頁",
        "tab_announcement": "公告",
        "tab_library": "資料庫",
        "tab_settings": "設定",

        /* Common & Navigation */
        "nav_back": "返回",
        "nav_settings": "設定",
        "nav_system_settings": "系統設定",
        "btn_toggle_to_sc": "切换至简化字",
        "btn_toggle_to_tc": "切換至正體字",
        "loading_text": "載入中...",
        "or_divider": "或",

        /* Language Preferences Page (language.html) */
        "lang_page_title": "語言偏好 - 私立中山紀念堂",
        "lang_top_title": "語言偏好",
        "lang_back_text": "設定",
        "lang_section_header": "偏好語言 (PREFERRED LANGUAGES)",
        "lang_footer": "選擇在私立中山紀念堂中顯示的語言偏好。系統將自動保存您的偏好設定。",
        "lang_opt_auto_title": "自動",
        "lang_opt_auto_desc": "跟隨瀏覽器偏好 · Follow Browser",
        "lang_opt_auto_current": "跟隨瀏覽器偏好（目前：{0}）",
        "lang_opt_tc_title": "正體中文",
        "lang_opt_tc_desc": "繁體字 · Traditional Chinese",
        "lang_opt_sc_title": "简体中文",
        "lang_opt_sc_desc": "简化字 · Simplified Chinese",

        /* Settings Page (settings.html) */
        "settings_page_title": "系統設定 - 私立中山紀念堂",
        "settings_top_nav_title": "設定",
        "settings_sec_pref_header": "偏好設定 (PREFERENCES)",
        "settings_label_lang": "全域語言 (Language)",
        "settings_val_lang_tc": "正體中文",
        "settings_val_lang_sc": "简体中文",
        "settings_val_lang_auto_tc": "自動（正體中文）",
        "settings_val_lang_auto_sc": "自動（簡體中文）",
        "settings_sec_about_header": "關於與聲明 (ABOUT & LEGAL)",
        "settings_label_about": "關於紀念館與聲明",
        "settings_val_about": "館舍與法規",
        "settings_label_thanks": "特別鳴謝名單",
        "settings_val_thanks": "開源與貢獻",
        "settings_sec_sys_header": "系統與資訊 (SYSTEM & INFO)",
        "settings_label_official": "國父紀念館官方網站",
        "settings_label_version": "應用版本",
        "settings_label_archive_system": "典藏系統",
        "settings_val_archive_system": "私立中山紀念堂",

        /* Library Page (library.html) */
        "library_page_title": "資料庫 - 私立中山紀念堂",
        "library_top_nav_title": "資料庫",
        "library_sec_yatsen": "國父生平與思想 (SUN YAT-SEN ARCHIVES)",
        "library_sec_exhibits": "民國重大歷史特展 (HISTORICAL EXHIBITIONS)",
        "library_label_biography": "國父生平傳記",
        "library_val_biography": "年譜與思想",
        "library_label_yatsen_birth": "國父誕辰特展",
        "library_val_yatsen_birth": "十一月十二日",
        "library_label_yatsen_passing": "國父逝世紀念",
        "library_val_yatsen_passing": "三月十二日 · 植樹節",
        "library_label_xinhai": "辛亥革命紀念特刊",
        "library_val_xinhai": "十月十日 · 雙十節",
        "library_label_whampoa": "黃埔建軍百年專頁",
        "library_val_whampoa": "六月十六日",
        "library_label_militaries": "三軍抗戰勝利紀念",
        "library_val_militaries": "九月三日 · 軍人節",
        "library_label_mayfourth": "五四運動與新文化",
        "library_val_mayfourth": "五月四日",

        /* Announcements Page (announcement.html) */
        "announcement_page_title": "公告 - 私立中山紀念堂",
        "announcement_top_title": "公告",
        "announcement_sec_announcements": "堂務公告 (ANNOUNCEMENTS)",
        "announcement_label_status": "網站狀態",
        "announcement_val_status": "運作正常",
        "announcement_label_memorial": "紀念日",
        "announcement_val_memorial": "重要典禮",
        "announcement_label_ukraine": "聲援烏克蘭",
        "announcement_val_ukraine": "和平聲明",

        /* Desktop Sidebar (desktop-shell.js) */
        "sidebar_brand": "私立中山紀念堂",
        "sidebar_search_placeholder": "搜尋館藏與史料...",
        "sidebar_menu_header": "主要選單",
        "sidebar_exhibits_header": "重大特展",
        "sidebar_home": "首頁",
        "sidebar_announcement": "公告",
        "sidebar_library": "資料庫",
        "sidebar_settings": "設定",
        "sidebar_exhibit_biography": "國父生平傳記",

        /* Danmaku & System Prompts */
        "msg_danmaku_enabled": "彈幕已開啟",
        "msg_danmaku_disabled": "彈幕已關閉",
        "memorial_bow_prompt": "請向國父遺像行三鞠躬禮",
        "sit_down_prompt": "請坐下"
    }
};

/* Register into global locale registry if running in browser window */
if (typeof globalThis !== 'undefined') {
    globalThis.__SYS_LOCALES__ = globalThis.__SYS_LOCALES__ || {};
    globalThis.__SYS_LOCALES__[locale.code] = locale;
    if (globalThis.i18n && typeof globalThis.i18n.register === 'function') {
        globalThis.i18n.register(locale);
    }
}

export default locale;
