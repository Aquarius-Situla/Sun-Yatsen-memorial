/* ============================================================================
 * Private Sun Yat-sen Memorial Hall — Identicon & Visitor UUID (identicon.js)
 * ============================================================================
 * COMMENTING STANDARDS
 * 1. Block comments only. Inline comments are strictly prohibited.
 * 2. Section dividers use the === banner format.
 * 3. All prose is written in English.
 * ============================================================================ */

/* ============================================================================
 * Section 1: Visitor UUID Manager
 * ============================================================================ */

/**
 * Retrieves existing or generates and persists a canonical RFC 4122 v4 UUID.
 * @returns {string} 36-character UUID (e.g. "4ec03bb3-76a2-4133-8981-a118e48b54b7")
 */
export function getVisitorUuid() {
    let uuid = null;
    try {
        uuid = localStorage.getItem('sys_visitor_uuid');
    } catch (e) {
        /* Storage inaccessible */
    }

    if (uuid && uuid.length >= 32) {
        return uuid;
    }

    /* Fallback to existing attendance fingerprint if valid UUID format */
    try {
        const fp = localStorage.getItem('sys_visitor_fp');
        if (fp && fp.length === 36 && fp.includes('-')) {
            uuid = fp;
        }
    } catch (e) {
        /* Ignore */
    }

    if (!uuid) {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            uuid = crypto.randomUUID();
        } else {
            /* RFC 4122 v4 Pseudo-random UUID fallback */
            uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                const r = (Math.random() * 16) | 0;
                const v = c === 'x' ? r : (r & 0x3) | 0x8;
                return v.toString(16);
            });
        }
    }

    try {
        localStorage.setItem('sys_visitor_uuid', uuid);
        /* Keep attendance fingerprint in sync */
        if (!localStorage.getItem('sys_visitor_fp')) {
            localStorage.setItem('sys_visitor_fp', uuid.replace(/-/g, '').slice(0, 16));
        }
    } catch (e) {
        /* Storage fallback */
    }

    return uuid;
}

/* ============================================================================
 * Section 2: 128-bit UUID Hash Engine
 * ============================================================================ */

/**
 * Extracts or computes 16 raw bytes from a UUID or arbitrary string.
 * @param {string} str
 * @returns {number[]} Array of 16 byte integers (0-255)
 */
function hashStringToBytes(str) {
    const cleanHex = str.replace(/[^0-9a-fA-F]/g, '').toLowerCase();
    if (cleanHex.length >= 32) {
        const bytes = [];
        for (let i = 0; i < 32; i += 2) {
            bytes.push(parseInt(cleanHex.substr(i, 2), 16));
        }
        return bytes;
    }

    /* FNV-1a 128-bit hash derivation */
    let h1 = 0x811c9dc5, h2 = 0x811c9dc5, h3 = 0x811c9dc5, h4 = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
        const c = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ c, 0x01000193);
        h2 = Math.imul(h2 ^ (c * 31), 0x01000193);
        h3 = Math.imul(h3 ^ (c * 17), 0x01000193);
        h4 = Math.imul(h4 ^ (c * 7), 0x01000193);
    }

    return [
        (h1 >>> 24) & 0xff, (h1 >>> 16) & 0xff, (h1 >>> 8) & 0xff, h1 & 0xff,
        (h2 >>> 24) & 0xff, (h2 >>> 16) & 0xff, (h2 >>> 8) & 0xff, h2 & 0xff,
        (h3 >>> 24) & 0xff, (h3 >>> 16) & 0xff, (h3 >>> 8) & 0xff, h3 & 0xff,
        (h4 >>> 24) & 0xff, (h4 >>> 16) & 0xff, (h4 >>> 8) & 0xff, h4 & 0xff
    ];
}

/* ============================================================================
 * Section 3: Symmetrical 5x5 SVG Identicon Generator
 * ============================================================================ */

/**
 * Generates an SVG string representation of an Identicon based on UUID.
 * 5x5 grid with horizontal reflection symmetry (columns 0==4, 1==3).
 * @param {string} uuid
 * @param {number} size Output dimension in px (default 32)
 * @returns {string} Valid standalone SVG XML string
 */
export function generateIdenticonSvg(uuid, size = 32) {
    const bytes = hashStringToBytes(uuid);

    /* Derive vivid HSL foreground color from bytes 12-15 */
    const hue = ((bytes[14] << 8) | bytes[15]) % 360;
    const saturation = 65 + (bytes[13] % 25);
    const lightness = 52 + (bytes[12] % 16);
    const fgColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

    /* Dark matching tinted background */
    const bgColor = `hsl(${hue}, 28%, 14%)`;

    /* 5x5 Grid construction: 5 rows, 3 unique columns reflected to 5 */
    const rects = [];
    for (let r = 0; r < 5; r++) {
        const rowByte = bytes[r];
        for (let c = 0; c < 3; c++) {
            /* Check bit flag for this cell */
            const isFilled = (rowByte & (1 << c)) !== 0;
            if (isFilled) {
                rects.push(`<rect x="${c}" y="${r}" width="1" height="1" fill="${fgColor}"/>`);
                if (c < 2) {
                    const mirroredCol = 4 - c;
                    rects.push(`<rect x="${mirroredCol}" y="${r}" width="1" height="1" fill="${fgColor}"/>`);
                }
            }
        }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 5 5" width="${size}" height="${size}" shape-rendering="crispEdges"><rect width="5" height="5" fill="${bgColor}"/>${rects.join('')}</svg>`;
}

/**
 * Generates an Identicon Data URI suitable for img src or CSS background.
 * @param {string} uuid
 * @param {number} size
 * @returns {string} Data URI (data:image/svg+xml;utf8,...)
 */
export function generateIdenticonDataUri(uuid, size = 32) {
    const svg = generateIdenticonSvg(uuid, size);
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
