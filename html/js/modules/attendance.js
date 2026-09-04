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
 * Generates an anonymous hash based on Canvas rendering quirks and screen metrics.
 * ============================================================================ */
export function generateBrowserFingerprint() {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx    = canvas.getContext('2d');
        canvas.width  = 200;
        canvas.height = 40;

        ctx.textBaseline = 'top';
        ctx.font         = "14px 'Arial'";
        ctx.fillStyle    = '#f60';
        ctx.fillRect(10, 10, 50, 20);
        ctx.fillStyle = '#069';
        ctx.fillText('SysMemorial, minguo', 2, 2);

        const raw = canvas.toDataURL() + navigator.userAgent + screen.width + navigator.language;
        let hash  = 0;
        for (let i = 0; i < raw.length; i++) {
            hash = (hash << 5) - hash + raw.charCodeAt(i);
            hash |= 0;
        }
        resolve(Math.abs(hash).toString(16));
    });
}

/* ============================================================================
 * Attendance Registration Engine
 * ============================================================================ */
export async function registerAttendance(apiUrl, attendanceCountEl, onMilestone) {
    if (!apiUrl) return;

    try {
        const fingerprint = await generateBrowserFingerprint();
        const response    = await fetch(apiUrl, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ fp: fingerprint })
        });

        const count = response.ok ? ((await response.json()).count || 0) : 0;
        if (attendanceCountEl) {
            attendanceCountEl.innerText = count || '0';
        }

        /* 100-visitor milestone trigger */
        if (count > 0 && count % 100 === 0 && typeof onMilestone === 'function') {
            onMilestone();
        }
        return count;
    } catch (e) {
        if (attendanceCountEl) {
            attendanceCountEl.innerText = '0';
        }
        return 0;
    }
}
