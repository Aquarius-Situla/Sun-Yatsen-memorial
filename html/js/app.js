/* ============================================================================
 * Private Sun Yat-sen Memorial Hall — Application Orchestrator (app.js)
 * ============================================================================
 * COMMENTING STANDARDS
 * 1. Block comments only. Inline comments are strictly prohibited.
 * 2. Section dividers use the === banner format.
 * 3. All prose is written in English.
 * ============================================================================ */

import { triggerToastBanner, showToast } from './modules/ui.js';
import { playMemorialMusic, isAudioPlaying } from './modules/audio-player.js';
import { displayMinguoDate, initFestivalBanner } from './modules/calendar.js';
import { registerAttendance } from './modules/attendance.js';
import { initDesktopParallax, initGyroscopeLighting } from './modules/motion.js';
import { toggleDanmaku } from './modules/danmaku.js';
import { setupMessageSheet } from './modules/message-sheet.js';
import { loadAndTriggerFireworks } from './modules/fireworks.js';
import { syncTabBarLabels, getCurrentLang } from './modules/i18n.js?v=20260907c';
import { syncStandaloneTabBar } from './modules/tab-bar.js?v=20260907c';
import { setupDiagnosticTrigger } from './modules/debug-panel.js?v=20260907c';
import { initDesktopShell } from './modules/desktop-shell.js?v=20260907c';
import { hideActivityIndicator } from './modules/activity-indicator.js?v=20260907c';
import { initDeviceLayout, initOrientationGuard, isMobileLayout, isDesktopLayout } from './modules/device-detect.js?v=20260907c';

/* Expose fireworks loader globally for legacy triggers */
window.loadAndTriggerFireworks = loadAndTriggerFireworks;

/* ============================================================================
 * Danmaku & Testament Interaction Controllers
 * ============================================================================ */
export function openDanmakuModal(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();
    const messageModal = document.getElementById('message-modal');
    const messageInput = document.getElementById('message-input');
    if (messageModal) {
        messageModal.classList.add('active');
        if (messageInput) {
            setTimeout(() => messageInput.focus(), 150);
        }
    }
}
window.openDanmakuModal = openDanmakuModal;

export function toggleDanmakuLayer() {
    const WORKER_API = window.ENV ? window.ENV.WORKER_API : '';
    const danmakuContainer = document.getElementById('danmaku-container');
    const portraitImg = document.querySelector('.portrait-img');
    toggleDanmaku(WORKER_API, danmakuContainer, portraitImg, (isEnabled) => {
        const isTc = getCurrentLang() === 'tc';
        const msg = isEnabled ? (isTc ? '彈幕已開啟' : '弹幕已开启') : (isTc ? '彈幕已關閉' : '弹幕已关闭');
        showToast(msg, 'system');
    });
}
window.toggleDanmakuLayer = toggleDanmakuLayer;

export function setupTestamentInteractions(testamentBox) {
    if (!testamentBox) return;
    if (testamentBox._interactionsBound) return;
    testamentBox._interactionsBound = true;

    testamentBox.style.cursor = 'pointer';
    testamentBox.setAttribute('role', 'button');
    testamentBox.setAttribute('tabindex', '0');
    testamentBox.setAttribute('aria-label', '總理遺囑');

    const testamentText = testamentBox.querySelector('.testament-text') || testamentBox;

    let longPressTimer = null;
    let isLongPress = false;
    let startX = 0;
    let startY = 0;
    let suppressClickUntil = 0;

    const cancelPress = () => {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
        testamentText.classList.remove('testament-pressing');
    };

    testamentBox.addEventListener('touchstart', (e) => {
        if (e.touches.length > 1) return;
        isLongPress = false;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        testamentText.classList.add('testament-pressing');

        if (longPressTimer) clearTimeout(longPressTimer);
        longPressTimer = setTimeout(() => {
            isLongPress = true;
            testamentText.classList.remove('testament-pressing');
            if (navigator.vibrate) {
                try {
                    navigator.vibrate(40);
                } catch (_) {
                    /* Ignore vibration errors */
                }
            }
            openDanmakuModal();
        }, 500);
    }, { passive: true });

    testamentBox.addEventListener('touchmove', (e) => {
        if (!longPressTimer) return;
        const moveX = e.touches[0].clientX;
        const moveY = e.touches[0].clientY;
        if (Math.hypot(moveX - startX, moveY - startY) > 10) {
            cancelPress();
        }
    }, { passive: true });

    testamentBox.addEventListener('touchend', (e) => {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
        testamentText.classList.remove('testament-pressing');

        /* Suppress synthetic click after touch */
        suppressClickUntil = Date.now() + 450;

        if (isLongPress) {
            /* Modal was already opened by long-press timer */
            isLongPress = false;
            return;
        }

        /* Mobile single tap: toggle danmaku layer */
        if (isMobileLayout()) {
            toggleDanmakuLayer();
        } else {
            openDanmakuModal(e);
        }
    });

    testamentBox.addEventListener('touchcancel', () => {
        cancelPress();
        isLongPress = false;
    });

    testamentBox.addEventListener('click', (e) => {
        if (Date.now() < suppressClickUntil) {
            return;
        }
        /* Desktop single click: open send danmaku modal */
        if (isDesktopLayout()) {
            openDanmakuModal(e);
        } else {
            toggleDanmakuLayer();
        }
    });

    testamentBox.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (isDesktopLayout()) {
                openDanmakuModal(e);
            } else {
                toggleDanmakuLayer();
            }
        }
    });
}

/* ============================================================================
 * Application Initialization Controller
 * ============================================================================ */
export function initApp() {
    window.initApp = initApp;

    /* Dismiss any lingering full-page activity indicator from mobile tab transition */
    hideActivityIndicator(document.body);

    if (window.__appInitialized) {
        /* Re-bind stage elements on split-view return without re-fetching */
        const portraitBtn       = document.getElementById('portrait-btn');
        const testamentBox      = document.querySelector('.testament-box');
        const attendanceCountEl = document.getElementById('attendanceCount');
        const woodFrame         = document.querySelector('.wood-frame');
        const desktopMsgCard    = document.getElementById('desktop-open-msg-card');
        const openMessageBtn    = document.getElementById('open-message-btn');
        const messageModal      = document.getElementById('message-modal');
        const messageInput      = document.getElementById('message-input');

        if (attendanceCountEl) {
            const cached = sessionStorage.getItem('sys_attendance_count');
            if (cached) attendanceCountEl.innerText = cached;
        }
        if (portraitBtn && window.handlePortraitClick) {
            portraitBtn.setAttribute('role', 'button');
            portraitBtn.setAttribute('tabindex', '0');
            portraitBtn.style.cursor = 'pointer';
            portraitBtn.addEventListener('click', window.handlePortraitClick);
        }
        if (testamentBox) {
            setupTestamentInteractions(testamentBox);
        }
        if (woodFrame) {
            try {
                initDesktopParallax(woodFrame);
                initGyroscopeLighting(woodFrame);
            } catch (err) {
                /* Motion re-bind ignore */
            }
        }
        if (desktopMsgCard) {
            desktopMsgCard.addEventListener('click', (e) => {
                e.preventDefault();
                if (openMessageBtn) {
                    openMessageBtn.click();
                } else if (messageModal) {
                    messageModal.classList.add('active');
                    if (messageInput) setTimeout(() => messageInput.focus(), 150);
                }
            });
        }

        /* Re-bind message modal interactive elements on return */
        const historyMessageBtn = document.getElementById('history-message-btn');
        const historyPopover    = document.getElementById('history-popover');
        const historyList       = document.getElementById('history-list');
        const charCount         = document.getElementById('char-count');
        const submitMessageBtn  = document.getElementById('submit-message-btn');
        const desktopCancelBtn  = document.getElementById('desktop-cancel-btn');
        const danmakuContainer  = document.getElementById('danmaku-container');
        const portraitImg       = document.querySelector('.portrait-img');
        const WORKER_API        = window.ENV ? window.ENV.WORKER_API : '';

        try {
            setupMessageSheet({
                openMessageBtn,
                messageModal,
                historyMessageBtn,
                historyPopover,
                historyList,
                messageInput,
                charCount,
                submitMessageBtn,
                desktopCancelBtn,
                danmakuContainer,
                portraitImg
            }, WORKER_API);
        } catch (err) {
            console.error('[Message Sheet Re-bind Error]:', err);
        }

        return;
    }
    /* Initialize device layout classes and smartphone orientation blocker */
    initDeviceLayout();
    initOrientationGuard();

    setupDiagnosticTrigger();
    const WORKER_API = window.ENV ? window.ENV.WORKER_API : '';

    /* DOM References */
    const audio             = document.getElementById('bg-music');
    const portraitBtn       = document.getElementById('portrait-btn');
    const portraitImg       = document.querySelector('.portrait-img');
    const woodFrame         = document.querySelector('.wood-frame');
    const memorialBanner    = document.getElementById('memorial-banner');
    const sitDownBanner     = document.getElementById('sit-down-banner');
    const attendanceCountEl = document.getElementById('attendanceCount');
    const mobileArrowBtn    = document.getElementById('mobile-arrow-btn');
    const dropdownNavBar    = document.querySelector('.dropdown-nav-bar');
    const navFestivalBanner = document.getElementById('nav-festival-banner');
    const testamentBox      = document.querySelector('.testament-box');
    const danmakuContainer  = document.getElementById('danmaku-container');

    /* Message Modal Elements */
    const openMessageBtn    = document.getElementById('open-message-btn');
    const messageModal      = document.getElementById('message-modal');
    const historyMessageBtn = document.getElementById('history-message-btn');
    const historyPopover    = document.getElementById('history-popover');
    const historyList       = document.getElementById('history-list');
    const messageInput      = document.getElementById('message-input');
    const charCount         = document.getElementById('char-count');
    const submitMessageBtn  = document.getElementById('submit-message-btn');
    const desktopCancelBtn  = document.getElementById('desktop-cancel-btn');

    /* ========================================================================
     * 1. Calendar & Festival Banners
     * ======================================================================== */
    try {
        displayMinguoDate();
        initFestivalBanner(navFestivalBanner, () => {
            loadAndTriggerFireworks();
        });
    } catch (err) {
        console.error('[Calendar Init Error]:', err);
    }

    /* ========================================================================
     * 2. Attendance Counter Registration
     * ======================================================================== */
    try {
        registerAttendance(WORKER_API, attendanceCountEl, () => {
            loadAndTriggerFireworks();
        });
    } catch (err) {
        console.error('[Attendance Init Error]:', err);
    }

    /* ========================================================================
     * 3. 3D Frame Tilt & Lighting
     * ======================================================================== */
    try {
        initDesktopParallax(woodFrame);
        initGyroscopeLighting(woodFrame);
    } catch (err) {
        console.error('[Motion Init Error]:', err);
    }

    /* ========================================================================
     * 4. Ceremonial Ritual & Music Sequence
     * ======================================================================== */
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const isFromReturn = urlParams.get('from') === 'return';

        if (isFromReturn) {
            window.history.replaceState({}, document.title, window.location.pathname);
        } else {
            setTimeout(() => {
                triggerToastBanner('請向國父遺像行三鞠躬禮', 5000);
            }, 1000);
        }

        const triggerPortraitMusic = () => {
            if (!audio) return;
            if (audio.paused) {
                triggerToastBanner('請起立', 2000);
                playMemorialMusic(audio, () => {
                    if (memorialBanner) memorialBanner.classList.add('hidden');
                    if (sitDownBanner) sitDownBanner.classList.add('show');
                    document.body.classList.add('banner-active');

                    setTimeout(() => {
                        if (sitDownBanner) sitDownBanner.classList.remove('show');
                        document.body.classList.remove('banner-active');
                    }, 6000);
                });
            } else {
                triggerToastBanner('請肅立！', 2000);
            }
        };

        window.handlePortraitClick = triggerPortraitMusic;

        if (portraitBtn) {
            portraitBtn.setAttribute('role', 'button');
            portraitBtn.setAttribute('tabindex', '0');
            portraitBtn.style.cursor = 'pointer';
            portraitBtn.addEventListener('click', triggerPortraitMusic);
        }
    } catch (err) {
        console.error('[Ritual Init Error]:', err);
    }

    /* ========================================================================
     * 5. Danmaku Comment Layer & Mobile Long-Press Trigger
     * ======================================================================== */
    try {
        /* Keyboard shortcut: Press 'D' to toggle danmaku layer on/off */
        if (!window.__danmakuKeydownBound) {
            window.__danmakuKeydownBound = true;
            window.addEventListener('keydown', (e) => {
                const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
                if (tag === 'input' || tag === 'textarea' || (e.target && e.target.isContentEditable)) {
                    return;
                }
                if ((e.key === 'd' || e.key === 'D') && !e.ctrlKey && !e.altKey && !e.metaKey) {
                    e.preventDefault();
                    toggleDanmakuLayer();
                }
            });
        }

        /* Testament interactions: mobile tap = toggle, mobile long press = send modal, desktop click = send modal */
        if (testamentBox) {
            setupTestamentInteractions(testamentBox);
        }
    } catch (err) {
        console.error('[Testament Init Error]:', err);
    }

    /* ========================================================================
     * 6. Message Sheet & Captcha Integration
     * ======================================================================== */
    try {
        setupMessageSheet({
            openMessageBtn,
            messageModal,
            historyMessageBtn,
            historyPopover,
            historyList,
            messageInput,
            charCount,
            submitMessageBtn,
            desktopCancelBtn,
            danmakuContainer,
            portraitImg
        }, WORKER_API);
    } catch (err) {
        console.error('[Message Sheet Init Error]:', err);
    }

    /* ========================================================================
     * 7. Apple Native Bottom Tab Bar Synchronization & Danmaku Trigger
     * ======================================================================== */
    try {
        syncTabBarLabels();
        syncStandaloneTabBar();
        window.addEventListener('sys-lang-change', () => {
            syncTabBarLabels();
        });

        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('open') === 'danmaku') {
            setTimeout(() => {
                openDanmakuModal();
            }, 300);
        }
    } catch (err) {
        console.error('[TabBar Init Error]:', err);
    }

    /* ========================================================================
     * 8. Mobile Navigation Dropdown Controls
     * ======================================================================== */
    try {
        let navHideTimeout = null;

        const toggleDropdownNav = (e) => {
            if (e) e.stopPropagation();
            if (document.body.classList.contains('banner-active') || !dropdownNavBar) return;
            if (navHideTimeout) clearTimeout(navHideTimeout);
            dropdownNavBar.classList.add('force-show');
            navHideTimeout = setTimeout(() => {
                dropdownNavBar.classList.remove('force-show');
            }, 4000);
        };

        window.handleMobileArrowClick = toggleDropdownNav;

        if (mobileArrowBtn && dropdownNavBar) {
            mobileArrowBtn.addEventListener('click', toggleDropdownNav);

            dropdownNavBar.addEventListener('click', (e) => {
                e.stopPropagation();
                if (navHideTimeout) {
                    clearTimeout(navHideTimeout);
                    navHideTimeout = setTimeout(() => {
                        dropdownNavBar.classList.remove('force-show');
                    }, 4000);
                }
            });

            document.addEventListener('click', (e) => {
                if (!dropdownNavBar.contains(e.target) && !mobileArrowBtn.contains(e.target)) {
                    if (dropdownNavBar.classList.contains('force-show')) {
                        dropdownNavBar.classList.remove('force-show');
                        if (navHideTimeout) clearTimeout(navHideTimeout);
                    }
                }
            });
        }
    } catch (err) {
        console.error('[Dropdown Nav Error]:', err);
    }

    /* ========================================================================
     * 9. Apple Desktop Shell Initialization
     * ======================================================================== */
    try {
        initDesktopShell({
            activeTab: 'home',
            basePath: './'
        });

        const desktopMsgCard = document.getElementById('desktop-open-msg-card');
        if (desktopMsgCard) {
            desktopMsgCard.addEventListener('click', (e) => {
                e.preventDefault();
                if (openMessageBtn) {
                    openMessageBtn.click();
                } else if (messageModal) {
                    messageModal.classList.add('active');
                    if (messageInput) setTimeout(() => messageInput.focus(), 150);
                }
            });
        }
    } catch (err) {
        console.error('[Desktop Shell Init Error]:', err);
    }
}

/* ============================================================================
 * Lifecycle Execution: Run Immediately if DOM is Already Interactive/Complete
 * ============================================================================ */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

/* Re-initialize on bfcache restore (iOS back/forward navigation) */
window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
        initApp();
    }
});
