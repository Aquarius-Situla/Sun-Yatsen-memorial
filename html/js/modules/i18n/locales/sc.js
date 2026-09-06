/* ============================================================================
 * Private Sun Yat-sen Memorial Hall — Language Pack: Simplified Chinese (sc)
 * ============================================================================
 * COMMENTING STANDARDS
 * 1. Block comments only. Inline comments are strictly prohibited.
 * 2. Section dividers use the === banner format.
 * 3. All prose is written in English.
 * ============================================================================ */

const locale = {
    code: 'sc',
    name: '简体中文',
    aliases: ['zh-CN', 'zh-SG', 'zh-Hans', 'zh', 'cn', 'sc'],
    translations: {
        /* Tab Bar Definitions */
        "tab_home": "主页",
        "tab_announcement": "公告",
        "tab_library": "资料库",
        "tab_settings": "设置",

        /* Common & Navigation */
        "nav_back": "返回",
        "nav_settings": "设置",
        "nav_system_settings": "系统设置",
        "btn_toggle_to_sc": "切换至简化字",
        "btn_toggle_to_tc": "切換至正體字",
        "loading_text": "加载中...",
        "or_divider": "或",

        /* Language Preferences Page (language.html) */
        "lang_page_title": "语言偏好 - 私立中山纪念堂",
        "lang_top_title": "语言偏好",
        "lang_back_text": "设置",
        "lang_section_header": "偏好语言 (PREFERRED LANGUAGES)",
        "lang_footer": "选择在私立中山纪念堂中显示的语言偏好。系统将自动保存您的偏好设置。",
        "lang_opt_auto_title": "自动",
        "lang_opt_auto_desc": "跟随浏览器偏好 · Follow Browser",
        "lang_opt_auto_current": "跟随浏览器偏好（当前：{0}）",
        "lang_opt_tc_title": "正體中文",
        "lang_opt_tc_desc": "繁體字 · Traditional Chinese",
        "lang_opt_sc_title": "简体中文",
        "lang_opt_sc_desc": "简化字 · Simplified Chinese",

        /* Settings Page (settings.html) */
        "settings_page_title": "系统设置 - 私立中山纪念堂",
        "settings_top_nav_title": "设置",
        "settings_sec_pref_header": "偏好设置 (PREFERENCES)",
        "settings_label_lang": "全域语言 (Language)",
        "settings_val_lang_tc": "正體中文",
        "settings_val_lang_sc": "简体中文",
        "settings_val_lang_auto_tc": "自动（正体中文）",
        "settings_val_lang_auto_sc": "自动（简体中文）",
        "settings_sec_about_header": "关于与声明 (ABOUT & LEGAL)",
        "settings_label_about": "关于纪念馆与声明",
        "settings_val_about": "馆舍与法规",
        "settings_label_thanks": "特别鸣谢名单",
        "settings_val_thanks": "开源与贡献",
        "settings_sec_sys_header": "系统与资讯 (SYSTEM & INFO)",
        "settings_label_official": "国父纪念馆官方网站",
        "settings_label_version": "应用版本",
        "settings_label_archive_system": "典藏系统",
        "settings_val_archive_system": "私立中山纪念堂",

        /* Library Page (library.html) */
        "library_page_title": "资料库 - 私立中山纪念堂",
        "library_top_nav_title": "资料库",
        "library_sec_yatsen": "国父生平与思想 (SUN YAT-SEN ARCHIVES)",
        "library_sec_exhibits": "民国重大历史特展 (HISTORICAL EXHIBITIONS)",
        "library_label_biography": "国父生平传记",
        "library_val_biography": "年谱与思想",
        "library_label_yatsen_birth": "国父诞辰特展",
        "library_val_yatsen_birth": "十一月十二日",
        "library_label_yatsen_passing": "国父逝世纪念",
        "library_val_yatsen_passing": "三月十二日 · 植树节",
        "library_label_xinhai": "辛亥革命纪念特刊",
        "library_val_xinhai": "十月十日 · 双十节",
        "library_label_whampoa": "黄埔建军百年专页",
        "library_val_whampoa": "六月十六日",
        "library_label_militaries": "三军抗战胜利纪念",
        "library_val_militaries": "九月三日 · 军人节",
        "library_label_mayfourth": "五四运动与新文化",
        "library_val_mayfourth": "五月四日",

        /* Announcements Page (announcement.html) */
        "announcement_page_title": "公告 - 私立中山纪念堂",
        "announcement_top_title": "公告",
        "announcement_sec_announcements": "堂务公告 (ANNOUNCEMENTS)",
        "announcement_label_status": "网站状态",
        "announcement_val_status": "运行正常",
        "announcement_label_memorial": "纪念日",
        "announcement_val_memorial": "重要典礼",
        "announcement_label_ukraine": "声援乌克兰",
        "announcement_val_ukraine": "和平声明",

        /* Desktop Sidebar (desktop-shell.js) */
        "sidebar_brand": "私立中山纪念堂",
        "sidebar_search_placeholder": "搜索馆藏与史料...",
        "sidebar_menu_header": "主要菜单",
        "sidebar_exhibits_header": "重大特展",
        "sidebar_home": "首页",
        "sidebar_announcement": "公告",
        "sidebar_library": "资料库",
        "sidebar_settings": "设置",
        "sidebar_exhibit_biography": "国父生平传记",

        /* Danmaku & System Prompts */
        "msg_danmaku_enabled": "弹幕已开启",
        "msg_danmaku_disabled": "弹幕已关闭",
        "memorial_bow_prompt": "请向国父遗像行三鞠躬礼",
        "sit_down_prompt": "请坐下"
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
