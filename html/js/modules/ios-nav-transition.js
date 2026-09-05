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

    function prefetchUrl(url) {
        if (!url) return;
        try {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = url;
            document.head.appendChild(link);
            if (window.fetch) {
                fetch(url, { priority: 'low' }).catch(function() {});
            }
        } catch (e) {
            /* Ignore prefetch failures */
        }
    }

    /* ========================================================================
     * Section 1: Forward Push Intent Listener (Row Clicks)
     * ======================================================================== */
    const rowLinks = document.querySelectorAll('.ios-row[href], a.has-subpage-transition[href]');
    for (let i = 0; i < rowLinks.length; i++) {
        const link = rowLinks[i];
        const href = link.getAttribute('href');
        if (!href || href.startsWith('#') || href.startsWith('javascript:')) continue;

        link.addEventListener('click', function(e) {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.which === 2) return;
            e.preventDefault();

            try {
                sessionStorage.setItem('sys_nav_action', 'push');
            } catch (err) {
                /* Storage fallback */
            }

            prefetchUrl(href);

            /* Navigate cleanly without premature parent shifting */
            window.location.href = href;
        });
    }

    /* ========================================================================
     * Section 2: Subpage Detection & Verification
     * ======================================================================== */
    const navBackBtn = document.querySelector('.apple-top-nav .nav-back-link');
    const desktopBackBtn = document.querySelector(desktopBackButtonSelector);

    /* Hub menu pages should never act as subpages */
    const isMenuPage = document.body.classList.contains('page-announcement-menu') ||
                       document.body.classList.contains('page-settings-menu') ||
                       document.body.classList.contains('page-library-menu') ||
                       !navBackBtn;

    if (isMenuPage) {
        try {
            sessionStorage.removeItem('sys_nav_action');
        } catch (e) {
            /* Ignore storage errors */
        }
        return;
    }

    const navTitle = document.getElementById('top-nav-title');

    function getSlideElements() {
        return Array.from(document.querySelectorAll('.festival-hero, .markdown-container, .charts-container, .ios-group-container'));
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

    const initialTarget = getTargetUrl(navBackBtn || desktopBackBtn);
    prefetchUrl(initialTarget);

    /* ========================================================================
     * Section 3: Forward Push Entrance Animation Execution
     * ======================================================================== */
    let isForwardPush = false;
    try {
        if (sessionStorage.getItem('sys_nav_action') === 'push') {
            isForwardPush = true;
            sessionStorage.removeItem('sys_nav_action');
        }
    } catch (e) {
        isForwardPush = false;
    }

    if (isForwardPush) {
        const enterElements = getSlideElements();
        for (let i = 0; i < enterElements.length; i++) {
            enterElements[i].classList.add('ios-content-entering');
        }
        if (navTitle) navTitle.classList.add('ios-nav-title-enter');
        if (navBackBtn) navBackBtn.classList.add('ios-nav-back-enter');

        requestAnimationFrame(function() {
            requestAnimationFrame(function() {
                for (let i = 0; i < enterElements.length; i++) {
                    enterElements[i].classList.remove('ios-content-entering');
                    enterElements[i].classList.add('ios-content-enter-active');
                }
                if (navTitle) {
                    navTitle.classList.remove('ios-nav-title-enter');
                    navTitle.classList.add('ios-nav-title-enter-active');
                }
                if (navBackBtn) {
                    navBackBtn.classList.remove('ios-nav-back-enter');
                    navBackBtn.classList.add('ios-nav-back-enter-active');
                }

                setTimeout(function() {
                    for (let i = 0; i < enterElements.length; i++) {
                        enterElements[i].classList.remove('ios-content-enter-active');
                    }
                    if (navTitle) navTitle.classList.remove('ios-nav-title-enter-active');
                    if (navBackBtn) navBackBtn.classList.remove('ios-nav-back-enter-active');
                }, 320);
            });
        });
    }

    /* ========================================================================
     * Section 4: Pop Exit Transition (Button Trigger)
     * ======================================================================== */
    function triggerPopTransition(targetUrl) {
        if (isNavigating || !targetUrl) return;
        isNavigating = true;

        prefetchUrl(targetUrl);

        if (navBackBtn) {
            navBackBtn.style.transition = 'opacity 0.18s ease, transform 0.18s ease';
            navBackBtn.style.opacity = '0';
            navBackBtn.style.transform = 'translate3d(-10px, 0, 0)';
        }
        if (navTitle) {
            navTitle.style.transition = 'opacity 0.18s ease, transform 0.18s ease';
            navTitle.style.opacity = '0';
            navTitle.style.transform = 'translate3d(30px, 0, 0)';
        }

        const slideElements = getSlideElements();
        for (let i = 0; i < slideElements.length; i++) {
            slideElements[i].classList.add('ios-content-sliding-out');
        }

        setTimeout(function() {
            window.location.href = targetUrl;
        }, 210);

        setTimeout(function() {
            window.location.href = targetUrl;
        }, 450);
    }

    function attachClickHandler(btn) {
        if (!btn) return;

        btn.addEventListener('touchstart', function() {
            btn.style.opacity = '0.35';
        }, { passive: true });

        btn.addEventListener('touchend', function() {
            if (!isNavigating) {
                setTimeout(function() {
                    if (!isNavigating) btn.style.opacity = '';
                }, 150);
            }
        }, { passive: true });

        btn.addEventListener('click', function(e) {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.which === 2) return;
            const url = getTargetUrl(btn);
            if (url && !url.startsWith('#') && !url.startsWith('javascript:')) {
                e.preventDefault();
                btn.style.opacity = '0.35';
                triggerPopTransition(url);
            }
        });
    }

    const backButtons = document.querySelectorAll(backButtonSelector);
    for (let i = 0; i < backButtons.length; i++) {
        attachClickHandler(backButtons[i]);
    }

    const desktopBackButtons = document.querySelectorAll(desktopBackButtonSelector);
    for (let i = 0; i < desktopBackButtons.length; i++) {
        attachClickHandler(desktopBackButtons[i]);
    }

    /* ========================================================================
     * Section 5: Interactive Left-Edge Swipe Gesture (iOS Native Pop)
     * ======================================================================== */
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let isTrackingEdge = false;
    let isSwiping = false;

    function stopTracking() {
        isTrackingEdge = false;
        isSwiping = false;
        window.removeEventListener('touchmove', onTouchMove);
    }

    function onTouchStart(e) {
        if (isNavigating || e.touches.length !== 1) return;

        const touch = e.touches[0];
        if (touch.clientY < 60 || (e.target && e.target.closest && e.target.closest('.apple-top-nav, .top-back-btn, .apple-tab-bar'))) {
            return;
        }

        if (touch.clientX <= 25) {
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            touchStartTime = Date.now();
            isTrackingEdge = true;
            isSwiping = false;
            window.addEventListener('touchmove', onTouchMove, { passive: false });
        }
    }

    function onTouchMove(e) {
        if (!isTrackingEdge || e.touches.length !== 1) return;

        const touch = e.touches[0];
        const deltaX = touch.clientX - touchStartX;
        const deltaY = touch.clientY - touchStartY;

        if (!isSwiping) {
            if (Math.abs(deltaY) > Math.abs(deltaX)) {
                stopTracking();
                return;
            }
            if (deltaX > 8 && Math.abs(deltaX) > Math.abs(deltaY)) {
                isSwiping = true;
                const slideElements = getSlideElements();
                for (let i = 0; i < slideElements.length; i++) {
                    slideElements[i].classList.add('ios-content-dragging');
                }
                const target = getTargetUrl(navBackBtn);
                if (target) prefetchUrl(target);
            }
        }

        if (isSwiping) {
            if (e.cancelable) e.preventDefault();

            const currentX = Math.max(0, deltaX);
            const screenWidth = window.innerWidth || 375;
            const progress = Math.min(1, currentX / screenWidth);

            const slideElements = getSlideElements();
            for (let i = 0; i < slideElements.length; i++) {
                slideElements[i].style.transform = 'translate3d(' + currentX + 'px, 0, 0)';
            }

            if (navBackBtn) {
                navBackBtn.style.opacity = String(1 - progress);
                navBackBtn.style.transform = 'translate3d(' + (-10 * progress) + 'px, 0, 0)';
            }
            if (navTitle) {
                navTitle.style.opacity = String(1 - progress);
                navTitle.style.transform = 'translate3d(' + (30 * progress) + 'px, 0, 0)';
            }
        }
    }

    function onTouchEnd(e) {
        if (!isTrackingEdge && !isSwiping) {
            window.removeEventListener('touchmove', onTouchMove);
            return;
        }

        const wasSwiping = isSwiping;
        stopTracking();

        if (!wasSwiping) return;

        const touch = e.changedTouches[0];
        const deltaX = touch ? (touch.clientX - touchStartX) : 0;
        const elapsed = Math.max(1, Date.now() - touchStartTime);
        const velocity = deltaX / elapsed;
        const screenWidth = window.innerWidth || 375;

        const shouldCommit = (deltaX > screenWidth * 0.3) || (deltaX > 40 && velocity > 0.35);
        const target = getTargetUrl(navBackBtn);
        const slideElements = getSlideElements();

        for (let i = 0; i < slideElements.length; i++) {
            slideElements[i].classList.remove('ios-content-dragging');
        }

        if (shouldCommit && target) {
            isNavigating = true;
            for (let i = 0; i < slideElements.length; i++) {
                slideElements[i].style.transition = 'transform 0.2s cubic-bezier(0.32, 0.72, 0, 1)';
                slideElements[i].style.transform = 'translate3d(100%, 0, 0)';
            }
            if (navBackBtn) {
                navBackBtn.style.transition = 'opacity 0.18s ease, transform 0.18s ease';
                navBackBtn.style.opacity = '0';
                navBackBtn.style.transform = 'translate3d(-10px, 0, 0)';
            }
            if (navTitle) {
                navTitle.style.transition = 'opacity 0.18s ease, transform 0.18s ease';
                navTitle.style.opacity = '0';
                navTitle.style.transform = 'translate3d(30px, 0, 0)';
            }

            setTimeout(function() {
                window.location.href = target;
            }, 200);
        } else {
            /* Cancel swipe return */
            for (let i = 0; i < slideElements.length; i++) {
                slideElements[i].style.transition = 'transform 0.22s cubic-bezier(0.2, 0.9, 0.3, 1)';
                slideElements[i].style.transform = 'translate3d(0, 0, 0)';
            }
            if (navBackBtn) {
                navBackBtn.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
                navBackBtn.style.opacity = '1';
                navBackBtn.style.transform = 'translate3d(0, 0, 0)';
            }
            if (navTitle) {
                navTitle.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
                navTitle.style.opacity = '1';
                navTitle.style.transform = 'translate3d(0, 0, 0)';
            }

            setTimeout(function() {
                for (let i = 0; i < slideElements.length; i++) {
                    slideElements[i].style.transition = '';
                    slideElements[i].style.transform = '';
                }
                if (navBackBtn) {
                    navBackBtn.style.transition = '';
                    navBackBtn.style.opacity = '';
                    navBackBtn.style.transform = '';
                }
                if (navTitle) {
                    navTitle.style.transition = '';
                    navTitle.style.opacity = '';
                    navTitle.style.transform = '';
                }
            }, 240);
        }
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchEnd, { passive: true });

    /* ========================================================================
     * Section 6: BFCache & History Restore Handlers
     * ======================================================================== */
    window.addEventListener('pageshow', function(e) {
        if (e.persisted) {
            if (navBackBtn) {
                navBackBtn.style.opacity = '';
                navBackBtn.style.transform = '';
                navBackBtn.style.transition = '';
            }
            if (desktopBackBtn) desktopBackBtn.style.opacity = '';
            if (navTitle) {
                navTitle.style.opacity = '';
                navTitle.style.transform = '';
                navTitle.style.transition = '';
            }
            const slideElements = getSlideElements();
            for (let i = 0; i < slideElements.length; i++) {
                slideElements[i].classList.remove('ios-content-sliding-out', 'ios-content-dragging', 'ios-content-entering', 'ios-content-enter-active');
                slideElements[i].style.transform = '';
                slideElements[i].style.transition = '';
            }
            isNavigating = false;
        }
    });
}
