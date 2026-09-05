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
     * Section 1: Hub & Parent Page Handling (Snapshot Caching & Forward Push)
     * ======================================================================== */
    const currentGroup = document.querySelector('.ios-group-container');
    if (currentGroup) {
        try {
            const sanitizedSnapshot = currentGroup.outerHTML.replace(/\s+id="[^"]*"/g, '');
            sessionStorage.setItem('sys_last_group_html', sanitizedSnapshot);
            const pathname = window.location.pathname || '';
            sessionStorage.setItem('sys_underlay_' + pathname, sanitizedSnapshot);
        } catch (e) {
            /* Ignore storage quota or access errors */
        }
    }

    /* Attach forward push listener to clickable rows */
    const rowLinks = document.querySelectorAll('.ios-row[href], a.has-subpage-transition[href]');
    for (let i = 0; i < rowLinks.length; i++) {
        const link = rowLinks[i];
        const href = link.getAttribute('href');
        if (!href || href.startsWith('#') || href.startsWith('javascript:')) continue;

        link.addEventListener('click', function(e) {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.which === 2) return;
            e.preventDefault();

            try {
                if (currentGroup) {
                    const freshSanitized = currentGroup.outerHTML.replace(/\s+id="[^"]*"/g, '');
                    sessionStorage.setItem('sys_last_group_html', freshSanitized);
                    const cleanPath = href.split('?')[0].split('#')[0];
                    sessionStorage.setItem('sys_underlay_' + cleanPath, freshSanitized);
                }
                sessionStorage.setItem('sys_nav_action', 'push');
            } catch (err) {
                /* Storage fallback */
            }

            prefetchUrl(href);

            /* Immediately navigate without prematurely shifting the parent view */
            window.location.href = href;
        });
    }

    /* ========================================================================
     * Section 2: Subpage Detection & Verification
     * ======================================================================== */
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
    let underlayLayer = null;
    let underlayContent = null;
    let underlayScrim = null;
    let viewSheet = null;

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

    function getSlideElements() {
        const list = Array.from(getContentElements());
        if (viewSheet && list.indexOf(viewSheet) === -1) {
            list.push(viewSheet);
        }
        return list;
    }

    /* ========================================================================
     * Section 3: Underlay Parallax Layer Initialization & Seamless Caching
     * ======================================================================== */
    function ensureUnderlay(targetUrl) {
        if (underlayLayer) return;
        underlayLayer = document.querySelector('.ios-underlay-layer');
        if (!underlayLayer) {
            underlayLayer = document.createElement('div');
            underlayLayer.className = 'ios-underlay-layer ready';

            underlayContent = document.createElement('div');
            underlayContent.className = 'ios-underlay-content';

            underlayScrim = document.createElement('div');
            underlayScrim.className = 'ios-underlay-scrim';

            underlayLayer.appendChild(underlayContent);
            underlayLayer.appendChild(underlayScrim);
            document.body.prepend(underlayLayer);
        } else {
            underlayContent = underlayLayer.querySelector('.ios-underlay-content');
            underlayScrim = underlayLayer.querySelector('.ios-underlay-scrim');
        }

        viewSheet = document.querySelector('.ios-view-sheet');
        if (!viewSheet) {
            viewSheet = document.createElement('div');
            viewSheet.className = 'ios-view-sheet';
            document.body.insertBefore(viewSheet, underlayLayer.nextSibling);
        }

        /* Populate underlay content with parent cards snapshot */
        if (underlayContent && underlayContent.children.length === 0) {
            let cachedHtml = null;
            try {
                if (targetUrl) {
                    const cleanPath = targetUrl.split('?')[0].split('#')[0];
                    cachedHtml = sessionStorage.getItem('sys_underlay_' + cleanPath);
                }
                if (!cachedHtml) {
                    cachedHtml = sessionStorage.getItem('sys_last_group_html');
                }
            } catch (e) {
                cachedHtml = null;
            }

            if (cachedHtml) {
                underlayContent.innerHTML = cachedHtml.replace(/\s+id="[^"]*"/g, '');
            } else if (targetUrl && window.fetch) {
                /* Asynchronously fetch parent page HTML in background to populate underlay */
                fetch(targetUrl)
                    .then(function(res) { return res.text(); })
                    .then(function(html) {
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(html, 'text/html');
                        const remoteGroup = doc.querySelector('.ios-group-container');
                        if (remoteGroup && underlayContent && underlayContent.children.length === 0) {
                            underlayContent.innerHTML = remoteGroup.outerHTML.replace(/\s+id="[^"]*"/g, '');
                        }
                    })
                    .catch(function() {});
            }
        }
    }

    const initialTarget = getTargetUrl(navBackBtn || desktopBackBtn);
    ensureUnderlay(initialTarget);
    prefetchUrl(initialTarget);

    /* ========================================================================
     * Section 4: Forward Push Entrance Animation Execution
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
        if (navChevron) navChevron.classList.add('ios-nav-back-enter');
        if (navLabel) navLabel.classList.add('ios-nav-back-enter');

        if (underlayLayer) {
            underlayLayer.style.transform = 'translate3d(0, 0, 0)';
            underlayLayer.style.transition = 'none';
        }
        if (underlayScrim) {
            underlayScrim.style.opacity = '0';
            underlayScrim.style.transition = 'none';
        }

        requestAnimationFrame(function() {
            requestAnimationFrame(function() {
                for (let i = 0; i < enterElements.length; i++) {
                    enterElements[i].classList.remove('ios-content-entering');
                    enterElements[i].classList.add('ios-content-enter-active');
                }
                if (navTitle) navTitle.classList.add('ios-nav-title-enter-active');
                if (navChevron) navChevron.classList.add('ios-nav-back-enter-active');
                if (navLabel) navLabel.classList.add('ios-nav-back-enter-active');

                if (underlayLayer) {
                    underlayLayer.style.transition = 'transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)';
                    underlayLayer.style.transform = 'translate3d(-30%, 0, 0)';
                }
                if (underlayScrim) {
                    underlayScrim.style.transition = 'opacity 0.28s cubic-bezier(0.32, 0.72, 0, 1)';
                    underlayScrim.style.opacity = '0.3';
                }

                setTimeout(function() {
                    for (let i = 0; i < enterElements.length; i++) {
                        enterElements[i].classList.remove('ios-content-enter-active');
                    }
                    if (navTitle) navTitle.classList.remove('ios-nav-title-enter', 'ios-nav-title-enter-active');
                    if (navChevron) navChevron.classList.remove('ios-nav-back-enter', 'ios-nav-back-enter-active');
                    if (navLabel) navLabel.classList.remove('ios-nav-back-enter', 'ios-nav-back-enter-active');
                    if (underlayLayer) underlayLayer.style.transition = '';
                    if (underlayScrim) underlayScrim.style.transition = '';
                }, 300);
            });
        });
    }

    /* ========================================================================
     * Section 5: Navigation Exit Transition (Button Trigger)
     * ======================================================================== */
    function triggerPopTransition(targetUrl) {
        if (isNavigating || !targetUrl) return;
        isNavigating = true;

        prefetchUrl(targetUrl);
        ensureUnderlay(targetUrl);

        /* Animate nav bar micro-interactions */
        if (navChevron) navChevron.classList.add('ios-nav-chevron-exit');
        if (navTitle) navTitle.classList.add('ios-nav-title-exit');
        if (navLabel) {
            const rect = navLabel.getBoundingClientRect();
            const currentCenterX = rect.left + rect.width / 2;
            const screenCenterX = window.innerWidth / 2;
            const offset = screenCenterX - currentCenterX;
            navLabel.style.setProperty('--nav-center-offset', offset + 'px');
            navLabel.classList.add('ios-nav-label-sliding-center');
        }

        /* Animate view sheet and page content sliding out to the right */
        const slideElements = getSlideElements();
        for (let i = 0; i < slideElements.length; i++) {
            slideElements[i].classList.add('ios-content-sliding-out');
        }

        /* Animate underlay sliding into position and fade scrim */
        if (underlayLayer) {
            underlayLayer.classList.add('ios-underlay-sliding-in');
        }
        if (underlayScrim) {
            underlayScrim.style.opacity = '0';
        }

        /* Navigate when exit animation completes */
        setTimeout(function() {
            window.location.href = targetUrl;
        }, 220);

        /* Fallback guarantee */
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
     * Section 6: Interactive Left-Edge Swipe Gesture (iOS Native Pop)
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

        /* Never intercept touches on navigation headers or buttons */
        if (touch.clientY < 60 || (e.target && e.target.closest && e.target.closest('.apple-top-nav, .top-back-btn, .apple-tab-bar'))) {
            return;
        }

        /* Only activate gesture within the left 25px margin */
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
                /* Vertical scroll intent: immediately cancel edge tracking */
                stopTracking();
                return;
            }
            if (deltaX > 8 && Math.abs(deltaX) > Math.abs(deltaY)) {
                /* Horizontal swipe intent confirmed */
                isSwiping = true;
                ensureUnderlay(initialTarget);
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

            /* Underlay parallax sliding from -30% to 0% */
            if (underlayLayer) {
                const underlayPercent = -30 * (1 - progress);
                underlayLayer.style.transform = 'translate3d(' + underlayPercent + '%, 0, 0)';
                underlayLayer.style.transition = 'none';
            }

            /* Underlay scrim fade from 0.3 to 0 */
            if (underlayScrim) {
                underlayScrim.style.opacity = String(0.3 * (1 - progress));
                underlayScrim.style.transition = 'none';
            }

            /* Micro-interactions in the top nav bar */
            if (navChevron) {
                navChevron.style.transform = 'translate3d(' + (-14 * progress) + 'px, 0, 0)';
                navChevron.style.opacity = String(1 - progress);
            }
            if (navLabel) {
                const rect = navLabel.getBoundingClientRect();
                const currentCenterX = rect.left + rect.width / 2;
                const screenCenterX = window.innerWidth / 2;
                const targetOffset = screenCenterX - currentCenterX;
                navLabel.style.transform = 'translate3d(' + (targetOffset * progress) + 'px, 0, 0)';
                if (progress < 0.35) {
                    navLabel.style.opacity = String(1 - (progress / 0.35));
                    navLabel.style.color = '';
                    navLabel.style.fontWeight = '';
                } else if (progress < 0.65) {
                    navLabel.style.opacity = '0';
                } else {
                    navLabel.style.opacity = String((progress - 0.65) / 0.35);
                    const isLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
                    navLabel.style.color = isLight ? '#000000' : '#ffffff';
                    navLabel.style.fontWeight = '600';
                }
            }
            if (navTitle) {
                navTitle.style.transform = 'translate3d(' + (60 * progress) + 'px, 0, 0)';
                navTitle.style.opacity = String(1 - progress);
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
                slideElements[i].style.transition = 'transform 0.22s cubic-bezier(0.32, 0.72, 0, 1)';
                slideElements[i].style.transform = 'translate3d(100%, 0, 0)';
            }

            if (underlayLayer) {
                underlayLayer.style.transition = 'transform 0.22s cubic-bezier(0.32, 0.72, 0, 1)';
                underlayLayer.style.transform = 'translate3d(0, 0, 0)';
            }
            if (underlayScrim) {
                underlayScrim.style.transition = 'opacity 0.22s cubic-bezier(0.32, 0.72, 0, 1)';
                underlayScrim.style.opacity = '0';
            }

            if (navChevron) {
                navChevron.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
                navChevron.style.transform = 'translate3d(-14px, 0, 0)';
                navChevron.style.opacity = '0';
            }
            if (navLabel) {
                const rect = navLabel.getBoundingClientRect();
                const currentCenterX = rect.left + rect.width / 2;
                const screenCenterX = window.innerWidth / 2;
                const targetOffset = screenCenterX - currentCenterX;
                navLabel.style.transition = 'transform 0.2s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.2s ease, color 0.15s ease';
                navLabel.style.transform = 'translate3d(' + targetOffset + 'px, 0, 0)';
                const isLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
                navLabel.style.color = isLight ? '#000000' : '#ffffff';
                navLabel.style.fontWeight = '600';
                navLabel.style.opacity = '1';
            }
            if (navTitle) {
                navTitle.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
                navTitle.style.transform = 'translate3d(60px, 0, 0)';
                navTitle.style.opacity = '0';
            }

            setTimeout(function() {
                window.location.href = target;
            }, 210);
        } else {
            /* Cancel pop transition */
            for (let i = 0; i < slideElements.length; i++) {
                slideElements[i].style.transition = 'transform 0.24s cubic-bezier(0.2, 0.9, 0.3, 1)';
                slideElements[i].style.transform = 'translate3d(0, 0, 0)';
            }

            if (underlayLayer) {
                underlayLayer.style.transition = 'transform 0.24s cubic-bezier(0.2, 0.9, 0.3, 1)';
                underlayLayer.style.transform = 'translate3d(-30%, 0, 0)';
            }
            if (underlayScrim) {
                underlayScrim.style.transition = 'opacity 0.24s cubic-bezier(0.2, 0.9, 0.3, 1)';
                underlayScrim.style.opacity = '0.3';
            }

            if (navChevron) {
                navChevron.style.transition = 'transform 0.24s ease, opacity 0.24s ease';
                navChevron.style.transform = 'translate3d(0, 0, 0)';
                navChevron.style.opacity = '1';
            }
            if (navLabel) {
                navLabel.style.transition = 'transform 0.24s ease, opacity 0.24s ease, color 0.2s ease';
                navLabel.style.transform = 'translate3d(0, 0, 0)';
                navLabel.style.opacity = '1';
                navLabel.style.color = '';
                navLabel.style.fontWeight = '';
            }
            if (navTitle) {
                navTitle.style.transition = 'transform 0.24s ease, opacity 0.24s ease';
                navTitle.style.transform = 'translate3d(0, 0, 0)';
                navTitle.style.opacity = '1';
            }

            setTimeout(function() {
                for (let i = 0; i < slideElements.length; i++) {
                    slideElements[i].style.transition = '';
                    slideElements[i].style.transform = '';
                }
                if (underlayLayer) {
                    underlayLayer.style.transition = '';
                }
                if (underlayScrim) {
                    underlayScrim.style.transition = '';
                }
                if (navChevron) {
                    navChevron.style.transition = '';
                    navChevron.style.transform = '';
                    navChevron.style.opacity = '';
                }
                if (navLabel) {
                    navLabel.style.transition = '';
                    navLabel.style.transform = '';
                    navLabel.style.opacity = '';
                    navLabel.style.color = '';
                    navLabel.style.fontWeight = '';
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
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchEnd, { passive: true });

    /* ========================================================================
     * Section 7: BFCache & History Restore Handlers
     * ======================================================================== */
    window.addEventListener('pageshow', function(e) {
        if (e.persisted) {
            if (navBackBtn) navBackBtn.style.opacity = '';
            if (desktopBackBtn) desktopBackBtn.style.opacity = '';
            const slideElements = getSlideElements();
            for (let i = 0; i < slideElements.length; i++) {
                slideElements[i].classList.remove('ios-content-sliding-out', 'ios-content-dragging', 'ios-content-entering', 'ios-content-enter-active', 'ios-parent-pushing-out');
                slideElements[i].style.transform = '';
                slideElements[i].style.transition = '';
            }
            if (underlayLayer) {
                underlayLayer.classList.remove('ios-underlay-sliding-in');
                underlayLayer.style.transform = 'translate3d(-30%, 0, 0)';
                underlayLayer.style.transition = '';
            }
            if (underlayScrim) {
                underlayScrim.style.opacity = '0.3';
                underlayScrim.style.transition = '';
            }
            if (navChevron) {
                navChevron.classList.remove('ios-nav-chevron-exit', 'ios-nav-back-enter', 'ios-nav-back-enter-active');
                navChevron.style.transform = '';
                navChevron.style.opacity = '';
            }
            if (navLabel) {
                navLabel.classList.remove('ios-nav-label-exit', 'ios-nav-back-enter', 'ios-nav-back-enter-active');
                navLabel.style.transform = '';
                navLabel.style.opacity = '';
            }
            if (navTitle) {
                navTitle.classList.remove('ios-nav-title-exit', 'ios-nav-title-enter', 'ios-nav-title-enter-active');
                navTitle.style.transform = '';
                navTitle.style.opacity = '';
            }
            isNavigating = false;
        }
    });
}
