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
        const currentParams = new URLSearchParams(window.location.search);
        if (currentParams.get('from') === 'announcement') {
            return '../../pages/announcement/announcement.html?tab=memorial';
        }
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
     * Section 4: Original Unified Page-Transition Exit Animation
     * ======================================================================== */
    function triggerPopTransition(targetUrl) {
        if (isNavigating || !targetUrl) return;
        isNavigating = true;

        prefetchUrl(targetUrl);

        /* Trigger the original page-transition animation on the entire document body */
        document.body.classList.add('page-transition');

        setTimeout(function() {
            window.location.href = targetUrl;
        }, 280);

        setTimeout(function() {
            window.location.href = targetUrl;
        }, 500);
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
     * Section 5: BFCache & History Restore Handlers
     * ======================================================================== */
    window.addEventListener('pageshow', function(e) {
        if (e.persisted) {
            document.body.classList.remove('page-transition');
            if (navBackBtn) {
                navBackBtn.style.opacity = '';
                navBackBtn.style.transform = '';
            }
            if (desktopBackBtn) desktopBackBtn.style.opacity = '';
            if (navTitle) {
                navTitle.style.opacity = '';
                navTitle.style.transform = '';
            }
            const slideElements = getSlideElements();
            for (let i = 0; i < slideElements.length; i++) {
                slideElements[i].classList.remove('ios-content-entering', 'ios-content-enter-active');
                slideElements[i].style.transform = '';
            }
            isNavigating = false;
        }
    });
}
