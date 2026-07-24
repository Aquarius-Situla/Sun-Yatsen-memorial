/* ============================================================================
 * Admin Dashboard Logic
 * ============================================================================ */

const loginScreen = document.getElementById('login-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const loginForm = document.getElementById('login-form');
const passwordInput = document.getElementById('admin-password');

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
                whitelistMode: isEnabled
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
if (addAiBtn) {
    addAiBtn.addEventListener('click', () => {
        if (addAiForm.style.display === 'none') {
            addAiForm.style.display = 'flex';
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
            <div class="item-content">
                <div class="item-text" style="font-size: 14px; font-weight: 600;">${model.model || 'Unknown Model'}</div>
                <div class="item-meta"><span>${model.endpoint}</span></div>
                <div class="item-meta"><span>綁定 ${model.keys ? model.keys.split('\\n').length : 0} 把 Keys</span></div>
            </div>
            <button class="ios-btn destructive" onclick="deleteAiModel(${index})">刪除</button>
        `;
        aiListContainer.appendChild(div);
    });
}

window.deleteAiModel = function(index) {
    currentAiModels.splice(index, 1);
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

// AI Toggle onChange
if (aiToggle) {
    aiToggle.addEventListener('change', () => saveConfig(false));
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
        currentAiModels.push({
            id: Date.now().toString(),
            endpoint: ep,
            model: mod,
            keys: ks
        });
        renderAiModels();
        aiEndpoint.value = '';
        aiModel.value = '';
        aiKeys.value = '';
        addAiForm.style.display = 'none';
        saveConfig(false);
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
        
        div.appendChild(content);
        div.appendChild(delBtn);
        
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
            
            div.appendChild(content);
            div.appendChild(delBtn);
            
            danmakuList.appendChild(div);
        });
        
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
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const plaintextKey = passwordInput.value.trim();
    if (!plaintextKey) return;

    const submitBtn = loginForm.querySelector('button');
    const oldText = submitBtn.textContent;
    submitBtn.textContent = '登入中...';
    submitBtn.disabled = true;

    try {
        const tempKey = await hashSHA256(plaintextKey);
        
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
