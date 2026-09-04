/* ============================================================================
 * Private Sun Yat-sen Memorial Hall — Danmaku Module (danmaku.js)
 * ============================================================================
 * COMMENTING STANDARDS
 * 1. Block comments only. Inline comments (//) are strictly prohibited.
 * 2. Section dividers use the === banner format.
 * 3. All prose is written in English.
 * ============================================================================ */

let isDanmakuEnabled = false;
let knownDanmaku = new Set();
let danmakuInterval = null;

/* ============================================================================
 * Danmaku Rendering Logic
 * ============================================================================ */
export function createDanmaku(text, containerEl, portraitEl) {
    if (!isDanmakuEnabled || !containerEl) return;

    const span = document.createElement('span');
    span.className = 'danmaku-item';
    span.innerText = text;

    const screenHeight    = window.innerHeight;
    const safePadding     = 30;
    const availableRanges = [];

    /* Mask the portrait coordinates to prevent overdraw */
    if (portraitEl) {
        const rect = portraitEl.getBoundingClientRect();
        if (rect.top > 60)                    availableRanges.push({ min: safePadding,     max: rect.top    - 20 });
        if (screenHeight - rect.bottom > 100) availableRanges.push({ min: rect.bottom + 20, max: screenHeight - 100 });
    }

    if (availableRanges.length === 0) {
        availableRanges.push({ min: safePadding, max: screenHeight - 100 });
    }

    const range = availableRanges[Math.floor(Math.random() * availableRanges.length)];
    span.style.top               = `${Math.random() * (range.max - range.min) + range.min}px`;
    span.style.animationDuration = `${Math.max(8, 15 - Math.random() * 5 + text.length * 0.1)}s`;

    containerEl.appendChild(span);
    span.addEventListener('animationend', () => { span.remove(); });
}

/* ============================================================================
 * Danmaku Data Fetching
 * ============================================================================ */
export async function fetchAndPlayDanmaku(apiUrl, containerEl, portraitEl) {
    if (!isDanmakuEnabled || !apiUrl || !containerEl) return;

    try {
        const response = await fetch(apiUrl + '/danmaku');
        if (!response.ok) return;

        const list  = (await response.json()).list || [];
        let   delay = 0;

        list.forEach(item => {
            const idToTrack  = item.id || item;
            const textToPlay = item.text || item;

            if (knownDanmaku.has(idToTrack)) return;
            knownDanmaku.add(idToTrack);
            setTimeout(() => {
                createDanmaku(textToPlay, containerEl, portraitEl);
            }, delay);
            delay += Math.random() * 2000 + 500;
        });

        if (knownDanmaku.size > 200) {
            knownDanmaku = new Set(Array.from(knownDanmaku).slice(-100));
        }
    } catch (e) {
        /* Fail silently on network errors */
    }
}

/* ============================================================================
 * Danmaku State Toggle
 * ============================================================================ */
export function toggleDanmaku(apiUrl, containerEl, portraitEl, onStateChange) {
    isDanmakuEnabled = !isDanmakuEnabled;

    if (isDanmakuEnabled) {
        if (containerEl) containerEl.classList.remove('hidden');
        fetchAndPlayDanmaku(apiUrl, containerEl, portraitEl);
        if (!danmakuInterval) {
            danmakuInterval = setInterval(() => {
                fetchAndPlayDanmaku(apiUrl, containerEl, portraitEl);
            }, 15000);
        }
    } else {
        if (containerEl) {
            containerEl.classList.add('hidden');
            containerEl.innerHTML = '';
        }
        if (danmakuInterval) {
            clearInterval(danmakuInterval);
            danmakuInterval = null;
        }
    }

    if (typeof onStateChange === 'function') {
        onStateChange(isDanmakuEnabled);
    }

    return isDanmakuEnabled;
}

export function getDanmakuState() {
    return isDanmakuEnabled;
}
