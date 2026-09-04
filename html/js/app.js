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

/* Expose fireworks loader globally for legacy triggers */
window.loadAndTriggerFireworks = loadAndTriggerFireworks;

document.addEventListener('DOMContentLoaded', () => {
    const WORKER_API = window.ENV ? window.ENV.WORKER_API : '';

    /* ========================================================================
     * DOM References
     * ======================================================================== */
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
    displayMinguoDate();
    initFestivalBanner(navFestivalBanner, () => {
        loadAndTriggerFireworks();
    });

    /* ========================================================================
     * 2. Attendance Counter Registration
     * ======================================================================== */
    registerAttendance(WORKER_API, attendanceCountEl, () => {
        loadAndTriggerFireworks();
    });

    /* ========================================================================
     * 3. 3D Frame Tilt & Lighting
     * ======================================================================== */
    initDesktopParallax(woodFrame);
    initGyroscopeLighting(woodFrame);

    /* ========================================================================
     * 4. Ceremonial Ritual & Music Sequence
     * ======================================================================== */
    const urlParams = new URLSearchParams(window.location.search);
    const isFromReturn = urlParams.get('from') === 'return';

    if (isFromReturn) {
        window.history.replaceState({}, document.title, window.location.pathname);
    } else {
        setTimeout(() => {
            triggerToastBanner('請向國父遺像行三鞠躬禮', 5000);
        }, 1000);
    }

    if (portraitBtn && audio) {
        portraitBtn.addEventListener('click', () => {
            if (audio.paused) {
                triggerToastBanner('請起立', 2000);
                playMemorialMusic(audio, () => {
                    memorialBanner.classList.add('hidden');
                    sitDownBanner.classList.add('show');
                    document.body.classList.add('banner-active');

                    setTimeout(() => {
                        sitDownBanner.classList.remove('show');
                        document.body.classList.remove('banner-active');
                    }, 6000);
                });
            } else {
                triggerToastBanner('請肅立！', 2000);
            }
        });
    }

    /* ========================================================================
     * 5. Danmaku Comment Layer
     * ======================================================================== */
    if (testamentBox) {
        testamentBox.style.cursor = 'pointer';
        testamentBox.addEventListener('click', () => {
            toggleDanmaku(WORKER_API, danmakuContainer, portraitImg, (isEnabled) => {
                showToast(isEnabled ? '彈幕已開啟' : '彈幕已關閉', 'system');
            });
        });
    }

    /* ========================================================================
     * 6. Message Sheet & Captcha Integration
     * ======================================================================== */
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

    /* ========================================================================
     * 7. Mobile Navigation Dropdown Controls
     * ======================================================================== */
    let navHideTimeout = null;

    if (mobileArrowBtn && dropdownNavBar) {
        mobileArrowBtn.addEventListener('click', (e) => {
            if (document.body.classList.contains('banner-active')) return;
            e.stopPropagation();
            if (navHideTimeout) clearTimeout(navHideTimeout);
            dropdownNavBar.classList.add('force-show');
            navHideTimeout = setTimeout(() => {
                dropdownNavBar.classList.remove('force-show');
            }, 4000);
        });

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
});
