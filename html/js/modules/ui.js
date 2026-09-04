/* ============================================================================
 * Private Sun Yat-sen Memorial Hall — UI & Notification Module (ui.js)
 * ============================================================================
 * COMMENTING STANDARDS
 * 1. Block comments only. Inline comments (//) are strictly prohibited.
 * 2. Section dividers use the === banner format.
 * 3. All prose is written in English.
 * ============================================================================ */

/* ============================================================================
 * Toast Banner System (Ceremonial Top Banners)
 * ============================================================================ */

let bannerTimeout = null;

export function triggerToastBanner(text, duration = 0) {
    const memorialBanner = document.getElementById('memorial-banner');
    const sitDownBanner = document.getElementById('sit-down-banner');

    if (!memorialBanner || !sitDownBanner) return;
    if (bannerTimeout) clearTimeout(bannerTimeout);

    if (!sitDownBanner.classList.contains('show')) {
        memorialBanner.innerText = text;
        memorialBanner.classList.remove('hidden');
        document.body.classList.add('banner-active');
    }

    if (duration > 0) {
        bannerTimeout = setTimeout(() => {
            memorialBanner.classList.add('hidden');
            document.body.classList.remove('banner-active');
        }, duration);
    }
}

/* ============================================================================
 * Unified Floating Toast System
 * ============================================================================ */

let currentToast = null;
let toastTimeout = null;

export function showToast(msg, type = 'info') {
    const DISPLAY_MS = 3000;
    const FADE_MS = 400;

    /* Override singleton if one is active */
    if (currentToast) {
        currentToast.className = `cloudflare-toast ${type} show`;
        currentToast.innerText = msg;
        if (toastTimeout) clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => { dismissToast(currentToast); }, DISPLAY_MS);
        return;
    }

    const toast = document.createElement('div');
    toast.className = `cloudflare-toast ${type}`;
    toast.innerText = msg;
    document.body.appendChild(toast);
    currentToast = toast;

    void toast.offsetWidth; /* Force reflow for CSS animation */
    toast.classList.add('show');
    toastTimeout = setTimeout(() => { dismissToast(toast); }, DISPLAY_MS);

    function dismissToast(target) {
        if (currentToast !== target) return;
        target.classList.remove('show');
        setTimeout(() => {
            if (currentToast === target) {
                target.remove();
                currentToast = null;
            }
        }, FADE_MS);
    }
}

/* ============================================================================
 * Humanized Error Formatter
 * ============================================================================ */
export function formatError(err, fallbackMsg = '操作失敗，請稍後重試') {
    /* Send detailed trace to console for developers */
    if (err) {
        console.error('[App Error Trace]:', err);
    }

    if (!err) return fallbackMsg;

    const errMsg = (err.message || String(err)).toLowerCase();

    if (errMsg.includes('failed to fetch') || errMsg.includes('networkerror') || errMsg.includes('network error')) {
        return '連線異常，請檢查網路連線';
    }
    if (errMsg.includes('timeout') || errMsg.includes('aborterror')) {
        return '連線超時，請稍後重試';
    }
    if (errMsg.includes('rate limit') || errMsg.includes('429')) {
        return '請求過於頻繁，請稍後再試';
    }
    if (errMsg.includes('500') || errMsg.includes('internal server error')) {
        return '伺服器忙碌中，請稍候重試';
    }
    if (errMsg.includes('prohibited') || errMsg.includes('filtered') || errMsg.includes('sensitive')) {
        return '內容包含敏感或不合規詞彙';
    }

    return fallbackMsg;
}

/* ============================================================================
 * String Sanitization Helper
 * ============================================================================ */
export function escapeHTML(str) {
    if (!str) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(str).replace(/[&<>"']/g, m => map[m]);
}
