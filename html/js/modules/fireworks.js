/* ============================================================================
 * Private Sun Yat-sen Memorial Hall — Fireworks Module (fireworks.js)
 * ============================================================================
 * COMMENTING STANDARDS
 * 1. Block comments only. Inline comments (//) are strictly prohibited.
 * 2. Section dividers use the === banner format.
 * 3. All prose is written in English.
 * ============================================================================ */

export function loadAndTriggerFireworks() {
    if (window.triggerFireworks) {
        window.triggerFireworks();
        return;
    }

    const cb = Date.now();
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `events/celebration/fireworks.css?v=${cb}`;
    document.head.appendChild(link);

    const fwScript = document.createElement('script');
    fwScript.src = `events/celebration/fireworks.js?v=${cb}`;
    fwScript.onload = () => {
        if (window.triggerFireworks) {
            window.triggerFireworks();
        }
    };
    document.body.appendChild(fwScript);
}
