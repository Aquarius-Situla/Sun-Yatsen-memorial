/* ============================================================================
 * Private Sun Yat-sen Memorial Hall — iOS Navigation Transition (ios-nav-transition.js)
 * ============================================================================
 * COMMENTING STANDARDS
 * 1. Block comments only. Inline comments (//) are strictly prohibited.
 * 2. Section dividers use the === banner format.
 * 3. All prose is written in English.
 * ============================================================================ */

/* ============================================================================
 * Helper: Resolve or Create View Layer Container
 * ============================================================================ */
function getOrCreateViewLayer() {
    let layer = document.querySelector('.ios-view-layer');
    if (layer) return layer;

    layer = document.createElement('div');
    layer.className = 'ios-view-layer';

    const tabBar = document.getElementById('apple-tab-bar');
    const nodesToMove = [];
    const children = Array.from(document.body.childNodes);

    children.forEach(node => {
        if (node === tabBar) return;
        if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'SCRIPT') return;
        nodesToMove.push(node);
    });

    nodesToMove.forEach(node => layer.appendChild(node));

    if (tabBar) {
        document.body.insertBefore(layer, tabBar);
    } else {
        document.body.appendChild(layer);
    }

    return layer;
}

/* ============================================================================
 * iOS Native Navigation Transition Controller
 * ============================================================================ */
export function initIOSNavTransition(options = {}) {
    const {
        backButtonSelector = '#nav-back-link, .nav-back-link',
        desktopBackButtonSelector = '.top-back-btn',
        targetUrlOverride = null
    } = options;

    const navBackBtn = document.querySelector(backButtonSelector);
    const desktopBackBtn = document.querySelector(desktopBackButtonSelector);

    /* If no back button exists on this page, exit early */
    if (!navBackBtn && !desktopBackBtn) return;

    const viewLayer = getOrCreateViewLayer();
    const navChevron = document.querySelector('.apple-top-nav .nav-back-link svg');
    const navLabel = document.getElementById('nav-back-text');
    const navTitle = document.getElementById('top-nav-title');

    let isNavigating = false;

    function getTargetUrl() {
        if (targetUrlOverride) return targetUrlOverride;
        if (navBackBtn && navBackBtn.getAttribute('href')) {
            return navBackBtn.getAttribute('href');
        }
        if (desktopBackBtn && desktopBackBtn.getAttribute('href')) {
            return desktopBackBtn.getAttribute('href');
        }
        return null;
    }

    function prefetchUrl(url) {
        if (!url) return;
        try {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = url;
            document.head.appendChild(link);
        } catch (e) {
            /* Prefetch failure is non-fatal */
        }
    }

    function resetNavElements() {
        if (viewLayer) {
            viewLayer.classList.remove('ios-page-sliding-out', 'ios-page-dragging');
            viewLayer.style.transform = '';
            viewLayer.style.transition = '';
        }
        if (navChevron) {
            navChevron.classList.remove('ios-nav-chevron-exit');
            navChevron.style.transform = '';
            navChevron.style.opacity = '';
            navChevron.style.transition = '';
        }
        if (navLabel) {
            navLabel.classList.remove('ios-nav-label-exit');
            navLabel.style.transform = '';
            navLabel.style.opacity = '';
            navLabel.style.transition = '';
        }
        if (navTitle) {
            navTitle.classList.remove('ios-nav-title-exit');
            navTitle.style.transform = '';
            navTitle.style.opacity = '';
            navTitle.style.transition = '';
        }
        isNavigating = false;
    }

    /* ========================================================================
     * Trigger Slide-Out Pop Transition
     * ======================================================================== */
    function triggerPopTransition(targetUrl) {
        if (isNavigating || !targetUrl) return;
        isNavigating = true;

        /* Prefetch destination document for instantaneous swap */
        prefetchUrl(targetUrl);

        /* Apply animated exit classes */
        viewLayer.classList.add('ios-page-sliding-out');

        if (navChevron) navChevron.classList.add('ios-nav-chevron-exit');
        if (navLabel) navLabel.classList.add('ios-nav-label-exit');
        if (navTitle) navTitle.classList.add('ios-nav-title-exit');

        /* Navigate when exit animation reaches 90% completion */
        setTimeout(() => {
            window.location.href = targetUrl;
        }, 260);

        /* Safety fallback in case navigation is delayed */
        setTimeout(() => {
            if (isNavigating) {
                window.location.href = targetUrl;
            }
        }, 500);
    }

    /* ========================================================================
     * Click Event Listeners
     * ======================================================================== */
    function attachClickHandler(btn) {
        if (!btn) return;
        btn.addEventListener('click', (e) => {
            const url = btn.getAttribute('href') || getTargetUrl();
            if (url && !url.startsWith('#') && !url.startsWith('javascript:')) {
                e.preventDefault();
                triggerPopTransition(url);
            }
        });
    }

    attachClickHandler(navBackBtn);
    attachClickHandler(desktopBackBtn);

    /* ========================================================================
     * Interactive Left-Edge Swipe Gesture (iOS Native Interactive Pop)
     * ======================================================================== */
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let isTrackingEdge = false;
    let isSwiping = false;

    function onTouchStart(e) {
        if (isNavigating || e.touches.length !== 1) return;

        const touch = e.touches[0];
        /* Only activate gesture within the left 28px margin */
        if (touch.clientX <= 28) {
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            touchStartTime = Date.now();
            isTrackingEdge = true;
            isSwiping = false;
        }
    }

    function onTouchMove(e) {
        if (!isTrackingEdge || e.touches.length !== 1) return;

        const touch = e.touches[0];
        const deltaX = touch.clientX - touchStartX;
        const deltaY = touch.clientY - touchStartY;

        /* Determine gesture axis */
        if (!isSwiping) {
            if (Math.abs(deltaY) > Math.abs(deltaX)) {
                /* User is scrolling vertically, cancel edge gesture */
                isTrackingEdge = false;
                return;
            }
            if (deltaX > 8 && Math.abs(deltaX) > Math.abs(deltaY)) {
                /* Intent confirmed as horizontal edge swipe */
                isSwiping = true;
                viewLayer.classList.add('ios-page-dragging');
                const target = getTargetUrl();
                if (target) prefetchUrl(target);
            }
        }

        if (isSwiping) {
            /* Prevent vertical viewport scrolling while swiping horizontally */
            if (e.cancelable) e.preventDefault();

            const currentX = Math.max(0, deltaX);
            viewLayer.style.transform = 	ranslate3d(px, 0, 0);

            const progress = Math.min(1, currentX / window.innerWidth);

            /* Real-time parallax feedback on header elements */
            if (navChevron) {
                navChevron.style.transform = 	ranslate3d(px, 0, 0);
                navChevron.style.opacity = ${1 - progress};
            }
            if (navLabel) {
                navLabel.style.transform = 	ranslate3d(px, 0, 0);
                navLabel.style.opacity = ${1 - progress * 0.8};
            }
            if (navTitle) {
                navTitle.style.transform = 	ranslate3d(px, 0, 0);
                navTitle.style.opacity = ${1 - progress};
            }
        }
    }

    function onTouchEnd(e) {
        if (!isTrackingEdge && !isSwiping) return;

        const wasSwiping = isSwiping;
        isTrackingEdge = false;
        isSwiping = false;

        if (!wasSwiping) return;

        const touch = e.changedTouches[0];
        const deltaX = touch ? (touch.clientX - touchStartX) : 0;
        const elapsed = Math.max(1, Date.now() - touchStartTime);
        const velocity = deltaX / elapsed;
        const screenWidth = window.innerWidth || 375;

        /* Commit threshold: 30% of screen width or swift flick velocity */
        const shouldCommit = (deltaX > screenWidth * 0.3) || (deltaX > 40 && velocity > 0.35);
        const target = getTargetUrl();

        viewLayer.classList.remove('ios-page-dragging');

        if (shouldCommit && target) {
            /* Complete slide-out and navigate */
            isNavigating = true;
            viewLayer.style.transition = 'transform 0.22s cubic-bezier(0.32, 0.72, 0, 1)';
            viewLayer.style.transform = 'translate3d(100%, 0, 0)';

            if (navChevron) {
                navChevron.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
                navChevron.style.transform = 'translate3d(-15px, 0, 0)';
                navChevron.style.opacity = '0';
            }
            if (navLabel) {
                navLabel.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
                navLabel.style.transform = 'translate3d(20px, 0, 0)';
                navLabel.style.opacity = '0';
            }
            if (navTitle) {
                navTitle.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
                navTitle.style.transform = 'translate3d(50px, 0, 0)';
                navTitle.style.opacity = '0';
            }

            setTimeout(() => {
                window.location.href = target;
            }, 220);
        } else {
            /* Cancel pop: spring back to origin */
            viewLayer.style.transition = 'transform 0.24s cubic-bezier(0.2, 0.9, 0.3, 1)';
            viewLayer.style.transform = 'translate3d(0, 0, 0)';

            if (navChevron) {
                navChevron.style.transition = 'transform 0.24s ease, opacity 0.24s ease';
                navChevron.style.transform = 'translate3d(0, 0, 0)';
                navChevron.style.opacity = '1';
            }
            if (navLabel) {
                navLabel.style.transition = 'transform 0.24s ease, opacity 0.24s ease';
                navLabel.style.transform = 'translate3d(0, 0, 0)';
                navLabel.style.opacity = '1';
            }
            if (navTitle) {
                navTitle.style.transition = 'transform 0.24s ease, opacity 0.24s ease';
                navTitle.style.transform = 'translate3d(0, 0, 0)';
                navTitle.style.opacity = '1';
            }

            setTimeout(() => {
                viewLayer.style.transition = '';
                viewLayer.style.transform = '';
                if (navChevron) {
                    navChevron.style.transition = '';
                    navChevron.style.transform = '';
                    navChevron.style.opacity = '';
                }
                if (navLabel) {
                    navLabel.style.transition = '';
                    navLabel.style.transform = '';
                    navLabel.style.opacity = '';
                }
                if (navTitle) {
                    navTitle.style.transition = '';
                    navTitle.style.transform = '';
                    navTitle.style.opacity = '';
                }
            }, 260);
        }
    }

    /* Bind passive touchstart and non-passive touchmove for gesture control */
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchEnd, { passive: true });

    /* Handle bfcache restores to prevent stuck state */
    window.addEventListener('pageshow', (e) => {
        if (e.persisted) {
            resetNavElements();
        }
    });
}
