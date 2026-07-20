addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

// === 後端敏感詞庫 ===
const SERVER_BANNED_WORDS = ['測試敏感詞', '髒話', '廣告', '法輪功', '台獨', '共匪'];

async function handleRequest(request) {
  // 🌟 核心修復 1：強力注入 CORS 跨域請求頭
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // 應對瀏覽器的預檢請求
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 🌟 核心修復 2：嚴格檢查數據庫綁定狀態
    if (typeof MEMORIAL_KV === 'undefined') {
      return new Response(JSON.stringify({ error: "KV 數據庫未綁定！請檢查環境變量名是否為 MEMORIAL_KV" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const url = new URL(request.url);

    // ==========================================
    // 路由: /danmaku (處理彈幕 GET / POST)
    // ==========================================
    if (url.pathname === '/danmaku') {
      
      // [GET] 取得最新彈幕
      if (request.method === "GET") {
        let danmakuData = await MEMORIAL_KV.get("DANMAKU_LIST");
        let list = danmakuData ? JSON.parse(danmakuData) : [];
        return new Response(JSON.stringify({ list: list }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      // [POST] 發送新彈幕
      if (request.method === "POST") {
        const body = await request.json();
        const fp = body.fp || "unknown_fp";
        let text = body.text || "";
        
        if (!text.trim()) {
            return new Response(JSON.stringify({ error: "留言不能為空" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // 1. 後端防刷屏：檢查短期鎖 (10秒)
        const lockKey = `msg_lock_${fp}`;
        const isLocked = await MEMORIAL_KV.get(lockKey);
        if (isLocked) {
            return new Response(JSON.stringify({ error: "發送過於頻繁，請防範刷屏 (冷卻中)" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // 2. 後端敏感詞過濾：替換為 ***
        for (let word of SERVER_BANNED_WORDS) {
            const regex = new RegExp(word, 'gi');
            text = text.replace(regex, '***');
        }

        // 3. 讀取並更新彈幕陣列 (限制最大 50 筆，避免 KV 爆表)
        let danmakuData = await MEMORIAL_KV.get("DANMAKU_LIST");
        let list = danmakuData ? JSON.parse(danmakuData) : [];
        
        list.push(text);
        
        // 限制陣列長度，只保留最後 50 筆
        if (list.length > 50) {
            list = list.slice(-50);
        }

        // 4. 寫回 KV 並設定防刷屏鎖 (60秒後自動過期，因 KV 限制最小為 60)
        await MEMORIAL_KV.put("DANMAKU_LIST", JSON.stringify(list));
        await MEMORIAL_KV.put(lockKey, "1", { expirationTtl: 60 }); // 60秒冷卻

        return new Response(JSON.stringify({ success: true, text: text }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // ==========================================
    // 預設路由: / (處理參典人次自動打卡)
    // ==========================================
    
    // 讀取當前數據庫中的總人數
    let count = await MEMORIAL_KV.get("TOTAL_ATTENDANCE");
    count = count ? parseInt(count) : 0;

    // 當收到前端發送的自動打卡請求時
    if (request.method === "POST") {
      const body = await request.json();
      const fp = body.fp;

      if (fp) {
        // 以當天日期（形如 2026-06-15）為基準生成今日設備鎖
        const today = new Date().toISOString().split('T')[0];
        const lockKey = `lock_${fp}_${today}`;

        // 檢查這個指紋今天有沒有來過
        const hasVisited = await MEMORIAL_KV.get(lockKey);

        if (!hasVisited) {
          // 如果是今天第一次來，悄悄 +1 並存入數據庫
          count += 1;
          await MEMORIAL_KV.put("TOTAL_ATTENDANCE", count.toString());
          // 鎖死該設備，生存期設為 1 天（86400秒後自動釋放）
          await MEMORIAL_KV.put(lockKey, "1", { expirationTtl: 86400 });
        }
      }
    }

    // 無論是新客自動 +1 還是老客重訪，統一返回最新總人數
    return new Response(JSON.stringify({ count: count }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}
