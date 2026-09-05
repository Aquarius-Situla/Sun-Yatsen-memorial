/* ============================================================================
 * Private Sun Yat-sen Memorial Hall — iOS Navigation Transition (ios-nav-transition.js)
 * ============================================================================
 * COMMENTING STANDARDS
 * 1. Block comments only. Inline comments (//) are strictly prohibited.
 * 2. Section dividers use the === banner format.
 * 3. All prose is written in English.
 * ============================================================================ */

export function initIOSNavTransition(options = {}) {
    const {
        backButtonSelector = '#nav-back-link, .nav-back-link',
        desktopBackButtonSelector = '.top-back-btn'
    } = options;

    const navBackBtn = document.querySelector(backButtonSelector);
    const desktopBackBtn = document.querySelector(desktopBackButtonSelector);

    /* If no back button exists on this page, exit early */
    if (!navBackBtn && !desktopBackBtn) return;

    const navChevron = document.querySelector('.apple-top-nav .nav-back-link svg');
    const navLabel = document.getElementById('nav-back-text');
    const navTitle = document.getElementById('top-nav-title');

    function getContentElements() {
        return document.querySelectorAll('.festival-hero, .markdown-container, .charts-container, .ios-group-container, .top-back-btn, .lang-toggle-btn');
    }

    let isNavigating = false;

    function getTargetUrl(btn) {
        if (btn && btn.getAttribute('href')) {
            return btn.getAttribute('href');
        }
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
            /* Ignore prefetch failures */
        }
    }

    function triggerPopTransition(targetUrl) {
        if (isNavigating || !targetUrl) return;
        isNavigating = true;

        prefetchUrl(targetUrl);

        /* Animate nav bar micro-interactions */
        if (navChevron) navChevron.classList.add('ios-nav-chevron-exit');
        if (navLabel) navLabel.classList.add('ios-nav-label-exit');
        if (navTitle) navTitle.classList.add('ios-nav-title-exit');

        /* Animate page content sliding out to the right */
        const contents = getContentElements();
        contents.forEach(el => el.classList.add('ios-content-sliding-out'));

        /* Navigate when exit animation reaches peak */
        setTimeout(() => {
            window.location.href = targetUrl;
        }, 240);

        /* Fallback guarantee */
        setTimeout(() => {
            window.location.href = targetUrl;
        }, 500);
    }

    function attachClickHandler(btn) {
        if (!btn) return;
        btn.addEventListener('click', (e) => {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.which === 2) return;
            const url = getTargetUrl(btn);
            if (url && !url.startsWith('#') && !url.startsWith('javascript:')) {
                e.preventDefault();
                btn.style.opacity = '0.35';
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

        /* CRITICAL: Never intercept touches on navigation headers or buttons */
        if (touch.clientY < 60 || (e.target && e.target.closest && e.target.closest('.apple-top-nav, .top-back-btn'))) {
            return;
        }

        /* Only activate gesture within the left 25px margin */
        if (touch.clientX <= 25) {
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

        if (!isSwiping) {
            if (Math.abs(deltaY) > Math.abs(deltaX)) {
                /* Vertical scroll intent: cancel gesture */
                isTrackingEdge = false;
                return;
            }
            if (deltaX > 8 && Math.abs(deltaX) > Math.abs(deltaY)) {
                /* Horizontal swipe intent confirmed */
                isSwiping = true;
                const contents = getContentElements();
                contents.forEach(el => el.classList.add('ios-content-dragging'));
                const target = getTargetUrl(navBackBtn);
                if (target) prefetchUrl(target);
            }
        }

        if (isSwiping) {
            if (e.cancelable) e.preventDefault();

            const currentX = Math.max(0, deltaX);
            const progress = Math.min(1, currentX / (window.innerWidth || 375));

            const contents = getContentElements();
            contents.forEach(el => {
                el.style.transform = 'translate3d(' + currentX + 'px, 0, 0)';
            });

            if (navChevron) {
                navChevron.style.transform = 'translate3d(' + (-14 * (1 - progress)) + 'px, 0, 0)';
                navChevron.style.opacity = String(1 - progress);
            }
            if (navLabel) {
                navLabel.style.transform = 'translate3d(' + (24 * progress) + 'px, 0, 0)';
                navLabel.style.opacity = String(1 - progress * 0.8);
            }
            if (navTitle) {
                navTitle.style.transform = 'translate3d(' + (50 * progress) + 'px, 0, 0)';
                navTitle.style.opacity = String(1 - progress);
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

        const shouldCommit = (deltaX > screenWidth * 0.3) || (deltaX > 40 && velocity > 0.35);
        const target = getTargetUrl(navBackBtn);
        const contents = getContentElements();

        contents.forEach(el => el.classList.remove('ios-content-dragging'));

        if (shouldCommit && target) {
            isNavigating = true;
            contents.forEach(el => {
                el.style.transition = 'transform 0.22s cubic-bezier(0.32, 0.72, 0, 1)';
                el.style.transform = 'translate3d(100%, 0, 0)';
            });

            if (navChevron) {
                navChevron.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
                navChevron.style.transform = 'translate3d(-14px, 0, 0)';
                navChevron.style.opacity = '0';
            }
            if (navLabel) {
                navLabel.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
                navLabel.style.transform = 'translate3d(24px, 0, 0)';
                navLabel.style.opacity = '0';
            }
            if (navTitle) {
                navTitle.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
                navTitle.style.transform = 'translate3d(50px, 0, 0)';
                navTitle.style.opacity = '0';
            }

            setTimeout(() => {
                window.location.href = target;
            }, 210);
        } else {
            /* Cancel pop */
            contents.forEach(el => {
                el.style.transition = 'transform 0.24s cubic-bezier(0.2, 0.9, 0.3, 1)';
                el.style.transform = 'translate3d(0, 0, 0)';
            });

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
                contents.forEach(el => {
                    el.style.transition = '';
                    el.style.transform = '';
                });
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
            }, 250);
        }
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchEnd, { passive: true });

    /* Handle bfcache restore */
    window.addEventListener('pageshow', (e) => {
        if (e.persisted) {
            if (navBackBtn) navBackBtn.style.opacity = '';
            if (desktopBackBtn) desktopBackBtn.style.opacity = '';
            const contents = getContentElements();
            contents.forEach(el => {
                el.classList.remove('ios-content-sliding-out', 'ios-content-dragging');
                el.style.transform = '';
                el.style.transition = '';
            });
            if (navChevron) {
                navChevron.classList.remove('ios-nav-chevron-exit');
                navChevron.style.transform = '';
                navChevron.style.opacity = '';
            }
            if (navLabel) {
                navLabel.classList.remove('ios-nav-label-exit');
                navLabel.style.transform = '';
                navLabel.style.opacity = '';
            }
            if (navTitle) {
                navTitle.classList.remove('ios-nav-title-exit');
                navTitle.style.transform = '';
                navTitle.style.opacity = '';
            }
            isNavigating = false;
        }
    });
}
