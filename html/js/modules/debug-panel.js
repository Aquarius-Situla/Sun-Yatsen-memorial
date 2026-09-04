/* ============================================================================
 * Private Sun Yat-sen Memorial Hall — Diagnostic HUD Module (debug-panel.js)
 * ============================================================================
 * COMMENTING STANDARDS
 * 1. Block comments only. Inline comments (//) are strictly prohibited.
 * 2. Section dividers use the === banner format.
 * 3. All prose is written in English.
 * ============================================================================ */

/* ============================================================================
 * Diagnostic Data Collector & Formatter
 * ============================================================================ */
export function getDiagnosticData() {
    const isIOSStandalone = ('standalone' in window.navigator) && window.navigator.standalone;
    const isPWAStandalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;

    const tabBar = document.querySelector('.apple-tab-bar');
    const tabBarCS = tabBar ? window.getComputedStyle(tabBar) : null;
    const tabBarRect = tabBar ? tabBar.getBoundingClientRect() : null;

    const rootCS = window.getComputedStyle(document.documentElement);

    /* Measure safe area inset dynamically */
    const testEl = document.createElement('div');
    testEl.style.position = 'fixed';
    testEl.style.bottom = '0';
    testEl.style.paddingBottom = 'env(safe-area-inset-bottom, 0px)';
    testEl.style.visibility = 'hidden';
    testEl.style.pointerEvents = 'none';
    document.body.appendChild(testEl);
    const measuredSafeAreaBottom = window.getComputedStyle(testEl).paddingBottom;
    testEl.remove();

    return {
        timestamp: new Date().toISOString(),
        url: window.location.href,
        ua: navigator.userAgent,
        standalone: {
            navStandalone: !!isIOSStandalone,
            mediaStandalone: !!isPWAStandalone,
            htmlHasClass: document.documentElement.classList.contains('is-standalone')
        },
        screen: {
            width: window.screen.width,
            height: window.screen.height,
            availHeight: window.screen.availHeight,
            availWidth: window.screen.availWidth,
            pixelRatio: window.devicePixelRatio
        },
        windowViewport: {
            innerWidth: window.innerWidth,
            innerHeight: window.innerHeight,
            outerWidth: window.outerWidth,
            outerHeight: window.outerHeight
        },
        visualViewport: window.visualViewport ? {
            width: window.visualViewport.width,
            height: window.visualViewport.height,
            scale: window.visualViewport.scale,
            offsetTop: window.visualViewport.offsetTop,
            pageTop: window.visualViewport.pageTop
        } : null,
        documentBounds: {
            clientW: document.documentElement.clientWidth,
            clientH: document.documentElement.clientHeight,
            scrollW: document.documentElement.scrollWidth,
            scrollH: document.documentElement.scrollHeight,
            bodyClientH: document.body.clientHeight,
            bodyScrollH: document.body.scrollHeight
        },
        tabBarComputed: tabBarCS ? {
            position: tabBarCS.position,
            bottom: tabBarCS.bottom,
            height: tabBarCS.height,
            paddingBottom: tabBarCS.paddingBottom,
            boxSizing: tabBarCS.boxSizing,
            transform: tabBarCS.transform,
            zIndex: tabBarCS.zIndex,
            display: tabBarCS.display
        } : null,
        tabBarRect: tabBarRect ? {
            top: tabBarRect.top,
            bottom: tabBarRect.bottom,
            height: tabBarRect.height,
            left: tabBarRect.left,
            right: tabBarRect.right
        } : null,
        safeArea: {
            measuredBottom: measuredSafeAreaBottom,
            standaloneVar: rootCS.getPropertyValue('--tab-bar-standalone-bottom') || 'unset'
        },
        diffCalculation: {
            screenH: Math.max(window.screen.height, window.screen.width),
            diff: Math.max(window.screen.height, window.screen.width) - window.innerHeight
        }
    };
}

/* ============================================================================
 * Diagnostic Modal Renderer
 * ============================================================================ */
export function showDiagnosticModal() {
    let modal = document.getElementById('sys-diag-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'sys-diag-modal';
        modal.style.cssText = 'position: fixed; top: 20px; left: 12px; right: 12px; bottom: 20px; background: rgba(18, 18, 20, 0.95); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); color: #30d158; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; line-height: 1.45; padding: 16px; box-sizing: border-box; border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.2); box-shadow: 0 12px 40px rgba(0, 0, 0, 0.85); z-index: 999999; overflow-y: auto; -webkit-overflow-scrolling: touch; display: flex; flex-direction: column;';
        document.body.appendChild(modal);
    }

    const data = getDiagnosticData();

    modal.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid rgba(255, 255, 255, 0.15);">
            <strong style="color: #ffffff; font-size: 13px;">🔍 系統即時視口診斷面板</strong>
            <div>
                <button id="sys-diag-copy-btn" style="background: #0a84ff; color: #fff; border: none; border-radius: 6px; padding: 4px 10px; font-size: 11px; margin-right: 6px; cursor: pointer;">複製數據</button>
                <button id="sys-diag-close-btn" style="background: rgba(255,255,255,0.15); color: #fff; border: none; border-radius: 6px; padding: 4px 10px; font-size: 11px; cursor: pointer;">關閉</button>
            </div>
        </div>
        <pre style="margin: 0; white-space: pre-wrap; word-break: break-all; flex: 1; color: #e5e5ea;">${JSON.stringify(data, null, 2)}</pre>
    `;

    modal.style.display = 'flex';

    document.getElementById('sys-diag-close-btn').onclick = function() {
        modal.style.display = 'none';
    };

    document.getElementById('sys-diag-copy-btn').onclick = function() {
        const text = JSON.stringify(data, null, 2);
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function() {
                alert('診斷數據已複製到剪貼簿！');
            });
        } else {
            prompt('請手動全選複製以下診斷資訊：', text);
        }
    };
}

/* ============================================================================
 * Diagnostic Activation Trigger (Triple-Tap on Title or ?debug=1)
 * ============================================================================ */
export function setupDiagnosticTrigger() {
    if (typeof window === 'undefined') return;

    /* Auto-open if query parameter ?debug=1 is present */
    const params = new URLSearchParams(window.location.search);
    if (params.get('debug') === '1') {
        setTimeout(showDiagnosticModal, 300);
    }

    /* Triple-tap gesture listener on top navigation headers */
    let tapCount = 0;
    let tapTimer = null;

    function handleTap() {
        tapCount++;
        if (tapTimer) clearTimeout(tapTimer);

        if (tapCount >= 3) {
            tapCount = 0;
            showDiagnosticModal();
        } else {
            tapTimer = setTimeout(function() {
                tapCount = 0;
            }, 800);
        }
    }

    /* Bind to common title elements */
    const targets = [
        document.getElementById('top-nav-title'),
        document.getElementById('page-title'),
        document.querySelector('.apple-top-nav'),
        document.getElementById('memorial-banner'),
        document.querySelector('.nav-title')
    ];

    targets.forEach(function(target) {
        if (target) {
            target.addEventListener('click', handleTap);
        }
    });

    /* Also bind to top corner for easy triggering in standalone PWA */
    const cornerTarget = document.createElement('div');
    cornerTarget.style.cssText = 'position: fixed; top: 0; left: 0; width: 80px; height: 50px; z-index: 999998; background: transparent;';
    cornerTarget.addEventListener('click', handleTap);
    document.body.appendChild(cornerTarget);
}
