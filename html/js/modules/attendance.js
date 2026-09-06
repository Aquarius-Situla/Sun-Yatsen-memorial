/* ============================================================================
 * Private Sun Yat-sen Memorial Hall — Attendance Registration (attendance.js)
 * ============================================================================
 * COMMENTING STANDARDS
 * 1. Block comments only. Inline comments (//) are strictly prohibited.
 * 2. Section dividers use the === banner format.
 * 3. All prose is written in English.
 * ============================================================================ */

/* ============================================================================
 * Browser Fingerprinting
 * ============================================================================
 * Generates an anonymous random UUID stored in localStorage.
 * Avoids intrusive canvas fingerprinting methods that trigger ad blocker flags.
 * ============================================================================ */
export function generateBrowserFingerprint() {
    return new Promise((resolve) => {
        let fp = null;
        try {
            fp = localStorage.getItem('sys_visitor_fp');
        } catch (e) {
            /* Storage inaccessible */
        }

        if (fp && fp.length >= 8) {
            resolve(fp);
            return;
        }

        /* Generate clean cryptographic or pseudo-random identifier */
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            fp = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
        } else {
            fp = Math.random().toString(36).substring(2, 10) + Date.now().toString(36).slice(-6);
        }

        try {
            localStorage.setItem('sys_visitor_fp', fp);
        } catch (e) {
            /* Storage fallback */
        }

        resolve(fp);
    });
}

/* ============================================================================
 * Attendance Registration Engine
 * ============================================================================ */
export async function registerAttendance(apiUrl, attendanceCountEl, onMilestone) {
    if (!apiUrl) return 0;

    /* Session-level deduplication: avoid redundant network POST on split-view tab return */
    try {
        const isRegistered = sessionStorage.getItem('sys_attendance_registered');
        if (isRegistered) {
            const cachedCount = sessionStorage.getItem('sys_attendance_count');
            if (cachedCount && attendanceCountEl) {
                attendanceCountEl.innerText = cachedCount;
            }
            return cachedCount ? parseInt(cachedCount, 10) : 0;
        }
    } catch (e) {
        /* Session storage fallback */
    }

    try {
        const fingerprint = await generateBrowserFingerprint();
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timeoutId = controller ? setTimeout(() => controller.abort(), 3500) : null;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fp: fingerprint }),
            signal: controller ? controller.signal : undefined
        });

        if (timeoutId) clearTimeout(timeoutId);

        let count = 0;
        if (response.ok) {
            const data = await response.json();
            count = data.count || 0;
        }

        if (attendanceCountEl && count > 0) {
            attendanceCountEl.innerText = String(count);
        }

        if (count > 0) {
            try {
                sessionStorage.setItem('sys_attendance_registered', 'true');
                sessionStorage.setItem('sys_attendance_count', String(count));
            } catch (e) {
                /* Storage fallback */
            }
        }

        /* 100-visitor milestone trigger */
        if (count > 0 && count % 100 === 0 && typeof onMilestone === 'function') {
            onMilestone();
        }
        return count;
    } catch (e) {
        /* Silently recover from ad-blocker or network refusal */
        if (attendanceCountEl && !attendanceCountEl.innerText) {
            attendanceCountEl.innerText = '0';
        }
        return 0;
    }
}
