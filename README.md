# 🏛️ 私立中山紀念堂 (Sun-Yatsen-memorial)

歡迎來到**私立中山紀念堂**。這是一個非營利性質的線上互動紀念專案，旨在緬懷孫中山先生及致敬歷史上的革命先驅。本專案同時也是一個純前端技術的實踐，探索了現代 Web 互動、多媒體播放與響應式設計。

## ✨ 核心功能與特色

- **儀式感互動設計**：包含向國父遺像行三鞠躬禮的互動提示與狀態列。
- **多媒體播放**：點擊遺像即可自動播放紀念樂曲（如國歌等）。
- **民國曆法轉換**：即時讀取並顯示對應的民國紀年與日期。
- **PWA 與響應式支援**：支援行動端設備，配備完整的 Web App Manifest 與各種 iOS 啟動圖 (Splash Screens)，提供原生 App 般的沉浸式體驗。
- **豐富的歷史文獻**：內建國父遺囑、生平事蹟介紹、以及相關的紀念與歷史文章。

## 🛠️ 技術棧

- **核心技術**：原生 HTML5 / CSS3 / Vanilla JavaScript
- **部署配置**：提供 `docker-compose.yml` 結合 Nginx 進行快速容器化部署。

## 🚀 快速啟動 (Docker)

本專案支援使用 Docker 與 Nginx 快速部署。

```bash
# 確保你已安裝 Docker 與 docker-compose
docker-compose up -d
```

部署後，Nginx 將會以唯讀模式掛載 `./html` 目錄並對外提供靜態網頁服務。

## ☁️ 後端與資料庫 (Cloudflare Workers)

本專案的「參典人數統計」與「留言彈幕系統」依賴 Cloudflare Workers 與 KV 進行後端處理。
我們在專案根目錄提供了 `workers.js` 作為後端部署的原始碼。

**部署步驟：**
1. 登入 Cloudflare 後台，建立一個新的 Worker。
2. 為該 Worker 綁定一個 KV 命名空間，且變數名稱**必須**設定為 `MEMORIAL_KV`。
3. 將 `workers.js` 內的程式碼全選複製，貼上並覆蓋 Worker 編輯器內的預設程式碼，然後發布。
4. 將您的 Worker 網址（如 `https://your-worker-api.workers.dev`）填入 `html/env.js`（可參考 `env.example.js`）中的 `WORKER_API` 變數。

## 📜 授權聲明

本專案採用**雙軌制**授權：
1. **程式碼部分**：基於 [MIT License](LICENSE) 開源，歡迎自由學習、修改與分享。
2. **視聽素材部分**：專案內的音樂、遺像等視聽素材版權歸原權利人所有，嚴禁未經授權挪用作商業營利或不當用途。詳細規範請參閱專案內的 [關於與聲明 (繁體)](html/about_cn.md) / [关于与声明 (简体)](html/about_cp.md) 文件。

---
*「革命尚未成功，同志仍須努力。」*
