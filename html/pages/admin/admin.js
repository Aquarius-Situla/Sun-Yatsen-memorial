/* ============================================================================
 * Admin Dashboard Logic
 * ============================================================================ */

const loginScreen = document.getElementById('login-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const loginForm = document.getElementById('login-form');
const passwordInput = document.getElementById('admin-password');

let captchaSuccessCallback = null;

// Listen for iframe success message
window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CAPTCHA_SUCCESS') {
        const overlay = document.getElementById('captcha-modal-overlay');
        if (overlay) overlay.style.display = 'none';
        
        if (captchaSuccessCallback) {
            const cb = captchaSuccessCallback;
            captchaSuccessCallback = null;
            setTimeout(cb, 300);
        }
    }
});

function showCaptcha(onSuccessCallback) {
    const overlay = document.getElementById('captcha-modal-overlay');
    const iframe = document.getElementById('captcha-iframe');
    if (!overlay || !iframe) return;
    
    captchaSuccessCallback = onSuccessCallback;
    
    // Reload iframe to get a fresh Captcha
    iframe.src = iframe.src;
    overlay.style.display = 'flex';
}

// --- Login Logic ---
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Trigger Captcha before actual login attempt
        const submitBtn = loginForm.querySelector('button');
        const oldText = submitBtn.textContent;
        submitBtn.textContent = '安全驗證中...';
        submitBtn.disabled = true;

        showCaptcha(async () => {
            const pwd = passwordInput.value.trim();
            if (!pwd) {
                showToast('請輸入密碼');
                submitBtn.textContent = oldText;
                submitBtn.disabled = false;
                return;
            }
            
            // Hash password and attempt login
            try {
                submitBtn.textContent = '登入中...';
                const tempKey = await hashSHA256(pwd);
                
                const res = await fetch(WORKER_API + '/admin/config?admin_key=' + encodeURIComponent(tempKey), {
                    cache: 'no-store'
                });
                
                if (res.ok) {
                    adminKey = tempKey;
                    localStorage.setItem('danmaku_admin_key', adminKey);
                    showDashboard();
                } else {
                    showToast('密碼錯誤');
                    passwordInput.value = '';
                    passwordInput.focus();
                }
            } catch (err) {
                if (err.message === "INSECURE_CONTEXT") {
                    showToast('瀏覽器安全限制：非 HTTPS 環境無法執行加密，請使用 localhost 或綁定 SSL');
                } else {
                    showToast('網路連線失敗，請稍後再試');
                }
            } finally {
                submitBtn.textContent = oldText;
                submitBtn.disabled = false;
            }
        });
        
        // If user closes captcha without solving (if supported by playcaptcha), we should ideally reset the button, 
        // but since playcaptcha doesn't have an onClose callback out of the box, we reset it if overlay is hidden manually
        const overlay = document.getElementById('captcha-modal-overlay');
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'style') {
                    if (overlay.style.display === 'none') {
                        submitBtn.textContent = oldText;
                        submitBtn.disabled = false;
                    }
                }
            });
        });
        if (overlay) observer.observe(overlay, { attributes: true });
    });
}

// SHA-256 Helper function for secure transport
async function hashSHA256(message) {
    if (!window.crypto || !window.crypto.subtle) {
        throw new Error("INSECURE_CONTEXT");
    }
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const danmakuList = document.getElementById('danmaku-list');
const totalCount = document.getElementById('total-count');
const refreshBtn = document.getElementById('refresh-btn');
const logoutBtn = document.getElementById('logout-btn');
const whitelistToggle = document.getElementById('whitelist-toggle');
const autoWhitelistToggle = document.getElementById('auto-whitelist-toggle');
const autoWhitelistDatesContainer = document.getElementById('auto-whitelist-dates-container');
const autoWhitelistDates = document.getElementById('auto-whitelist-dates');

const baseCountDisplay = document.getElementById('base-count-display');
const privateCountDisplay = document.getElementById('private-count-display');
const baseUploadInput = document.getElementById('base-upload-input');
const privateUploadInput = document.getElementById('private-upload-input');

const aiToggle = document.getElementById('ai-toggle');
const aiChinaToggle = document.getElementById('ai-china-toggle');
const addAiBtn = document.getElementById('add-ai-btn');
const aiListContainer = document.getElementById('ai-list-container');
const addAiForm = document.getElementById('add-ai-form');

const aiEndpoint = document.getElementById('ai-endpoint');
const aiModel = document.getElementById('ai-model');
const aiKeys = document.getElementById('ai-keys');
const saveAiBtn = document.getElementById('save-ai-btn');
const cancelAiBtn = document.getElementById('cancel-ai-btn');

const llmCountDisplay = document.getElementById('llm-count-display');
const downloadLlmBtn = document.getElementById('download-llm-btn');
const clearLlmBtn = document.getElementById('clear-llm-btn');

const downloadJsonBtn = document.getElementById('download-json-btn');

const WORKER_API = (window.ENV && window.ENV.WORKER_API) ? window.ENV.WORKER_API : '';

let adminKey = localStorage.getItem('danmaku_admin_key');
let currentAiModels = [];
let currentLlmBlacklist = [];

// Toast Notification System
let currentToast = null;
let toastTimeout = null;

function showToast(msg) {
    if (currentToast) {
        currentToast.innerText = msg;
        currentToast.classList.add('show');
        if (toastTimeout) clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => { currentToast.classList.remove('show'); }, 3000);
        return;
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = msg;
    document.body.appendChild(toast);
    currentToast = toast;

    void toast.offsetWidth; // Reflow
    toast.classList.add('show');
    toastTimeout = setTimeout(() => { toast.classList.remove('show'); }, 3000);
}

// Download JSON logic
if (downloadJsonBtn) {
    downloadJsonBtn.addEventListener('click', () => {
        const list = window.currentDanmakuList || [];
        if (list.length === 0) {
            showToast('目前沒有彈幕可以下載');
            return;
        }
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(list, null, 2));
        const dlAnchorElem = document.createElement('a');
        dlAnchorElem.setAttribute("href", dataStr);
        dlAnchorElem.setAttribute("download", `danmaku_samples_${new Date().getTime()}.json`);
        dlAnchorElem.click();
        dlAnchorElem.remove();
        showToast('彈幕樣本下載成功');
    });
}

// Format Date
function formatTime(timestamp) {
    const d = new Date(timestamp);
    return d.toLocaleString('zh-TW', {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
}

// Switch Screens
function showDashboard() {
    loginScreen.classList.remove('active');
    dashboardScreen.classList.add('active');
    loadConfig();
    loadDanmaku();
}

async function loadConfig() {
    try {
        const res = await fetch(WORKER_API + '/admin/config?admin_key=' + encodeURIComponent(adminKey), { cache: 'no-store' });
        if (res.ok) {
            const data = await res.json();
            whitelistToggle.checked = data.whitelistMode;
            
            if (autoWhitelistToggle) {
                autoWhitelistToggle.checked = !!data.autoWhitelistEnabled;
                autoWhitelistDatesContainer.style.display = data.autoWhitelistEnabled ? 'flex' : 'none';
                if (data.autoWhitelistDatesStr) {
                    autoWhitelistDates.value = data.autoWhitelistDatesStr;
                }
            }
            
            if (baseCountDisplay) baseCountDisplay.textContent = data.baseWordsCount || 0;
            if (privateCountDisplay) privateCountDisplay.textContent = data.privateWordsCount || 0;
            
            if (data.aiConfig) {
                if (aiToggle) aiToggle.checked = !!data.aiConfig.enabled;
                if (aiChinaToggle) aiChinaToggle.checked = !!data.aiConfig.chinaMode;
                currentAiModels = data.aiConfig.models || [];
                renderAiModels();
            }
            
            currentLlmBlacklist = data.llmBannedWordsList || [];
            if (llmCountDisplay) llmCountDisplay.textContent = currentLlmBlacklist.length;
        }
    } catch (e) {
        console.error("Failed to load config:", e);
    }
}

whitelistToggle.addEventListener('change', async (e) => {
    const isEnabled = e.target.checked;
    e.target.disabled = true; // Lock while updating
    try {
        const res = await fetch(WORKER_API + '/admin/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                admin_key: adminKey,
                whitelistMode: isEnabled,
                autoWhitelistEnabled: autoWhitelistToggle ? autoWhitelistToggle.checked : false,
                autoWhitelistDatesStr: autoWhitelistDates ? autoWhitelistDates.value : ""
            })
        });
        const data = await res.json();
        if (data.success) {
            showToast(isEnabled ? '白名單模式已開啟' : '白名單模式已關閉');

        } else {
            showToast('設定失敗：' + (data.error || '權限不足'));
            e.target.checked = !isEnabled; // Revert
        }
    } catch (err) {
        showToast('設定失敗，請檢查網路');
        e.target.checked = !isEnabled; // Revert
    } finally {
        e.target.disabled = false;
    }
});

// Add AI Button Toggle
let editingAiIndex = -1;

if (addAiBtn) {
    addAiBtn.addEventListener('click', () => {
        if (addAiForm.style.display === 'none') {
            addAiForm.style.display = 'flex';
            editingAiIndex = -1;
            if (aiEndpoint) aiEndpoint.value = '';
            if (aiModel) aiModel.value = '';
            if (aiKeys) aiKeys.value = '';
            if (saveAiBtn) saveAiBtn.textContent = '儲存並加入矩陣';
        } else {
            addAiForm.style.display = 'none';
        }
    });
}

// Render AI Models
function renderAiModels() {
    if (!aiListContainer) return;
    aiListContainer.innerHTML = '';
    currentAiModels.forEach((model, index) => {
        const div = document.createElement('div');
        div.className = 'list-item';
        div.innerHTML = `
            <div class="item-content" style="min-width: 0; overflow: hidden; padding-right: 8px;">
                <div class="item-text" style="font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${model.model || 'Unknown Model'}</div>
                <div class="item-meta" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block;">
                    <span>${model.endpoint}</span>
                </div>
                <div class="item-meta"><span>綁定 ${model.keys ? model.keys.split('\\n').length : 0} 把 Keys</span></div>
            </div>
            <div style="display: flex; gap: 8px; align-items: center; flex-shrink: 0;">
                <button style="background: none; border: none; cursor: pointer; color: var(--text-secondary); padding: 4px; display: flex; align-items: center; justify-content: center;" onclick="editAiModel(${index})" title="設定">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                </button>
                <button class="ios-btn destructive" onclick="deleteAiModel(${index})">刪除</button>
            </div>
        `;
        aiListContainer.appendChild(div);
    });
}

window.editAiModel = function(index) {
    editingAiIndex = index;
    const model = currentAiModels[index];
    if (aiEndpoint) aiEndpoint.value = model.endpoint || '';
    if (aiModel) aiModel.value = model.model || '';
    if (aiKeys) aiKeys.value = model.keys || '';
    if (addAiForm) addAiForm.style.display = 'flex';
    if (saveAiBtn) saveAiBtn.textContent = '更新此模型設定';
    // Scroll to form smoothly
    if (addAiForm) addAiForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

window.deleteAiModel = function(index) {
    currentAiModels.splice(index, 1);
    if (editingAiIndex === index) {
        editingAiIndex = -1;
        if (addAiForm) addAiForm.style.display = 'none';
    }
    renderAiModels();
    saveConfig(true);
};

// Save Full Config Function
async function saveConfig(silent = false) {
    const payload = {
        admin_key: adminKey,
        aiConfig: {
            enabled: aiToggle ? aiToggle.checked : false,
            chinaMode: aiChinaToggle ? aiChinaToggle.checked : false,
            models: currentAiModels
        }
    };
    try {
        const res = await fetch(WORKER_API + '/admin/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
            if (!silent) showToast('AI 設定儲存成功！');
        } else {
            if (!silent) showToast('儲存失敗：' + (data.error || '權限不足'));
        }
    } catch (e) {
        if (!silent) showToast('網路連線異常，請檢查網路。');
    }
}

// Auto Whitelist toggle onChange
if (autoWhitelistToggle) {
    autoWhitelistToggle.addEventListener('change', (e) => {
        autoWhitelistDatesContainer.style.display = e.target.checked ? 'flex' : 'none';
        saveWhitelistConfig();
    });
}
if (autoWhitelistDates) {
    autoWhitelistDates.addEventListener('change', () => {
        saveWhitelistConfig();
    });
}

// Developer Mode toggle
const devModeToggle = document.getElementById('dev-mode-toggle');
if (devModeToggle) {
    devModeToggle.checked = localStorage.getItem('developer_mode') === 'true';
    devModeToggle.addEventListener('change', (e) => {
        if (e.target.checked) {
            localStorage.setItem('developer_mode', 'true');
            showToast('已開啟開發者模式 (解除頻率限制)');
        } else {
            localStorage.removeItem('developer_mode');
            showToast('已關閉開發者模式');
        }
    });
}

async function saveWhitelistConfig() {
    try {
        await fetch(WORKER_API + '/admin/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                admin_key: adminKey,
                whitelistMode: whitelistToggle.checked,
                autoWhitelistEnabled: autoWhitelistToggle.checked,
                autoWhitelistDatesStr: autoWhitelistDates.value
            })
        });
        showToast('自動白名單設定已儲存');
    } catch(e) {
        showToast('設定失敗，請檢查網路');
    }
}

// AI Toggle onChange
if (aiToggle) {
    aiToggle.addEventListener('change', (e) => {

        saveConfig(false);
    });
}
if (aiChinaToggle) {
    aiChinaToggle.addEventListener('change', () => saveConfig(false));
}

// Save New AI
if (saveAiBtn) {
    saveAiBtn.addEventListener('click', async () => {
        const ep = aiEndpoint.value.trim();
        const mod = aiModel.value.trim();
        const ks = aiKeys.value.trim();
        if (!ep || !mod || !ks) {
            showToast('請填寫完整資訊');
            return;
        }
        
        if (editingAiIndex >= 0 && editingAiIndex < currentAiModels.length) {
            // Update existing
            currentAiModels[editingAiIndex].endpoint = ep;
            currentAiModels[editingAiIndex].model = mod;
            currentAiModels[editingAiIndex].keys = ks;
        } else {
            // Add new
            currentAiModels.push({
                id: Date.now().toString(),
                endpoint: ep,
                model: mod,
                keys: ks
            });
        }
        
        aiEndpoint.value = '';
        aiModel.value = '';
        aiKeys.value = '';
        addAiForm.style.display = 'none';
        editingAiIndex = -1;
        if (saveAiBtn) saveAiBtn.textContent = '儲存並加入矩陣';
        
        renderAiModels();
        saveConfig(false);
    });
}

if (cancelAiBtn) {
    cancelAiBtn.addEventListener('click', () => {
        aiEndpoint.value = '';
        aiModel.value = '';
        aiKeys.value = '';
        addAiForm.style.display = 'none';
        editingAiIndex = -1;
        if (saveAiBtn) saveAiBtn.textContent = '儲存並加入矩陣';
    });
}

// LLM Blacklist Download & Clear
if (downloadLlmBtn) {
    downloadLlmBtn.addEventListener('click', () => {
        if (currentLlmBlacklist.length === 0) {
            showToast('目前沒有學習記錄');
            return;
        }
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentLlmBlacklist, null, 2));
        const dlAnchorElem = document.createElement('a');
        dlAnchorElem.setAttribute("href", dataStr);
        dlAnchorElem.setAttribute("download", `llm_blacklist_${new Date().getTime()}.json`);
        dlAnchorElem.click();
        dlAnchorElem.remove();
        showToast('學習紀錄下載成功');
    });
}

if (clearLlmBtn) {
    clearLlmBtn.addEventListener('click', async () => {
        if (!confirm('確定要清空所有 AI 學習紀錄嗎？清空後攔截將失效。')) return;
        try {
            const res = await fetch(WORKER_API + '/admin/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ admin_key: adminKey, clearLlmBlacklist: true })
            });
            const data = await res.json();
            if (data.success) {
                currentLlmBlacklist = [];
                if (llmCountDisplay) llmCountDisplay.textContent = "0";
                showToast('已清空學習紀錄');
            }
        } catch (e) {
            showToast('連線失敗');
        }
    });
}

// Generic file upload handler
function handleFileUpload(inputElement, configKey) {
    inputElement.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const arr = JSON.parse(event.target.result);
                if (!Array.isArray(arr) || !arr.every(item => typeof item === 'string')) {
                    showToast('格式錯誤：必須是字串陣列 (例如 ["詞彙1", "詞彙2"])');
                    return;
                }

                showToast('上傳中...');
                
                const payload = { admin_key: adminKey };
                payload[configKey] = arr;

                const res = await fetch(WORKER_API + '/admin/config', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                const data = await res.json();
                if (data.success) {
                    showToast('上傳成功！');
                    // Optimistically update UI to bypass KV propagation delay
                    if (configKey === 'baseBannedWords' && baseCountDisplay) {
                        baseCountDisplay.textContent = arr.length;
                    }
                    if (configKey === 'privateBannedWords' && privateCountDisplay) {
                        privateCountDisplay.textContent = arr.length;
                    }
                } else {
                    showToast('上傳失敗：' + (data.error || '權限不足'));
                }
            } catch (err) {
                showToast('讀取失敗或 JSON 格式不合法');
            } finally {
                inputElement.value = ''; // Reset input
            }
        };
        reader.readAsText(file);
    });
}

if (baseUploadInput) handleFileUpload(baseUploadInput, 'baseBannedWords');
if (privateUploadInput) handleFileUpload(privateUploadInput, 'privateBannedWords');

function showLogin() {
    dashboardScreen.classList.remove('active');
    loginScreen.classList.add('active');
    localStorage.removeItem('danmaku_admin_key');
    adminKey = null;
    passwordInput.value = '';
}

function renderList(list) {
    danmakuList.innerHTML = '';
    // Show newest first
    list.slice().reverse().forEach(item => {
        const div = document.createElement('div');
        div.className = 'list-item';
        
        const content = document.createElement('div');
        content.className = 'item-content';
        
        const text = document.createElement('div');
        text.className = 'item-text';
        text.textContent = item.text;
        
        const meta = document.createElement('div');
        meta.className = 'item-meta';
        
        const timeSpan = document.createElement('span');
        timeSpan.textContent = formatTime(item.time);
        
        const idSpan = document.createElement('span');
        idSpan.textContent = `ID: ${item.id.split('-')[0]}`;
        idSpan.style.fontFamily = 'monospace';
        
        meta.appendChild(timeSpan);
        meta.appendChild(idSpan);
        content.appendChild(text);
        content.appendChild(meta);
        
        const delBtn = document.createElement('button');
        delBtn.className = 'ios-btn destructive';
        delBtn.textContent = '刪除';
        delBtn.onclick = () => deleteDanmaku(item.id, div);
        const blacklistBtn = document.createElement('button');
        blacklistBtn.className = 'ios-btn';
        blacklistBtn.title = 'AI 監督學習 (提取並加入黑名單)';
        blacklistBtn.style.padding = '0';
        blacklistBtn.style.width = '32px';
        blacklistBtn.style.height = '32px';
        blacklistBtn.style.display = 'flex';
        blacklistBtn.style.alignItems = 'center';
        blacklistBtn.style.justifyContent = 'center';
        blacklistBtn.style.background = 'transparent';
        blacklistBtn.style.color = 'var(--text-secondary)';
        blacklistBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>';
        blacklistBtn.onclick = () => openAiLearnModal(item.id, item.text);
        
        const actionsDiv = document.createElement('div');
        actionsDiv.style.display = 'flex';
        actionsDiv.style.gap = '8px';
        actionsDiv.appendChild(blacklistBtn);
        actionsDiv.appendChild(delBtn);
        
        div.appendChild(content);
        div.appendChild(actionsDiv);
        
        danmakuList.appendChild(div);
    });
}

// Load Data
async function loadDanmaku() {
    if (!adminKey) return;
    
    danmakuList.innerHTML = '<div class="empty-state">載入中...</div>';
    
    try {
        const res = await fetch(WORKER_API + '/danmaku');
        if (!res.ok) throw new Error('Failed to fetch data');
        
        const data = await res.json();
        window.currentDanmakuList = data.list || [];
        const list = data.list || [];
        
        totalCount.textContent = list.length;
        
        if (list.length === 0) {
            danmakuList.innerHTML = '<div class="empty-state">目前沒有任何彈幕</div>';
            return;
        }

        renderList(list);
        
    } catch (e) {
        console.error(e);
        showToast('載入失敗');
        danmakuList.innerHTML = '<div class="empty-state">載入失敗，請檢查網路連線或重新整理</div>';
    }
}

// Delete Data
async function deleteDanmaku(id, element) {
    if (!confirm('確定要強制刪除此彈幕嗎？')) return;
    
    const originalText = element.querySelector('.ios-btn').textContent;
    element.querySelector('.ios-btn').textContent = '刪除中...';
    element.querySelector('.ios-btn').disabled = true;

    try {
        const res = await fetch(WORKER_API + '/danmaku', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id, admin_key: adminKey })
        });
        
        if (res.ok) {
            showToast('已刪除');
            element.style.opacity = '0';
            setTimeout(() => {
                element.remove();
                totalCount.textContent = Math.max(0, parseInt(totalCount.textContent) - 1);
                if (danmakuList.children.length === 0) {
                    danmakuList.innerHTML = '<div class="empty-state">目前沒有任何彈幕</div>';
                }
            }, 300);
        } else {
            const err = await res.json();
            if (res.status === 400 || res.status === 403) {
                showToast('權限不足或密碼錯誤');
                setTimeout(showLogin, 1500);
            } else {
                showToast(err.error || '刪除失敗');
                element.querySelector('.ios-btn').textContent = originalText;
                element.querySelector('.ios-btn').disabled = false;
            }
        }
    } catch (e) {
        showToast('網路錯誤');
        element.querySelector('.ios-btn').textContent = originalText;
        element.querySelector('.ios-btn').disabled = false;
    }
}

// Event Listeners
// Login event listener removed (now handled at the top of the file with Captcha)

refreshBtn.addEventListener('click', () => {
    loadDanmaku();
    loadConfig();
});
logoutBtn.addEventListener('click', showLogin);

// Init: verify existing token
if (adminKey) {
    fetch(WORKER_API + '/admin/config?admin_key=' + encodeURIComponent(adminKey))
        .then(res => {
            if (res.ok) {
                showDashboard();
            } else {
                localStorage.removeItem('danmaku_admin_key');
                adminKey = '';
                showLogin();
            }
        })
        .catch(() => {
            // If network fails on init, still try to show login screen
            showLogin();
        });
}

/* ============================================================================
 * AI Supervised Learning Modal Logic
 * ============================================================================ */
const aiLearnModal = document.getElementById('ai-learn-modal');
const learnHelpBtn = document.getElementById('learn-help-btn');
const learnCancelBtn = document.getElementById('learn-cancel-btn');
const learnSubmitBtn = document.getElementById('learn-submit-btn');
const learnReasonInput = document.getElementById('learn-reason-input');

let currentLearnId = null;
let currentLearnText = null;

function openAiLearnModal(id, text) {
    currentLearnId = id;
    currentLearnText = text;
    learnReasonInput.value = '';
    aiLearnModal.classList.add('active');
    setTimeout(() => learnReasonInput.focus(), 100);
}

function closeAiLearnModal() {
    aiLearnModal.classList.remove('active');
    currentLearnId = null;
    currentLearnText = null;
}

const learnHelpPopover = document.getElementById('learn-help-popover');

if (learnHelpBtn) {
    learnHelpBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // prevent document click from immediately closing it
        if (learnHelpPopover) {
            learnHelpPopover.classList.toggle('show');
        }
    });
}

// Close popover when clicking anywhere else
document.addEventListener('click', (e) => {
    if (learnHelpPopover && learnHelpPopover.classList.contains('show')) {
        if (!learnHelpPopover.contains(e.target) && e.target !== learnHelpBtn) {
            learnHelpPopover.classList.remove('show');
        }
    }
});

if (learnCancelBtn) {
    learnCancelBtn.addEventListener('click', closeAiLearnModal);
}

if (aiLearnModal) {
    aiLearnModal.addEventListener('click', (e) => {
        if (e.target === aiLearnModal) {
            closeAiLearnModal();
        }
    });
}

if (learnSubmitBtn) {
    learnSubmitBtn.addEventListener('click', async () => {
        const reason = learnReasonInput.value.trim();
        if (!reason) {
            showToast('請輸入違規原因或指定敏感詞！');
            return;
        }

        learnSubmitBtn.disabled = true;
        learnSubmitBtn.textContent = '學習中...';

        try {
            const res = await fetch(WORKER_API + '/admin/learn', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    admin_key: adminKey,
                    id: currentLearnId,
                    text: currentLearnText,
                    reason: reason
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                showToast(`已成功加入黑名單！提取詞彙：${data.learned.join(', ')}`);
                closeAiLearnModal();
                await loadConfig();
                await loadDanmaku();
            } else {
                showToast('學習失敗：' + (data.error || '不明錯誤'));
            }
        } catch (e) {
            showToast('連線失敗');
        } finally {
            learnSubmitBtn.disabled = false;
            learnSubmitBtn.textContent = '提交';
        }
    });
}
