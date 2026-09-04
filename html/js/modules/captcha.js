/* ============================================================================
 * Private Sun Yat-sen Memorial Hall — Captcha Bridge Module (captcha.js)
 * ============================================================================
 * COMMENTING STANDARDS
 * 1. Block comments only. Inline comments (//) are strictly prohibited.
 * 2. Section dividers use the === banner format.
 * 3. All prose is written in English.
 * ============================================================================ */

let captchaLoaded = false;
let captchaRoot = null;

export function loadCaptcha() {
    return new Promise((resolve, reject) => {
        if (captchaLoaded) return resolve();

        const css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = 'captcha/clawcaptcha.css';

        const mainStyle = document.querySelector('link[href*="main/style.css"]');
        if (mainStyle) {
            document.head.insertBefore(css, mainStyle);
        } else {
            document.head.appendChild(css);
        }

        const react = document.createElement('script');
        react.src = 'captcha/react.production.min.js';

        const reactDom = document.createElement('script');
        reactDom.src = 'captcha/react-dom.production.min.js';

        const bundled = document.createElement('script');
        bundled.src = 'captcha/bundled.js?v=2';

        react.onload = () => {
            document.head.appendChild(reactDom);
        };
        reactDom.onload = () => {
            document.head.appendChild(bundled);
        };
        bundled.onload = () => {
            captchaLoaded = true;
            resolve();
        };
        bundled.onerror = reject;

        document.head.appendChild(react);
    });
}

export async function showCaptchaModal(onVerified) {
    const overlay = document.getElementById('captcha-modal-overlay');
    const rootEl = document.getElementById('captcha-root');

    if (overlay) overlay.classList.add('active');

    if (!captchaLoaded) {
        if (rootEl) {
            rootEl.innerHTML = '<div style="color:var(--text-secondary,#888888);">載入驗證碼中...</div>';
        }
        await loadCaptcha();
    }

    if (!captchaRoot && rootEl && window.ReactDOM) {
        captchaRoot = window.ReactDOM.createRoot(rootEl);
    }

    if (!captchaRoot) return;

    const App = () => {
        return window.React.createElement(window.ClawCaptcha, {
            onVerify: () => {
                if (overlay) overlay.classList.remove('active');

                if (typeof onVerified === 'function') {
                    onVerified();
                }

                setTimeout(() => {
                    if (captchaRoot) {
                        captchaRoot.unmount();
                        captchaRoot = null;
                    }
                }, 500);
            },
            assetBase: 'captcha/assets/toys/'
        });
    };

    captchaRoot.render(window.React.createElement(App));
}
