//模块化音乐
const DEFAULT_MUSIC = { src: 'anthem.m4a', title: '三民主義歌', artist: '孫文' };

const SPECIAL_MEMORIAL_DAYS = [
    {
        urlKeyword: 'whampoa',
        dates: [ { month: 6, date: 16 } ],
        config: { src: 'Whampoa.mp3', title: '黃埔組曲', artist: '戴季陶' },
        getBanner: (year) => `陸軍官校建校 ${year - 1924} 週年`,
        festivalPage: 'whampoa.html'
    },
    {
        urlKeyword: 'militaries',
        dates: [ { month: 9, date: 3 } ],
        config: { src: 'Militaries.mp3', title: '三軍軍歌組曲', artist: '何志浩、樊燮華' },
        getBanner: (year) => `抗戰勝利 ${year - 1945} 週年`,
        festivalPage: 'militaries.html'
    },
    {
        urlKeyword: 'yat-sen',
        dates: [ 
            { month: 3, date: 12, type: 'death' }, 
            { month: 11, date: 12, type: 'birth' } 
        ],
        config: { src: 'Yat-sen memorial.mp3', title: '國父紀念歌', artist: '戴傳賢' },
        getBanner: (year, dateObj) => {
            if (!dateObj) dateObj = { type: 'death' }; 
            return dateObj.type === 'death' ? `國父逝世 ${year - 1925} 週年` : `國父誕辰 ${year - 1866} 週年`;
        },
        festivalPage: 'yat-sen.html'
    }
];

//初始化
const audio = document.getElementById('bg-music');
const portraitBtn = document.getElementById('portrait-btn');
const memorialBanner = document.getElementById('memorial-banner');
const sitDownBanner = document.getElementById('sit-down-banner');
const attendanceCountEl = document.getElementById('attendanceCount');
const mobileArrowBtn = document.getElementById('mobile-arrow-btn');
const dropdownNavBar = document.querySelector('.dropdown-nav-bar');
const navFestivalBanner = document.getElementById('nav-festival-banner'); 

const WORKER_API = "https://yatsenmemorial.workers.29510901.xyz";

let isPlaying = false; 
let bannerTimeout = null; 
let navHideTimeout = null; 
let currentMusicSrc = ''; 
let hasDefaultMusicEnded = false;
window.addEventListener('pageshow', function(event) {
    const navEntries = performance.getEntriesByType("navigation");
    if (event.persisted || (navEntries.length > 0 && navEntries[0].type === "reload")) {
        hasDefaultMusicEnded = false;
        currentMusicSrc = '';
        isPlaying = false;
        console.log("頁面重新載入，狀態已強制歸零");
    }
});

(function initFestivalBanner() {
    if (!navFestivalBanner) return;
    const url = window.location.href.toLowerCase();
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentDate = now.getDate();
    const currentYear = now.getFullYear();

    let bannerText = "";
    let isFestival = false;
    let festivalPage = "";

    for (const item of SPECIAL_MEMORIAL_DAYS) {
        if (url.includes(item.urlKeyword.toLowerCase())) {
            if (item.getBanner) {
                bannerText = item.getBanner(currentYear, item.dates[0]);
                isFestival = true;
                festivalPage = item.festivalPage || "";
            }
            break; 
        }
    }

    if (!isFestival) {
        for (const item of SPECIAL_MEMORIAL_DAYS) {
            for (const d of item.dates) {
                if (d.month === currentMonth && d.date === currentDate) {
                    if (item.getBanner) {
                        bannerText = item.getBanner(currentYear, d);
                        isFestival = true;
                        festivalPage = item.festivalPage || "";
                    }
                    break;
                }
            }
            if (isFestival) break;
        }
    }

    if (isFestival && bannerText !== "") {
        navFestivalBanner.innerText = bannerText;
        document.body.classList.add('has-festival');

        // 設定橫幅可點擊，導航至節日介紹頁
        if (festivalPage) {
            navFestivalBanner.style.cursor = 'pointer';
            navFestivalBanner.setAttribute('role', 'link');
            navFestivalBanner.setAttribute('tabindex', '0');
            navFestivalBanner.setAttribute('aria-label', bannerText + '——點此了解節日介紹');
            navFestivalBanner.addEventListener('click', () => {
                window.location.href = festivalPage;
            });
            navFestivalBanner.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    window.location.href = festivalPage;
                }
            });
        }
    } else {
        navFestivalBanner.innerText = "";
        document.body.classList.remove('has-festival');
    }
})();

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

// 自動判換網址路由與當前日期
function getTodayMusicConfig() {
    const url = window.location.href.toLowerCase();
    const now = new Date();
    const currentMonth = now.getMonth() + 1; 
    const currentDate = now.getDate();

    for (const item of SPECIAL_MEMORIAL_DAYS) {
        if (url.includes(item.urlKeyword.toLowerCase())) {
            return item.config;
        }
    }

    for (const item of SPECIAL_MEMORIAL_DAYS) {
        for (const d of item.dates) {
            if (d.month === currentMonth && d.date === currentDate) {
                return item.config;
            }
        }
    }

    return DEFAULT_MUSIC;
}

// 媒體控制中心同步
function setupMediaSession(config) {
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: config.title,        
            artist: config.artist,      
            album: '私立中山紀念堂',    
            artwork: [ { src: 'album-cover.png', sizes: '1254x1254', type: 'image/png' } ]
        });

        navigator.mediaSession.setActionHandler('play', () => { audio.play(); isPlaying = true; });
        navigator.mediaSession.setActionHandler('pause', () => { audio.pause(); });
    }
}

// 優化播放控制邏輯
function playMemorialMusic() {
    let config;
    
    // 鐵律：只有當第一首完整唱完過，才會去抓特殊歌曲。否則一律播預設歌曲
    if (hasDefaultMusicEnded) {
        config = getTodayMusicConfig();
    } else {
        config = DEFAULT_MUSIC;
    }
    
    if (currentMusicSrc !== config.src) {
        audio.src = config.src;
        currentMusicSrc = config.src;
        audio.load();
    }

    audio.play().then(() => {
        isPlaying = true;
        console.log(`${config.title} 開始/繼續播放... (第一首唱完狀態: ${hasDefaultMusicEnded})`);
        setupMediaSession(config); 
    }).catch(error => {
        console.log("瀏覽器攔截了播放。", error);
    });
}

// 系統初始化流程（中華民國紀年）
(function displayMinguoDate() {
    const now = new Date();
    const minguoYear = now.getFullYear() - 1911; 
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const days = ["日", "一", "二", "三", "四", "五", "六"];
    const dayOfWeek = days[now.getDay()];
    
    const displayStr = `中華民國 ${minguoYear} 年 ${month} 月 ${date} 日 (星期${dayOfWeek})`;
    document.getElementById("minguo-date-display").innerText = displayStr;
})();

async function autoRegisterAttendance() {
    try {
        const fingerprint = await generateBrowserFingerprint();
        const response = await fetch(WORKER_API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fp: fingerprint })
        });
        if (response.ok) {
            const data = await response.json();
            attendanceCountEl.innerText = data.count || 0;
        } else {
            attendanceCountEl.innerText = "0";
        }
    } catch(e) { 
        attendanceCountEl.innerText = "0";
    }
}
autoRegisterAttendance();

//返回不显示横幅
const urlParams = new URLSearchParams(window.location.search);
const isFromReturn = urlParams.get('from') === 'return';

if (isFromReturn) {
    window.history.replaceState({}, document.title, window.location.pathname);
} else {
    setTimeout(() => { 
        triggerToastBanner("請向國父遺像行三鞠躬禮", 5000); 
    }, 1000);
}
// ============================================================================

//核心事件监听
portraitBtn.addEventListener('click', () => {
    if (audio.paused) {
        playMemorialMusic();
    } else {
        triggerToastBanner("請肅立！", 2000);
    }
});

audio.addEventListener('ended', () => {
    isPlaying = false;
    if (!hasDefaultMusicEnded) {
        hasDefaultMusicEnded = true; 
        console.log("三民主義歌完整唱完，解鎖特殊節日歌曲！");
    }

    memorialBanner.classList.add('hidden');
    sitDownBanner.classList.add('show');
    document.body.classList.add('banner-active');
    
    setTimeout(() => {
        sitDownBanner.classList.remove('show');
        document.body.classList.remove('banner-active');
    }, 6000);
});

// 移动端导航逻辑
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

function generateBrowserFingerprint() {
    return new Promise((resolve) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = 200; canvas.height = 40;
        ctx.textBaseline = "top";
        ctx.font = "14px 'Arial'";
        ctx.fillStyle = "#f60"; ctx.fillRect(10,10,50,20);
        ctx.fillStyle = "#069"; ctx.fillText("SysMemorial, minguo", 2, 2);
        
        const rawString = canvas.toDataURL() + navigator.userAgent + screen.width + navigator.language;
        let hash = 0;
        for (let i = 0; i < rawString.length; i++) {
            hash = (hash << 5) - hash + rawString.charCodeAt(i);
            hash |= 0;
        }
        resolve(Math.abs(hash).toString(16));
    });
}

// ============================================================================
// 共享光照函數：驅動 .wood-frame 的 box-shadow CSS 變數
// rotX > 0 = 畫框上方遠離 / rotY > 0 = 畫框右側遠離
// ============================================================================
const _woodFrame = document.querySelector('.wood-frame');

function applyFrameLighting(rotX, rotY) {
    if (!_woodFrame) return;
    const scale = 2.8, baseHL = 6, baseSH = 8;
    // 高光跟隨傾斜方向：右傾→右移，後仰→上移
    const hlX = (-baseHL + rotY * scale).toFixed(1);
    const hlY = (-baseHL - rotX * scale).toFixed(1);
    const shX = ( baseSH - rotY * scale).toFixed(1);
    const shY = ( baseSH + rotX * scale).toFixed(1);
    const intensity   = Math.hypot(rotX, rotY) / 5;
    const hlAlpha = (0.04 + intensity * 0.12).toFixed(3);
    const shAlpha = (0.60 + intensity * 0.20).toFixed(3);
    _woodFrame.style.setProperty('--hl-x',    `${hlX}px`);
    _woodFrame.style.setProperty('--hl-y',    `${hlY}px`);
    _woodFrame.style.setProperty('--hl-alpha', hlAlpha);
    _woodFrame.style.setProperty('--sh-x',    `${shX}px`);
    _woodFrame.style.setProperty('--sh-y',    `${shY}px`);
    _woodFrame.style.setProperty('--sh-alpha', shAlpha);
}

// ============================================================================
// 桌面端：滑鼠 3D 視差 + 光照 (Mouse Parallax + Lighting)
// 適用於 Windows / macOS（有精準指標設備）
// ============================================================================
if (_woodFrame && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.addEventListener('mousemove', (e) => {
        const xAxis = (window.innerWidth  / 2 - e.pageX) / (window.innerWidth  / 2);
        const yAxis = (window.innerHeight / 2 - e.pageY) / (window.innerHeight / 2);
        const maxAngle = 3;
        const rotateX =  yAxis * maxAngle;
        const rotateY = -xAxis * maxAngle;
        _woodFrame.style.transform = `translateZ(0) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        applyFrameLighting(rotateX, rotateY);
    });

    // 滑鼠離開畫面時恢復靜止狀態
    document.addEventListener('mouseleave', () => {
        _woodFrame.style.transform = 'translateZ(0) rotateX(0deg) rotateY(0deg)';
        applyFrameLighting(0, 0);
    });
}

// ============================================================================
// 行動端：陀螺儀光照 (Gyroscope Lighting)
// 僅適用於 Android 等不需要授權的觸控設備
// iOS 因 HTTP 環境限制及美觀考量，完全跳過
// ============================================================================
(function initGyroscopeLighting() {

    // ── 0. 條件判斷 ───────────────────────────────────────────────────────────
    // 桌面端：已由滑鼠處理
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    // iOS 13+：DeviceOrientationEvent.requestPermission 為 function → 跳過
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') return;
    // 設備不支援陀螺儀
    if (!('DeviceOrientationEvent' in window)) return;

    const woodFrame = _woodFrame;
    if (!woodFrame) return;

    // ── 1. RAF 平滑插值狀態 ───────────────────────────────────────────────────
    let targetRotX = 0, targetRotY = 0;
    let currentRotX = 0, currentRotY = 0;
    let rafId = null;
    let isActive = false;
    let baseBeta = null, baseGamma = null;

    // ── 2. RAF 迴圈 ───────────────────────────────────────────────────────────
    function smoothLoop() {
        currentRotX += (targetRotX - currentRotX) * 0.10;
        currentRotY += (targetRotY - currentRotY) * 0.10;
        // 同時更新 3D 傾斜與 box-shadow 光照
        woodFrame.style.transform =
            `translateZ(0) rotateX(${currentRotX}deg) rotateY(${currentRotY}deg)`;
        applyFrameLighting(currentRotX, currentRotY);
        rafId = requestAnimationFrame(smoothLoop);
    }

    // ── 3. 陀螺儀資料處理（自動以首次姿勢為零點） ────────────────────────────
    function handleOrientation(e) {
        if (e.beta === null || e.gamma === null) return;
        if (baseBeta === null) { baseBeta = e.beta; baseGamma = e.gamma; }
        const max = 5;
        targetRotX = Math.max(-max, Math.min(max, (e.beta  - baseBeta)  * 0.25));
        targetRotY = Math.max(-max, Math.min(max, (e.gamma - baseGamma) * 0.25));
    }

    // ── 4. 啟動 / 停止（省電管理） ────────────────────────────────────────────
    function startGyroscope() {
        if (isActive) return;
        isActive = true;
        baseBeta = null; baseGamma = null;
        window.addEventListener('deviceorientation', handleOrientation, { passive: true });
        smoothLoop();
    }

    function stopGyroscope() {
        if (!isActive) return;
        isActive = false;
        window.removeEventListener('deviceorientation', handleOrientation);
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        targetRotX = 0; targetRotY = 0;
    }

    document.addEventListener('visibilitychange', () => {
        document.hidden ? stopGyroscope() : startGyroscope();
    });

    // ── 5. 啟動（延遲 600ms 避免影響初始渲染） ───────────────────────────────
    setTimeout(startGyroscope, 600);

})();


