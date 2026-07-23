/* ============================================================================
 * Private Sun Yat-sen Memorial Hall — Main Script (script.js)
 * ============================================================================
 * COMMENTING STANDARDS
 * 1. Block comments only. Line comments (//) are prohibited.
 * 2. Section dividers use the === banner format shown above.
 * 3. Inline remarks appear on the same line as the statement they describe.
 * 4. All prose is written in English.
 * 5. No debugging notes, temporary workarounds, or console output in
 *    committed code. Use the browser DevTools for runtime diagnostics.
 * 6. Tailwind migration: utility-mappable rules are annotated with @tw.
 * ============================================================================
 */

/* ============================================================================
 * Music Configuration
 * ============================================================================
 * DEFAULT_MUSIC         — Default track played before any memorial interaction.
 * SPECIAL_MEMORIAL_DAYS — Special tracks for memorial events based on URL
 *                         routing or current date.
 *
 * Festival object fields:
 *   urlKeyword   — URL substring to trigger the festival mode.
 *   dates        — List of matching dates (month / date / type).
 *   config       — Media configuration passed to the MediaSession API.
 *   getBanner    — Function returning the banner text based on the year.
 *   festivalPage — URL path for the festival detail page.
 * ============================================================================ */

const DEFAULT_MUSIC = { src: 'main/anthem/anthem.m4a', title: '三民主義歌', artist: '孫文' };

const SPECIAL_MEMORIAL_DAYS = [
    {
        urlKeyword:  'whampoa',
        dates:       [ { month: 6, date: 16 } ],
        config:      { src: 'events/whampoa/whampoa.mp3', title: '黃埔組曲', artist: '戴季陶' },
        getBanner:   (year) => `黃埔建軍 ${year - 1924} 週年`,
        festivalPage: 'events/whampoa/whampoa.html'
    },
    {
        urlKeyword:  'militaries',
        dates:       [ { month: 9, date: 3 } ],
        config:      { src: 'events/militaries/militaries.mp3', title: '三軍軍歌組曲', artist: '何志浩' },
        getBanner:   (year) => `抗戰勝利 ${year - 1945} 週年`,
        festivalPage: 'events/militaries/militaries.html'
    },
    {
        urlKeyword:  'yatsen-passing',
        dates:       [ { month: 3,  date: 12 } ],
        config:      { src: 'events/yatsen/yatsen.mp3', title: '國父紀念歌', artist: '戴季陶' },
        getBanner:   (year) => `國父逝世 ${year - 1925} 週年`,
        festivalPage: 'events/yatsen/yatsen-passing.html'
    },
    {
        urlKeyword:  'yatsen-birth',
        dates:       [ { month: 11, date: 12 } ],
        config:      { src: 'events/yatsen/yatsen.mp3', title: '國父紀念歌', artist: '戴季陶' },
        getBanner:   (year) => `國父誕辰 ${year - 1866} 週年`,
        festivalPage: 'events/yatsen/yatsen-birth.html'
    }
];

/* ============================================================================
 * DOM Element References
 * ============================================================================ */

const audio             = document.getElementById('bg-music');
const portraitBtn       = document.getElementById('portrait-btn');
const memorialBanner    = document.getElementById('memorial-banner');
const sitDownBanner     = document.getElementById('sit-down-banner');
const attendanceCountEl = document.getElementById('attendanceCount');
const mobileArrowBtn    = document.getElementById('mobile-arrow-btn');
const dropdownNavBar    = document.querySelector('.dropdown-nav-bar');
const navFestivalBanner = document.getElementById('nav-festival-banner');

const WORKER_API = window.ENV.WORKER_API;

/* ============================================================================
 * Playback State
 * ============================================================================
 * hasDefaultMusicEnded — Unlocks festival tracks after the default music
 *                        has finished playing completely.
 * ============================================================================ */

let isPlaying            = false;
let bannerTimeout        = null;
let navHideTimeout       = null;
let currentMusicSrc      = '';
let hasDefaultMusicEnded = false;

/* Reset playback state when returning via BFCache or reloading */
window.addEventListener('pageshow', function (event) {
    const navEntries = performance.getEntriesByType('navigation');
    if (event.persisted || (navEntries.length > 0 && navEntries[0].type === 'reload')) {
        hasDefaultMusicEnded = false;
        currentMusicSrc      = '';
        isPlaying            = false;
    }
});

/* ============================================================================
 * Festival Banner Initialization
 * ============================================================================
 * Evaluates the current URL, followed by the date, to display a clickable
 * memorial banner in the navigation bar if it corresponds to a special day.
 * ============================================================================ */

(function initFestivalBanner() {
    if (!navFestivalBanner) return;

    const url          = window.location.href.toLowerCase();
    const now          = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentDate  = now.getDate();
    const currentYear  = now.getFullYear();

    let bannerText   = '';
    let isFestival   = false;
    let festivalPage = '';

    /* Highest Priority: URL Routing */
    for (const item of SPECIAL_MEMORIAL_DAYS) {
        if (url.includes(item.urlKeyword.toLowerCase())) {
            bannerText   = item.getBanner(currentYear, item.dates[0]);
            isFestival   = true;
            festivalPage = item.festivalPage || '';
            break;
        }
    }

    /* Secondary Priority: Current Date Matching */
    if (!isFestival) {
        for (const item of SPECIAL_MEMORIAL_DAYS) {
            for (const d of item.dates) {
                if (d.month === currentMonth && d.date === currentDate) {
                    bannerText   = item.getBanner(currentYear, d);
                    isFestival   = true;
                    festivalPage = item.festivalPage || '';
                    break;
                }
            }
            if (isFestival) break;
        }
    }

    if (isFestival && bannerText) {
        navFestivalBanner.innerText = bannerText;
        document.body.classList.add('has-festival');

        /* Elevate the banner to an accessible link if a festival page exists */
        if (festivalPage) {
            navFestivalBanner.style.cursor = 'pointer';
            navFestivalBanner.setAttribute('role',       'link');
            navFestivalBanner.setAttribute('tabindex',   '0');
            navFestivalBanner.setAttribute('aria-label', `${bannerText}——點擊了解更多`);
            navFestivalBanner.addEventListener('click',   () => { window.location.href = festivalPage; });
            navFestivalBanner.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    window.location.href = festivalPage;
                }
            });
        }
    } else {
        navFestivalBanner.innerText = '';
        document.body.classList.remove('has-festival');
    }
})();

/* ============================================================================
 * Toast Banner System
 * ============================================================================
 * Displays brief ceremonial notifications anchored to the top of the screen.
 * Will not override the "Sit Down" status banner.
 * ============================================================================ */

function triggerToastBanner(text, duration = 0) {
    if (bannerTimeout) clearTimeout(bannerTimeout);

    if (!sitDownBanner.classList.contains('show')) {
        memorialBanner.innerText = text;
        memorialBanner.classList.remove('hidden');
        document.body.classList.add('banner-active');
    }

    if (duration > 0) {
        bannerTimeout = setTimeout(() => {
            memorialBanner.classList.add('hidden');
            document.body.classList.remove('banner-active');
        }, duration);
    }
}

/* ============================================================================
 * Music Configuration Resolution
 * ============================================================================
 * Prioritizes route-based music configuration, then date-based, then default.
 * ============================================================================ */

function getTodayMusicConfig() {
    const url          = window.location.href.toLowerCase();
    const now          = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentDate  = now.getDate();

    for (const item of SPECIAL_MEMORIAL_DAYS) {
        if (url.includes(item.urlKeyword.toLowerCase())) return item.config;
    }

    for (const item of SPECIAL_MEMORIAL_DAYS) {
        for (const d of item.dates) {
            if (d.month === currentMonth && d.date === currentDate) return item.config;
        }
    }

    return DEFAULT_MUSIC;
}

/* ============================================================================
 * Media Session API Integration
 * ============================================================================
 * Synchronizes the OS media lock screen with the memorial's track metadata.
 * ============================================================================ */

function setupMediaSession(config) {
    if (!('mediaSession' in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
        title:   config.title,
        artist:  config.artist,
        album:   '私立中山紀念堂',
        artwork: [ { src: 'main/anthem/album-cover.png', sizes: '1254x1254', type: 'image/png' } ]
    });

    navigator.mediaSession.setActionHandler('play',  () => { audio.play(); isPlaying = true; });
    navigator.mediaSession.setActionHandler('pause', () => { audio.pause(); });
}

/* ============================================================================
 * Playback Control
 * ============================================================================
 * Forces the default track to complete entirely before allowing any festival
 * music to be loaded on subsequent interactions.
 * ============================================================================ */

function playMemorialMusic() {
    const config = hasDefaultMusicEnded ? getTodayMusicConfig() : DEFAULT_MUSIC;

    if (currentMusicSrc !== config.src) {
        audio.src       = config.src;
        currentMusicSrc = config.src;
        audio.load();
    }

    audio.play()
        .then(() => {
            isPlaying = true;
            setupMediaSession(config);
        })
        .catch(() => {
            /* Handled by browser auto-play policies; retry on next interaction */
        });
}

/* ============================================================================
 * Republic of China Calendar Formatting
 * ============================================================================
 * Displays the current date in Minguo (ROC) format.
 * ============================================================================ */

(function displayMinguoDate() {
    const now        = new Date();
    const minguoYear = now.getFullYear() - 1911;
    const month      = now.getMonth() + 1;
    const date       = now.getDate();
    const days       = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const dayOfWeek  = days[now.getDay()];

    document.getElementById('minguo-date-display').innerText =
        `中華民國 ${minguoYear} 年 ${month} 月 ${date} 日 (${dayOfWeek})`;
})();

/* ============================================================================
 * Attendance Registration
 * ============================================================================
 * Uses an anonymous browser fingerprint to increment and display the visitor
 * count securely via Cloudflare Workers.
 * ============================================================================ */

async function autoRegisterAttendance() {
    try {
        const fingerprint = await generateBrowserFingerprint();
        const response    = await fetch(WORKER_API, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ fp: fingerprint })
        });

        attendanceCountEl.innerText = response.ok
            ? ((await response.json()).count || 0)
            : '0';
    } catch (e) {
        attendanceCountEl.innerText = '0';
    }
}
autoRegisterAttendance();

/* ============================================================================
 * Return Navigation Banner Suppression
 * ============================================================================
 * Prevents ceremonial notifications from re-triggering when users navigate
 * backwards to the index page.
 * ============================================================================ */

const urlParams    = new URLSearchParams(window.location.search);
const isFromReturn = urlParams.get('from') === 'return';

if (isFromReturn) {
    window.history.replaceState({}, document.title, window.location.pathname);
} else {
    setTimeout(() => { triggerToastBanner('請向國父遺像行三鞠躬禮', 5000); }, 1000);
}

/* ============================================================================
 * Core Interaction Listeners
 * ============================================================================ */

/* Portrait click starts music; subsequent clicks show a standing reminder. */
portraitBtn.addEventListener('click', () => {
    if (audio.paused) {
        triggerToastBanner('請起立', 2000);
        playMemorialMusic();
    } else {
        triggerToastBanner('請肅立！', 2000);
    }
});

/* Automatically shows the sit-down banner and unlocks festival tracks. */
audio.addEventListener('ended', () => {
    isPlaying = false;

    if (!hasDefaultMusicEnded) {
        hasDefaultMusicEnded = true; /* Festival override unlocked */
    }

    memorialBanner.classList.add('hidden');
    sitDownBanner.classList.add('show');
    document.body.classList.add('banner-active');

    setTimeout(() => {
        sitDownBanner.classList.remove('show');
        document.body.classList.remove('banner-active');
    }, 6000);
});

/* ============================================================================
 * Mobile Navigation Dropdown
 * ============================================================================
 * Handles the display logic of the mobile menu, ensuring it auto-hides after
 * 4 seconds and respects click-away interactions.
 * ============================================================================ */

if (mobileArrowBtn && dropdownNavBar) {
    mobileArrowBtn.addEventListener('click', (e) => {
        if (document.body.classList.contains('banner-active')) return;
        e.stopPropagation();
        if (navHideTimeout) clearTimeout(navHideTimeout);
        dropdownNavBar.classList.add('force-show');
        navHideTimeout = setTimeout(() => { dropdownNavBar.classList.remove('force-show'); }, 4000);
    });

    dropdownNavBar.addEventListener('click', (e) => {
        e.stopPropagation();
        if (navHideTimeout) {
            clearTimeout(navHideTimeout);
            navHideTimeout = setTimeout(() => { dropdownNavBar.classList.remove('force-show'); }, 4000);
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

/* ============================================================================
 * Browser Fingerprinting
 * ============================================================================
 * Generates an anonymous hash based on Canvas rendering quirks and basic
 * screen metrics to mitigate spam while protecting visitor privacy.
 * ============================================================================ */

function generateBrowserFingerprint() {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx    = canvas.getContext('2d');
        canvas.width  = 200;
        canvas.height = 40;

        ctx.textBaseline = 'top';
        ctx.font         = "14px 'Arial'";
        ctx.fillStyle    = '#f60';
        ctx.fillRect(10, 10, 50, 20);
        ctx.fillStyle = '#069';
        ctx.fillText('SysMemorial, minguo', 2, 2);

        const raw = canvas.toDataURL() + navigator.userAgent + screen.width + navigator.language;
        let hash  = 0;
        for (let i = 0; i < raw.length; i++) {
            hash = (hash << 5) - hash + raw.charCodeAt(i);
            hash |= 0;
        }
        resolve(Math.abs(hash).toString(16));
    });
}

/* ============================================================================
 * Frame Lighting Calculations
 * ============================================================================
 * Dynamically updates CSS custom properties to simulate directional shadows
 * and highlights based on a simulated 3D space.
 *
 * Coordinates:
 *   rotX > 0 — Top tilts backwards (highlights move up, shadows move down)
 *   rotY > 0 — Right tilts backwards (highlights right, shadows left)
 * ============================================================================ */

const _woodFrame = document.querySelector('.wood-frame');

function applyFrameLighting(rotX, rotY) {
    if (!_woodFrame) return;

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

    _woodFrame.style.setProperty('--hl-x',     `${hlX}px`);
    _woodFrame.style.setProperty('--hl-y',     `${hlY}px`);
    _woodFrame.style.setProperty('--hl-alpha',  hlAlpha);
    _woodFrame.style.setProperty('--sh-x',     `${shX}px`);
    _woodFrame.style.setProperty('--sh-y',     `${shY}px`);
    _woodFrame.style.setProperty('--sh-alpha',  shAlpha);
}

/* ============================================================================
 * Desktop Parallax Handling
 * ============================================================================
 * Binds mouse position on precision pointers to 3D CSS transforms.
 * Resets safely on mouse-leave to a resting orientation.
 * ============================================================================ */

if (_woodFrame && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.addEventListener('mousemove', (e) => {
        const xAxis    = (window.innerWidth  / 2 - e.pageX) / (window.innerWidth  / 2);
        const yAxis    = (window.innerHeight / 2 - e.pageY) / (window.innerHeight / 2);
        const maxAngle = 3;
        const rotateX  =  yAxis * maxAngle;
        const rotateY  = -xAxis * maxAngle;

        _woodFrame.style.transform = `translateZ(0) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        applyFrameLighting(rotateX, rotateY);
    });

    document.addEventListener('mouseleave', () => {
        _woodFrame.style.transform = 'translateZ(0) rotateX(0deg) rotateY(0deg)';
        applyFrameLighting(0, 0);
    });
}

/* ============================================================================
 * Gyroscope Integration (Mobile Only)
 * ============================================================================
 * Implements a linear interpolation loop using requestAnimationFrame to apply
 * smooth gyroscope tracking on Android devices without explicit permissions.
 * Bypasses explicit permission requests natively to avoid intrusive popups.
 * ============================================================================ */

(function initGyroscopeLighting() {
    /* Exclude precision-pointer devices (Desktops) and strict-permission environments (iOS 13+) */
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') return;
    if (!('DeviceOrientationEvent' in window)) return;

    const woodFrame = _woodFrame;
    if (!woodFrame) return;

    let targetRotX  = 0, targetRotY  = 0;
    let currentRotX = 0, currentRotY = 0;
    let rafId       = null;
    let isActive    = false;
    let baseBeta    = null, baseGamma = null;

    /* Linear interpolation smoothing to eliminate device jitter */
    function smoothLoop() {
        currentRotX += (targetRotX - currentRotX) * 0.10;
        currentRotY += (targetRotY - currentRotY) * 0.10;
        woodFrame.style.transform = `translateZ(0) rotateX(${currentRotX}deg) rotateY(${currentRotY}deg)`;
        applyFrameLighting(currentRotX, currentRotY);
        rafId = requestAnimationFrame(smoothLoop);
    }

    /* Sets the first reading as baseline 0 to prevent harsh visual jumps */
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

    /* Optimize battery by disconnecting sensors on background tab */
    document.addEventListener('visibilitychange', () => {
        document.hidden ? stopGyroscope() : startGyroscope();
    });

    /* Delayed startup to avoid blocking initial DOM painting */
    setTimeout(startGyroscope, 600);
})();

/* ============================================================================
 * Message Board & Danmaku Initialization
 * ============================================================================
 * Manages UI interactions for the comment modal across mobile and desktop.
 * The word filter acts as a soft-client barrier, while server-side handles
 * true validation in Cloudflare Workers.
 * ============================================================================ */

const openMessageBtn    = document.getElementById('open-message-btn');
const messageModal      = document.getElementById('message-modal');
const historyMessageBtn = document.getElementById('history-message-btn');
const historyPopover    = document.getElementById('history-popover');
const historyList       = document.getElementById('history-list');
const testamentBox      = document.querySelector('.testament-box');
const danmakuContainer  = document.getElementById('danmaku-container');
const messageInput      = document.getElementById('message-input');
const charCount         = document.getElementById('char-count');
const submitMessageBtn  = document.getElementById('submit-message-btn');
const portraitImg       = document.querySelector('.portrait-img');

/* Banned words are dynamically loaded from the server */
let bannedWordsList = [];

/* Fetch banned words from static JSON on load */
fetch('api/banned_words.json')
    .then(res => res.json())
    .then(data => {
        if (Array.isArray(data)) {
            bannedWordsList = data;
        }
    })
    .catch(err => console.error("Failed to load banned words library:", err));

let isDanmakuEnabled = false;
let messageCooldown  = false;
let knownDanmaku     = new Set(); /* Deduplication set to avoid replaying seen messages */

/* Character Counter Listener */
if (messageInput && charCount) {
    messageInput.addEventListener('input', () => {
        charCount.textContent = messageInput.value.length;
    });
}

/* Open modal */
if (openMessageBtn) {
    openMessageBtn.addEventListener('click', (e) => {
        e.preventDefault();
        messageModal.classList.add('active');
    });
}

/* Track Sent Messages locally */
let mySentMessages = JSON.parse(localStorage.getItem('mySentMessages')) || [];

function renderHistoryPopover() {
    if (!historyList) return;
    historyList.innerHTML = '';
    
    if (mySentMessages.length === 0) {
        historyList.innerHTML = '<div class="empty-history">暫無留言紀錄</div>';
        return;
    }
    
    mySentMessages.slice().reverse().forEach(msg => {
        const item = document.createElement('div');
        item.className = 'history-item';
        
        const textSpan = document.createElement('div');
        textSpan.className = 'history-text';
        textSpan.textContent = msg.text;
        
        const retractBtn = document.createElement('button');
        retractBtn.className = 'retract-btn';
        retractBtn.innerHTML = '×';
        retractBtn.title = '撤回留言';
        retractBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('確定要撤回這則留言嗎？')) {
                retractMessage(msg.id);
            }
        });
        
        item.appendChild(textSpan);
        item.appendChild(retractBtn);
        historyList.appendChild(item);
    });
}

async function retractMessage(id) {
    try {
        const fp = await generateBrowserFingerprint();
        const response = await fetch(WORKER_API + '/danmaku', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, fp })
        });
        
        if (response.ok) {
            mySentMessages = mySentMessages.filter(m => m.id !== id);
            localStorage.setItem('mySentMessages', JSON.stringify(mySentMessages));
            renderHistoryPopover();
            showCloudflareToast('留言已撤回', 'success');
        } else {
            const err = await response.json();
            showCloudflareToast(err.error || '撤回失敗', 'error');
        }
    } catch (e) {
        showCloudflareToast('網路連線異常，請檢查網路。', 'error');
    }
}

/* History popover toggle (replaces mobile close btn logic) */
if (historyMessageBtn) {
    historyMessageBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        historyPopover.classList.toggle('show');
        if (historyPopover.classList.contains('show')) {
            renderHistoryPopover();
        }
    });
}

/* Close modal (Desktop) */
const desktopCancelBtn = document.getElementById('desktop-cancel-btn');
if (desktopCancelBtn) {
    desktopCancelBtn.addEventListener('click', () => {
        messageModal.classList.remove('active');
    });
}

/* Backdrop dismiss handlers */
messageModal.addEventListener('click', (e) => {
    if (historyPopover &&
        historyPopover.classList.contains('show') &&
        !historyPopover.contains(e.target) &&
        e.target !== historyMessageBtn &&
        !e.target.closest('#history-message-btn')) {
        historyPopover.classList.remove('show');
    }
    if (e.target === messageModal) {
        messageInput.value = '';
        if (charCount) charCount.textContent = '0';
        if (historyPopover) historyPopover.classList.remove('show');
        messageModal.classList.remove('active');
    }
});

/* Toggle Danmaku on Testament Box Click */
if (testamentBox) {
    testamentBox.style.cursor = 'pointer';
    testamentBox.addEventListener('click', () => {
        isDanmakuEnabled = !isDanmakuEnabled;

        if (isDanmakuEnabled) {
            danmakuContainer.classList.remove('hidden');
            fetchAndPlayDanmaku();
            if (!window.danmakuInterval) {
                window.danmakuInterval = setInterval(fetchAndPlayDanmaku, 15000);
            }
            showCloudflareToast('彈幕已開啟', 'system');
        } else {
            danmakuContainer.classList.add('hidden');
            danmakuContainer.innerHTML = '';
            if (window.danmakuInterval) {
                clearInterval(window.danmakuInterval);
                window.danmakuInterval = null;
            }
            showCloudflareToast('彈幕已關閉', 'system');
        }
    });
}

/* Soft ban check */
function containsBannedWords(text) {
    return bannedWordsList.some(word => text.includes(word));
}

/* Meaningless spam check */
function isSpam(text) {
    // 1. Check for 5 or more consecutive identical characters (e.g. aaaaa, 11111)
    if (/(.)\1{4,}/.test(text)) return true;
    
    // 2. Check for extreme lack of unique characters in long strings
    if (text.length >= 10 && new Set(text).size <= 2) return true;
    
    // 3. Check for keyboard smashes: 7 or more consecutive consonants
    if (/[bcdfghjklmnpqrstvwxz]{7,}/i.test(text)) return true;
    
    // 4. Check for pure long number sequences (likely spam or phone numbers, allows 8-digit dates)
    if (/\d{12,}/.test(text)) return true;
    
    // 5. Entire string is long random letters without spaces (e.g. asdfghjklqwe)
    if (/^[a-zA-Z]{12,}$/.test(text) && !/[aeiouy]{2,}/i.test(text)) return true;
    
    return false;
}

/* ============================================================================
 * Unified Notification System (Toast)
 * ============================================================================
 * Ensures singleton rendering; updates existing toasts instantly instead of
 * stacking them unnecessarily.
 * ============================================================================ */

let currentToast = null;
let toastTimeout = null;

function showCloudflareToast(msg, type = 'info') {
    const DISPLAY_MS = 3000;
    const FADE_MS    = 400;

    /* Override singleton if one is active */
    if (currentToast) {
        currentToast.className = `cloudflare-toast ${type} show`;
        currentToast.innerText = msg;
        if (toastTimeout) clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => { dismissToast(currentToast); }, DISPLAY_MS);
        return;
    }

    const toast = document.createElement('div');
    toast.className = `cloudflare-toast ${type}`;
    toast.innerText = msg;
    document.body.appendChild(toast);
    currentToast = toast;

    void toast.offsetWidth; /* Force reflow for animation */
    toast.classList.add('show');
    toastTimeout = setTimeout(() => { dismissToast(toast); }, DISPLAY_MS);

    function dismissToast(target) {
        if (currentToast !== target) return;
        target.classList.remove('show');
        setTimeout(() => {
            if (currentToast === target) { target.remove(); currentToast = null; }
        }, FADE_MS);
    }
}

/* ============================================================================
 * Message Submission Handling
 * ============================================================================
 * Validates inputs, locks interactions during HTTP transport, and initiates
 * a local cooldown against spam. If rejected by the server for reasons other
 * than active ratelimiting, the lock is lifted early.
 * ============================================================================ */

submitMessageBtn.addEventListener('click', async () => {
    if (messageCooldown) return;

    const text = messageInput.value.trim();

    if (!text) {
        showCloudflareToast('留言不能為空', 'error');
        return;
    }
    if (text.length > 50) {
        showCloudflareToast('留言限 50 字內', 'error');
        return;
    }
    if (containsBannedWords(text)) {
        showCloudflareToast('請勿包含敏感詞彙', 'error');
        return;
    }
    if (isSpam(text)) {
        showCloudflareToast('請勿發送無意義的重複內容', 'error');
        return;
    }

    messageModal.classList.remove('active');
    messageCooldown = true;
    submitMessageBtn.disabled = true;

    /* 10-second anti-spam lock */
    let countdown = 10;
    const timer = setInterval(() => {
        if (--countdown <= 0) {
            clearInterval(timer);
            messageCooldown = false;
            submitMessageBtn.disabled = false;
        }
    }, 1000);

    showCloudflareToast('傳送中...', 'info');

    try {
        const fingerprint = await generateBrowserFingerprint();
        const response    = await fetch(WORKER_API + '/danmaku', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ fp: fingerprint, text })
        });

        if (response.ok) {
            const data = await response.json();
            showCloudflareToast('發送成功！', 'success');
            messageInput.value = '';
            if (charCount) charCount.textContent = '0';
            
            mySentMessages.push({ id: data.id, text: text, time: data.time || Date.now() });
            localStorage.setItem('mySentMessages', JSON.stringify(mySentMessages));
            if (historyPopover && historyPopover.classList.contains('show')) {
                renderHistoryPopover();
            }

            if (isDanmakuEnabled) createDanmaku(text); /* Local immediate preview */
        } else {
            const err = await response.json();
            showCloudflareToast(err.error || '發送失敗，請稍後再試。', 'error');

            /* Lift cooldown early if the server rejected for reasons other than spam */
            if (!err.error || !err.error.includes('ratelimit')) {
                clearInterval(timer);
                messageCooldown = false;
                submitMessageBtn.disabled = false;
            }
        }
    } catch (e) {
        showCloudflareToast('網路連線異常，請檢查網路。', 'error');
        clearInterval(timer);
        messageCooldown = false;
        submitMessageBtn.disabled = false;
    }
});

/* ============================================================================
 * Danmaku Rendering Logic
 * ============================================================================
 * Randomly projects text horizontally across safe rendering bands, explicitly
 * avoiding collision with the main portrait image.
 * ============================================================================ */

function createDanmaku(text) {
    if (!isDanmakuEnabled) return;

    const span = document.createElement('span');
    span.className = 'danmaku-item';
    span.innerText = text;

    const screenHeight    = window.innerHeight;
    const safePadding     = 30;
    const availableRanges = [];

    /* Mask the portrait coordinates to prevent overdraw */
    if (portraitImg) {
        const rect = portraitImg.getBoundingClientRect();
        if (rect.top > 60)                    availableRanges.push({ min: safePadding,     max: rect.top    - 20 });
        if (screenHeight - rect.bottom > 100) availableRanges.push({ min: rect.bottom + 20, max: screenHeight - 100 });
    }

    if (availableRanges.length === 0) {
        availableRanges.push({ min: safePadding, max: screenHeight - 100 });
    }

    const range = availableRanges[Math.floor(Math.random() * availableRanges.length)];
    span.style.top             = `${Math.random() * (range.max - range.min) + range.min}px`;
    span.style.animationDuration = `${Math.max(8, 15 - Math.random() * 5 + text.length * 0.1)}s`;

    danmakuContainer.appendChild(span);
    span.addEventListener('animationend', () => { span.remove(); });
}

/* ============================================================================
 * Danmaku Data Fetching
 * ============================================================================
 * Fetches recent posts and queues them with organic timing jitters (0.5s~2.5s)
 * to create a naturally staggered visual stream.
 * Truncates cache to the latest 100 elements to preserve memory footprint.
 * ============================================================================ */

async function fetchAndPlayDanmaku() {
    if (!isDanmakuEnabled) return;

    try {
        const response = await fetch(WORKER_API + '/danmaku');
        if (!response.ok) return;

        const list  = (await response.json()).list || [];
        let   delay = 0;

        list.forEach(item => {
            const idToTrack = item.id || item; /* fallback for legacy strings */
            const textToPlay = item.text || item;
            
            if (knownDanmaku.has(idToTrack)) return;
            knownDanmaku.add(idToTrack);
            setTimeout(() => { createDanmaku(textToPlay); }, delay);
            delay += Math.random() * 2000 + 500;
        });

        if (knownDanmaku.size > 200) {
            knownDanmaku = new Set(Array.from(knownDanmaku).slice(-100));
        }
    } catch (e) {
        /* Fails silently on network errors, relying on the next polling interval */
    }
}

/* ============================================================================
 * Celebration Fireworks Easter Egg Initialization
 * ============================================================================
 * Conditionally loads the fireworks module based on date or testing hash.
 * ============================================================================ */
(function initFireworksEasterEgg() {
    const cb = Date.now(); // Cache-buster
    const script = document.createElement('script');
    script.src = `events/celebration/lunar-check.js?v=${cb}`;
    script.onload = () => {
        if (window.isFireworksFestival && window.isFireworksFestival()) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = `events/celebration/fireworks.css?v=${cb}`;
            document.head.appendChild(link);

            const fwScript = document.createElement('script');
            fwScript.src = `events/celebration/fireworks.js?v=${cb}`;
            document.body.appendChild(fwScript);
        }
    };
    document.body.appendChild(script);
})();
