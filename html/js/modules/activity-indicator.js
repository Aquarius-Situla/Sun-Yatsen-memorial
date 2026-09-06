/* ============================================================================
 * Private Sun Yat-sen Memorial Hall — Apple Native Activity Indicator (activity-indicator.js)
 * ============================================================================
 * COMMENTING STANDARDS
 * 1. Block comments only. Inline comments are strictly prohibited.
 * 2. Section dividers use the === banner format.
 * 3. All prose is written in English.
 * ============================================================================ */

import { getCurrentLang } from './i18n.js?v=20260906x';

/* ============================================================================
 * Section 1: Factory & Mounting Methods
 * ============================================================================ */

/**
 * Creates an authentic 12-blade Apple daisy spinner overlay element
 * @param {string|null} customText - Optional label text, defaults to localized "載入中…" / "载入中…"
 * @returns {HTMLElement} The overlay element
 */
export function createActivityIndicator(customText = null) {
    const isTraditional = getCurrentLang() === 'tc';
    const defaultText = isTraditional ? '載入中…' : '载入中…';
    const text = customText !== null ? customText : defaultText;

    const overlay = document.createElement('div');
    overlay.className = 'sys-activity-overlay';
    overlay.setAttribute('role', 'status');
    overlay.setAttribute('aria-live', 'polite');

    overlay.innerHTML = `
        <div class="sys-activity-spinner" aria-hidden="true">
            <div class="sys-activity-blade"></div>
            <div class="sys-activity-blade"></div>
            <div class="sys-activity-blade"></div>
            <div class="sys-activity-blade"></div>
            <div class="sys-activity-blade"></div>
            <div class="sys-activity-blade"></div>
            <div class="sys-activity-blade"></div>
            <div class="sys-activity-blade"></div>
            <div class="sys-activity-blade"></div>
            <div class="sys-activity-blade"></div>
            <div class="sys-activity-blade"></div>
            <div class="sys-activity-blade"></div>
        </div>
        <div class="sys-activity-text">${text}</div>
    `;

    return overlay;
}

/**
 * Mounts activity indicator overlay inside a target container
 * @param {HTMLElement} container - The container element to mount inside
 * @param {string|null} text - Optional label text
 * @returns {HTMLElement} The mounted overlay
 */
export function showActivityIndicator(container, text = null) {
    if (!container) return null;
    hideActivityIndicator(container);
    const indicator = createActivityIndicator(text);
    container.appendChild(indicator);
    return indicator;
}

/**
 * Smoothly fades out and removes activity indicator overlay from a container
 * @param {HTMLElement} container - The container to remove the indicator from
 */
export function hideActivityIndicator(container) {
    if (!container) return;
    const overlays = container.querySelectorAll('.sys-activity-overlay');
    overlays.forEach(overlay => {
        overlay.classList.add('overlay-fading');
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        }, 220);
    });
}
