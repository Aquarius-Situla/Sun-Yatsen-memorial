/* ============================================================================
 * Private Sun Yat-sen Memorial Hall — Application Orchestrator (app.js)
 * ============================================================================
 * COMMENTING STANDARDS
 * 1. Block comments only. Inline comments (//) are strictly prohibited.
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
import { syncTabBarLabels } from './modules/i18n.js?v=2023';
import { syncStandaloneTabBar } from './modules/tab-bar.js?v=2023';
import { setupDiagnosticTrigger } from './modules/debug-panel.js?v=2023';

/* Expose fireworks loader globally for legacy triggers */
window.loadAndTriggerFireworks = loadAndTriggerFireworks;

/* ============================================================================
 * Application Initialization Controller
 * ============================================================================ */
function initApp() {
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
        if (testamentBox) {
            testamentBox.style.cursor = 'pointer';

            let longPressTimer = null;
            let touchStartX = 0;
            let touchStartY = 0;
            let isLongPressTriggered = false;
            const testamentContent = document.getElementById('testament-content');

            testamentBox.addEventListener('touchstart', (e) => {
                if (e.touches.length !== 1) return;
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                isLongPressTriggered = false;

                if (testamentContent) {
                    testamentContent.classList.add('testament-pressing');
                }

                if (longPressTimer) clearTimeout(longPressTimer);
                longPressTimer = setTimeout(() => {
                    isLongPressTriggered = true;
                    if (testamentContent) {
                        testamentContent.classList.remove('testament-pressing');
                    }

                    if (navigator.vibrate) {
                        try { navigator.vibrate(25); } catch (err) { /* No-op */ }
                    }

                    if (messageModal) {
                        messageModal.classList.add('active');
                        if (messageInput) {
                            setTimeout(() => messageInput.focus(), 150);
                        }
                    }
                }, 500);
            }, { passive: true });

            testamentBox.addEventListener('touchmove', (e) => {
                if (!longPressTimer) return;
                const deltaX = Math.abs(e.touches[0].clientX - touchStartX);
                const deltaY = Math.abs(e.touches[0].clientY - touchStartY);

                if (deltaX > 10 || deltaY > 10) {
                    clearTimeout(longPressTimer);
                    longPressTimer = null;
                    if (testamentContent) {
                        testamentContent.classList.remove('testament-pressing');
                    }
                }
            }, { passive: true });

            const cancelLongPress = () => {
                if (longPressTimer) {
                    clearTimeout(longPressTimer);
                    longPressTimer = null;
                }
                if (testamentContent) {
                    testamentContent.classList.remove('testament-pressing');
                }
            };

            testamentBox.addEventListener('touchend', cancelLongPress, { passive: true });
            testamentBox.addEventListener('touchcancel', cancelLongPress, { passive: true });

            testamentBox.addEventListener('click', (e) => {
                if (isLongPressTriggered) {
                    isLongPressTriggered = false;
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }

                toggleDanmaku(WORKER_API, danmakuContainer, portraitImg, (isEnabled) => {
                    showToast(isEnabled ? '彈幕已開啟' : '彈幕已關閉', 'system');
                });
            });
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

        const triggerDanmakuModal = (e) => {
            if (e) e.preventDefault();
            if (messageModal) {
                messageModal.classList.add('active');
                if (messageInput) {
                    setTimeout(() => messageInput.focus(), 150);
                }
            }
        };

        window.openDanmakuModal = triggerDanmakuModal;

        const danmakuTabBtn = document.querySelector('[data-tab-id="danmaku"]');
        if (danmakuTabBtn) {
            danmakuTabBtn.addEventListener('click', triggerDanmakuModal);
            danmakuTabBtn.addEventListener('touchend', (e) => {
                triggerDanmakuModal(e);
            }, { passive: false });
        }

        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('open') === 'danmaku' && messageModal) {
            setTimeout(() => {
                triggerDanmakuModal();
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
