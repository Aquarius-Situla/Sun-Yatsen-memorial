/* ============================================================================
 * Private Sun Yat-sen Memorial Hall — Message Sheet Module (message-sheet.js)
 * ============================================================================
 * COMMENTING STANDARDS
 * 1. Block comments only. Inline comments (//) are strictly prohibited.
 * 2. Section dividers use the === banner format.
 * 3. All prose is written in English.
 * ============================================================================ */

import { showToast, formatError } from './ui.js';
import { generateBrowserFingerprint } from './attendance.js';
import { showCaptchaModal } from './captcha.js';
import { createDanmaku, getDanmakuState } from './danmaku.js';

let bannedWordsList = [];
let consecutiveViolations = 0;
let messageCooldown = false;
let mySentMessages = JSON.parse(localStorage.getItem('mySentMessages')) || [];

/* ============================================================================
 * Banned Words Loader
 * ============================================================================ */
export function loadBannedWords(apiUrl) {
    if (!apiUrl || bannedWordsList.length > 0) return;
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 3500) : null;

    fetch(apiUrl + '/danmaku?action=get_banned_words', {
        signal: controller ? controller.signal : undefined
    })
        .then(res => res.json())
        .then(data => {
            if (timeoutId) clearTimeout(timeoutId);
            if (Array.isArray(data)) {
                bannedWordsList = data;
            }
        })
        .catch(() => {
            if (timeoutId) clearTimeout(timeoutId);
        });
}

/* ============================================================================
 * Spam & Quality Verification
 * ============================================================================ */
export function containsBannedWords(text) {
    return bannedWordsList.some(word => text.includes(word));
}

export function isSpam(text) {
    /* Consecutive identical characters */
    if (/(.)\1{4,}/.test(text)) return true;

    /* Extreme lack of unique characters in long strings */
    if (text.length >= 10 && new Set(text).size <= 2) return true;

    /* Keyboard smash: 7 or more consecutive consonants */
    if (/[bcdfghjklmnpqrstvwxz]{7,}/i.test(text)) return true;

    /* Pure long number sequences */
    if (/\d{12,}/.test(text)) return true;

    /* Long random letters without spaces */
    if (/^[a-zA-Z]{12,}$/.test(text) && !/[aeiouy]{2,}/i.test(text)) return true;

    return false;
}

/* ============================================================================
 * History Popover Management
 * ============================================================================ */
export function renderHistoryPopover(historyListEl, apiUrl) {
    if (!historyListEl) return;
    historyListEl.innerHTML = '';

    if (mySentMessages.length === 0) {
        historyListEl.innerHTML = '<div class="empty-history">暫無留言紀錄</div>';
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
        retractBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (confirm('確定要撤回這則留言嗎？')) {
                await retractMessage(msg.id, apiUrl, historyListEl);
            }
        });

        item.appendChild(textSpan);
        item.appendChild(retractBtn);
        historyListEl.appendChild(item);
    });
}

export async function retractMessage(id, apiUrl, historyListEl) {
    try {
        const fp = await generateBrowserFingerprint();
        const response = await fetch(apiUrl + '/danmaku', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, fp })
        });

        if (response.ok) {
            mySentMessages = mySentMessages.filter(m => m.id !== id);
            localStorage.setItem('mySentMessages', JSON.stringify(mySentMessages));
            renderHistoryPopover(historyListEl, apiUrl);
            showToast('留言已撤回', 'system');
        } else {
            showToast('撤回失敗或該留言已被移除', 'error');
        }
    } catch (err) {
        showToast(formatError(err, '網路異常，無法撤回'), 'error');
    }
}

/* ============================================================================
 * Message Sheet Controller Setup
 * ============================================================================ */
export function setupMessageSheet(elements, apiUrl) {
    const {
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
    } = elements;

    loadBannedWords(apiUrl);

    /* Open Modal */
    if (openMessageBtn) {
        openMessageBtn.addEventListener('click', (e) => {
            e.preventDefault();
            messageModal.classList.add('active');
            if (messageInput) messageInput.focus();
        });
    }

    /* Cancel Button */
    if (desktopCancelBtn) {
        desktopCancelBtn.addEventListener('click', () => {
            if (messageModal) messageModal.classList.remove('active');
        });
    }

    /* Input Counter */
    if (messageInput && charCount) {
        messageInput.addEventListener('input', () => {
            charCount.textContent = messageInput.value.length;
        });
    }

    /* History Toggle */
    if (historyMessageBtn && historyPopover) {
        historyMessageBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            historyPopover.classList.toggle('show');
            if (historyPopover.classList.contains('show')) {
                renderHistoryPopover(historyList, apiUrl);
            }
        });
    }

    /* Modal Backdrop Close */
    if (messageModal) {
        messageModal.addEventListener('click', (e) => {
            if (historyPopover &&
                historyPopover.classList.contains('show') &&
                !historyPopover.contains(e.target) &&
                e.target !== historyMessageBtn &&
                !e.target.closest('#history-message-btn')) {
                historyPopover.classList.remove('show');
            }
            if (e.target === messageModal) {
                if (messageInput) messageInput.value = '';
                if (charCount) charCount.textContent = '0';
                if (historyPopover) historyPopover.classList.remove('show');
                messageModal.classList.remove('active');
            }
        });
    }

    function handleViolation(msg) {
        showToast(msg, 'error');
        consecutiveViolations++;
        if (consecutiveViolations >= 3) {
            setTimeout(() => {
                if (messageModal) messageModal.classList.remove('active');
                showCaptchaModal(() => {
                    consecutiveViolations = 0;
                    showToast('人類驗證成功', 'success');
                });
            }, 300);
        }
    }

    /* Message Submission */
    if (submitMessageBtn && messageInput) {
        submitMessageBtn.addEventListener('click', async () => {
            const isDevMode = localStorage.getItem('developer_mode') === 'true';
            if (messageCooldown && !isDevMode) return;

            const text = messageInput.value.trim();

            if (!text) {
                showToast('留言不能為空', 'error');
                return;
            }
            if (text.length > 50) {
                showToast('留言限 50 字內', 'error');
                return;
            }
            if (containsBannedWords(text)) {
                handleViolation('請勿包含敏感詞彙');
                return;
            }
            if (isSpam(text)) {
                handleViolation('請勿發送無意義的重複內容');
                return;
            }

            consecutiveViolations = 0;
            messageModal.classList.remove('active');

            let timer = null;
            if (!isDevMode) {
                messageCooldown = true;
                submitMessageBtn.disabled = true;
                let countdown = 3;
                timer = setInterval(() => {
                    if (--countdown <= 0) {
                        clearInterval(timer);
                        messageCooldown = false;
                        submitMessageBtn.disabled = false;
                    }
                }, 1000);
            }

            showToast('傳送中...', 'info');

            try {
                const fingerprint = await generateBrowserFingerprint();
                const response    = await fetch(apiUrl + '/danmaku', {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify({ fp: fingerprint, text: text, devMode: isDevMode })
                });

                if (response.ok) {
                    const data = await response.json();
                    showToast('發送成功！', 'success');
                    messageInput.value = '';
                    if (charCount) charCount.textContent = '0';

                    mySentMessages.push({ id: data.id, text: text, time: data.time || Date.now() });
                    localStorage.setItem('mySentMessages', JSON.stringify(mySentMessages));
                    if (historyPopover && historyPopover.classList.contains('show')) {
                        renderHistoryPopover(historyList, apiUrl);
                    }

                    if (getDanmakuState()) {
                        createDanmaku(text, danmakuContainer, portraitImg);
                    }
                } else {
                    const err = await response.json().catch(() => ({}));
                    showToast(err.error || '發送失敗，請稍候再試。', 'error');

                    if (err.error && err.error.includes('ratelimit')) {
                        if (timer) clearInterval(timer);
                        showCaptchaModal(() => {
                            showToast('驗證通過', 'success');
                        });
                    } else {
                        if (timer) clearInterval(timer);
                        messageCooldown = false;
                        submitMessageBtn.disabled = false;
                    }
                }
            } catch (err) {
                showToast(formatError(err, '網路連線異常，請檢查網路'), 'error');
                if (timer) clearInterval(timer);
                messageCooldown = false;
                submitMessageBtn.disabled = false;
            }
        });
    }
}
