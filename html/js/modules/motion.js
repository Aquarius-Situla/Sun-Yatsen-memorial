/* ============================================================================
 * Private Sun Yat-sen Memorial Hall — 3D Motion & Lighting Module (motion.js)
 * ============================================================================
 * COMMENTING STANDARDS
 * 1. Block comments only. Inline comments (//) are strictly prohibited.
 * 2. Section dividers use the === banner format.
 * 3. All prose is written in English.
 * ============================================================================ */

/* ============================================================================
 * Frame Lighting Calculations
 * ============================================================================
 * Updates CSS custom properties to simulate directional shadows and highlights.
 * ============================================================================ */
export function applyFrameLighting(woodFrame, rotX, rotY) {
    if (!woodFrame) return;

    const scale  = 2.8;
    const baseHL = 6;
    const baseSH = 8;

    const hlX = (-baseHL + rotY * scale).toFixed(1);
    const hlY = (-baseHL - rotX * scale).toFixed(1);
    const shX = ( baseSH - rotY * scale).toFixed(1);
    const shY = ( baseSH + rotX * scale).toFixed(1);

    const intensity = Math.hypot(rotX, rotY) / 5;
    const hlAlpha   = (0.04 + intensity * 0.12).toFixed(3);
    const shAlpha   = (0.60 + intensity * 0.20).toFixed(3);

    woodFrame.style.setProperty('--hl-x',     `${hlX}px`);
    woodFrame.style.setProperty('--hl-y',     `${hlY}px`);
    woodFrame.style.setProperty('--hl-alpha',  hlAlpha);
    woodFrame.style.setProperty('--sh-x',     `${shX}px`);
    woodFrame.style.setProperty('--sh-y',     `${shY}px`);
    woodFrame.style.setProperty('--sh-alpha',  shAlpha);
}

/* ============================================================================
 * Desktop Mouse Parallax Integration
 * ============================================================================ */
export function initDesktopParallax(woodFrame) {
    if (!woodFrame || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    document.addEventListener('mousemove', (e) => {
        const xAxis    = (window.innerWidth  / 2 - e.pageX) / (window.innerWidth  / 2);
        const yAxis    = (window.innerHeight / 2 - e.pageY) / (window.innerHeight / 2);
        const maxAngle = 3;
        const rotateX  =  yAxis * maxAngle;
        const rotateY  = -xAxis * maxAngle;

        woodFrame.style.transform = `translateZ(0) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        applyFrameLighting(woodFrame, rotateX, rotateY);
    });

    document.addEventListener('mouseleave', () => {
        woodFrame.style.transform = 'translateZ(0) rotateX(0deg) rotateY(0deg)';
        applyFrameLighting(woodFrame, 0, 0);
    });
}

/* ============================================================================
 * Mobile Gyroscope Integration
 * ============================================================================ */
export function initGyroscopeLighting(woodFrame) {
    if (!woodFrame) return;
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') return;
    if (!('DeviceOrientationEvent' in window)) return;

    let targetRotX  = 0, targetRotY  = 0;
    let currentRotX = 0, currentRotY = 0;
    let rafId       = null;
    let isActive    = false;
    let baseBeta    = null, baseGamma = null;

    function smoothLoop() {
        currentRotX += (targetRotX - currentRotX) * 0.10;
        currentRotY += (targetRotY - currentRotY) * 0.10;
        woodFrame.style.transform = `translateZ(0) rotateX(${currentRotX}deg) rotateY(${currentRotY}deg)`;
        applyFrameLighting(woodFrame, currentRotX, currentRotY);
        rafId = requestAnimationFrame(smoothLoop);
    }

    function handleOrientation(e) {
        if (e.beta === null || e.gamma === null) return;
        if (baseBeta === null) { baseBeta = e.beta; baseGamma = e.gamma; }
        const max = 5;
        targetRotX = Math.max(-max, Math.min(max, (e.beta  - baseBeta)  * 0.25));
        targetRotY = Math.max(-max, Math.min(max, (e.gamma - baseGamma) * 0.25));
    }

    function startGyroscope() {
        if (isActive) return;
        isActive  = true;
        baseBeta  = null;
        baseGamma = null;
        window.addEventListener('deviceorientation', handleOrientation, { passive: true });
        smoothLoop();
    }

    function stopGyroscope() {
        if (!isActive) return;
        isActive = false;
        window.removeEventListener('deviceorientation', handleOrientation);
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        targetRotX = 0;
        targetRotY = 0;
    }

    document.addEventListener('visibilitychange', () => {
        document.hidden ? stopGyroscope() : startGyroscope();
    });

    setTimeout(startGyroscope, 600);
}
