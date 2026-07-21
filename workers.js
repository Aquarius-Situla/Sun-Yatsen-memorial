/* ============================================================================
 * Cloudflare Worker Backend (workers.js)
 * ============================================================================
 * COMMENTING STANDARDS
 * 1. Block comments only. Line comments (//) are prohibited.
 * 2. Section dividers use the === banner format shown above.
 * 3. All prose is written in English.
 * 4. No debugging notes, temporary workarounds, or console output in
 *    committed code.
 * ============================================================================
 */

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

/* Server-Side Banned Word Dictionary will be dynamically loaded from KV when possible.
 * This is a minimal fallback list if KV fetch fails or is empty.
 */
const FALLBACK_BANNED_WORDS = ['測試敏感詞', '髒話', '廣告', '法輪功', '台獨', '共匪'];

async function handleRequest(request) {
  /* ============================================================================
   * CORS Configuration
   * ============================================================================ */
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, HEAD, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  /* Handle preflight OPTIONS requests */
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    /* ============================================================================
     * KV Store Binding Verification
     * ============================================================================ */
    if (typeof MEMORIAL_KV === 'undefined') {
      return new Response(JSON.stringify({ error: "KV database not bound! Please ensure the environment variable is named MEMORIAL_KV." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const url = new URL(request.url);

    /* ============================================================================
     * Route: /danmaku (GET / POST handlers for Danmaku system)
     * ============================================================================ */
    if (url.pathname === '/danmaku') {
      
      /* [GET] Retrieve recent Danmaku messages */
      if (request.method === "GET") {
        let danmakuData = await MEMORIAL_KV.get("DANMAKU_LIST");
        let list = danmakuData ? JSON.parse(danmakuData) : [];
        /* Gracefully migrate any legacy strings to object schema */
        list = list.map(item => typeof item === 'string' ? { id: crypto.randomUUID(), text: item, fp: 'legacy', time: Date.now() } : item);
        return new Response(JSON.stringify({ list: list }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      /* [POST] Submit a new Danmaku message */
      if (request.method === "POST") {
        const body = await request.json();
        const fp = body.fp || "unknown_fp";
        let text = body.text || "";
        
        if (!text.trim()) {
            return new Response(JSON.stringify({ error: "Message cannot be empty." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        
        /* 0. Meaningless Spam Check */
        if (
            /(.)\1{4,}/.test(text) || 
            (text.length >= 10 && new Set(text).size <= 2) ||
            /[bcdfghjklmnpqrstvwxz]{7,}/i.test(text) ||
            /\d{12,}/.test(text) ||
            (/^[a-zA-Z]{12,}$/.test(text) && !/[aeiouy]{2,}/i.test(text))
        ) {
            return new Response(JSON.stringify({ error: "請勿發送無意義的重複內容 (Spam detected)." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        /* 1. Server-side Rate Limiting: Check for a recent lock (10 seconds) */
        const lockKey = `msg_lock_${fp}`;
        const isLocked = await MEMORIAL_KV.get(lockKey);
        if (isLocked) {
            return new Response(JSON.stringify({ error: "Sending too frequently. Please wait before sending again (ratelimit active)." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        /* 2. Server-side Profanity Filter: Mask banned words with *** */
        let serverBannedWords = FALLBACK_BANNED_WORDS;
        try {
            const kvBannedWords = await MEMORIAL_KV.get("BANNED_WORDS_DICT");
            if (kvBannedWords) {
                const parsedWords = JSON.parse(kvBannedWords);
                if (Array.isArray(parsedWords)) {
                    serverBannedWords = parsedWords;
                }
            }
        } catch (e) {
            /* Silently fallback to FALLBACK_BANNED_WORDS if JSON parse fails */
        }

        for (let word of serverBannedWords) {
            const regex = new RegExp(word, 'gi');
            text = text.replace(regex, '***');
        }

        /* 3. Retrieve and update the Danmaku array (Capped at 50 to prevent KV bloat) */
        let danmakuData = await MEMORIAL_KV.get("DANMAKU_LIST");
        let list = danmakuData ? JSON.parse(danmakuData) : [];
        list = list.map(item => typeof item === 'string' ? { id: crypto.randomUUID(), text: item, fp: 'legacy', time: Date.now() } : item);
        
        const msgId = crypto.randomUUID();
        const msgObj = { id: msgId, text: text, fp: fp, time: Date.now() };
        list.push(msgObj);
        
        /* Trim array to keep only the 50 most recent messages */
        if (list.length > 50) {
            list = list.slice(-50);
        }

        /* 4. Write back to KV and set a spam-prevention lock 
         * Note: Cloudflare KV minimum expiration time is 60 seconds.
         */
        await MEMORIAL_KV.put("DANMAKU_LIST", JSON.stringify(list));
        await MEMORIAL_KV.put(lockKey, "1", { expirationTtl: 60 });

        return new Response(JSON.stringify({ success: true, text: text, id: msgId, time: msgObj.time }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      /* [DELETE] Retract a Danmaku message */
      if (request.method === "DELETE") {
        const body = await request.json();
        const { id, fp } = body;
        
        if (!id || !fp) {
            return new Response(JSON.stringify({ error: "Missing required parameters." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        let danmakuData = await MEMORIAL_KV.get("DANMAKU_LIST");
        let list = danmakuData ? JSON.parse(danmakuData) : [];
        list = list.map(item => typeof item === 'string' ? { id: crypto.randomUUID(), text: item, fp: 'legacy', time: Date.now() } : item);

        const originalLength = list.length;
        list = list.filter(item => !(item.id === id && item.fp === fp));

        if (list.length === originalLength) {
            return new Response(JSON.stringify({ error: "Message not found or unauthorized to retract." }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        await MEMORIAL_KV.put("DANMAKU_LIST", JSON.stringify(list));

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    /* ============================================================================
     * Default Route: / (Handles automatic attendance registration)
     * ============================================================================ */
    
    /* Retrieve the total historical visitor count */
    let count = await MEMORIAL_KV.get("TOTAL_ATTENDANCE");
    count = count ? parseInt(count) : 0;

    /* Handle incoming automatic attendance pings */
    if (request.method === "POST") {
      const body = await request.json();
      const fp = body.fp;

      if (fp) {
        /* Generate a daily lock key based on the current date (e.g., 2026-06-15) */
        const today = new Date().toISOString().split('T')[0];
        const lockKey = `lock_${fp}_${today}`;

        /* Verify if this fingerprint has already registered today */
        const hasVisited = await MEMORIAL_KV.get(lockKey);

        if (!hasVisited) {
          /* First visit today: increment count silently and update KV */
          count += 1;
          await MEMORIAL_KV.put("TOTAL_ATTENDANCE", count.toString());
          /* Lock the device footprint for 1 day (86400 seconds) */
          await MEMORIAL_KV.put(lockKey, "1", { expirationTtl: 86400 });
        }
      }
    }

    /* Return the latest total count for both new and returning visitors */
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
