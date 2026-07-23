/* ============================================================================
 * Admin Dashboard Logic
 * ============================================================================ */

const loginScreen = document.getElementById('login-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const loginForm = document.getElementById('login-form');
const passwordInput = document.getElementById('admin-password');
const danmakuList = document.getElementById('danmaku-list');
const totalCount = document.getElementById('total-count');
const refreshBtn = document.getElementById('refresh-btn');
const logoutBtn = document.getElementById('logout-btn');

const WORKER_API = (window.ENV && window.ENV.WORKER_API) ? window.ENV.WORKER_API : '';

let adminKey = localStorage.getItem('danmaku_admin_key');

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
    loadDanmaku();
}

function showLogin() {
    dashboardScreen.classList.remove('active');
    loginScreen.classList.add('active');
    localStorage.removeItem('danmaku_admin_key');
    adminKey = null;
    passwordInput.value = '';
}

// Load Data
async function loadDanmaku() {
    if (!adminKey) return;
    
    danmakuList.innerHTML = '<div class="empty-state">載入中...</div>';
    
    try {
        const res = await fetch(WORKER_API + '/danmaku');
        if (!res.ok) throw new Error('Failed to fetch data');
        
        const data = await res.json();
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
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    adminKey = passwordInput.value.trim();
    if (adminKey) {
        localStorage.setItem('danmaku_admin_key', adminKey);
        showDashboard();
    }
});

refreshBtn.addEventListener('click', loadDanmaku);
logoutBtn.addEventListener('click', showLogin);

// Init
if (adminKey) {
    showDashboard();
}
