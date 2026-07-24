/* ============================================================================
 * Cloudflare Worker Backend (workers.js)
 * ============================================================================
 * COMMENTING STANDARDS
 * 1. Block comments only. Line comments (//) are prohibited.
 * 2. Section dividers use the === banner format shown above.
 * 3. All prose is written in English.
 * 4. No debugging notes, temporary workarounds, or console output in
 *    committed code.
 * 5. Store temporary files under /temp/[feature_name]/.
 * ============================================================================
 */

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request, event))
})

/* Server-Side Banned Word Dictionary will be dynamically loaded from KV when possible.
 * This is a minimal fallback list if KV fetch fails or is empty.
 */
const FALLBACK_BANNED_WORDS = ['測試敏感詞', '法轮功', '台独', '共匪', '下台', '台湾'];
const WHITELIST_PHRASES = ['孫先生萬歲！', '中國萬歲！', '中華萬歲！', '萬歲！', '萬歲'];

async function handleRequest(request, event) {
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
        /* Add a sub-route to get the public banned words list for the frontend soft-filter */
        if (url.searchParams.get('action') === 'get_banned_words') {
            let serverBannedWords = FALLBACK_BANNED_WORDS;
            try {
                const kvBannedWords = await MEMORIAL_KV.get("BANNED_WORDS_DICT");
                if (kvBannedWords) {
                    const parsedWords = JSON.parse(kvBannedWords);
                    if (Array.isArray(parsedWords)) {
                        serverBannedWords = parsedWords;
                    }
                }
            } catch (e) {}

            return new Response(JSON.stringify(serverBannedWords), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

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

        /* Whitelist Mode Check */
        const whitelistMode = await MEMORIAL_KV.get("WHITELIST_MODE_ENABLED");
        if (whitelistMode === "true") {
            if (!WHITELIST_PHRASES.includes(text)) {
                return new Response(JSON.stringify({ error: "目前為白名單模式，僅允許發送特定的致敬語。" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
            }
        }

        /* 1. Server-side Rate Limiting: 3 messages per minute */
        const lockKey = `msg_lock_${fp}`;
        let lockData = await MEMORIAL_KV.get(lockKey);
        let timestamps = lockData ? JSON.parse(lockData) : [];
        const now = Date.now();
        timestamps = timestamps.filter(t => now - t < 60000);
        
        if (timestamps.length >= 3) {
            return new Response(JSON.stringify({ error: "發送過於頻繁，請完成人類驗證後再試 (ratelimit active)" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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

        /* 2.5 Private Blacklist Filter */
        let privateBannedWords = [];
        try {
            const kvPrivateWords = await MEMORIAL_KV.get("PRIVATE_BANNED_WORDS");
            if (kvPrivateWords) {
                const parsedPrivateWords = JSON.parse(kvPrivateWords);
                if (Array.isArray(parsedPrivateWords)) {
                    privateBannedWords = parsedPrivateWords;
                }
            }
        } catch (e) {
            /* Silently ignore if JSON parse fails or missing */
        }

        /* 2.6 LLM Blacklist Filter */
        let llmBannedWords = [];
        try {
            const kvLlmWords = await MEMORIAL_KV.get("LLM_BANNED_WORDS");
            if (kvLlmWords) {
                const parsedLlmWords = JSON.parse(kvLlmWords);
                if (Array.isArray(parsedLlmWords)) {
                    llmBannedWords = parsedLlmWords.map(x => x.word);
                }
            }
        } catch (e) {}

        const allBannedWords = [...serverBannedWords, ...privateBannedWords, ...llmBannedWords];

        for (let word of allBannedWords) {
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

        /* 4. Write back to KV and update rate limit timestamps */
        await MEMORIAL_KV.put("DANMAKU_LIST", JSON.stringify(list));
        
        timestamps.push(now);
        await MEMORIAL_KV.put(lockKey, JSON.stringify(timestamps), { expirationTtl: 60 });

        /* 5. Async AI Moderation check */
        if (event && event.waitUntil) {
            try {
                const aiConfigStr = await MEMORIAL_KV.get("AI_CONFIG");
                if (aiConfigStr) {
                    const aiConfig = JSON.parse(aiConfigStr);
                    if (aiConfig.enabled && Array.isArray(aiConfig.models) && aiConfig.models.length > 0) {
                        event.waitUntil(checkDanmakuWithAI(text, msgId, aiConfig));
                    }
                }
            } catch (e) {}
        }

        return new Response(JSON.stringify({ success: true, text: text, id: msgId, time: msgObj.time }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      /* [DELETE] Retract a Danmaku message */
      if (request.method === "DELETE") {
        const body = await request.json();
        const { id, fp, admin_key } = body;
        
        if (!id) {
            return new Response(JSON.stringify({ error: "Missing message ID." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        /* Check Admin Privileges using SHA-256 Hash */
        const expectedSecret = typeof ADMIN_SECRET !== 'undefined' ? ADMIN_SECRET : "SunYatSen1911";
        
        // Helper function for SHA-256 inside worker
        async function hashSecret(secret) {
            const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
            return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
        }
        
        const expectedHash = await hashSecret(expectedSecret);
        const isAdmin = admin_key === expectedHash;

        if (!isAdmin && !fp) {
            return new Response(JSON.stringify({ error: "Missing required fingerprint or unauthorized." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        let danmakuData = await MEMORIAL_KV.get("DANMAKU_LIST");
        let list = danmakuData ? JSON.parse(danmakuData) : [];
        list = list.map(item => typeof item === 'string' ? { id: crypto.randomUUID(), text: item, fp: 'legacy', time: Date.now() } : item);

        const originalLength = list.length;
        if (isAdmin) {
            /* Admin can delete any message by ID */
            list = list.filter(item => item.id !== id);
        } else {
            /* Normal users can only delete their own messages matching their fingerprint */
            list = list.filter(item => !(item.id === id && item.fp === fp));
        }

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
     * Route: /admin/config (GET / POST handlers for Admin Config)
     * ============================================================================ */
    if (url.pathname === '/admin/config') {
        const expectedSecret = typeof ADMIN_SECRET !== 'undefined' ? ADMIN_SECRET : "SunYatSen1911";
        
        async function hashSecret(secret) {
            const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
            return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
        }
        const expectedHash = await hashSecret(expectedSecret);

        /* [GET] Retrieve current config */
        if (request.method === "GET") {
            const adminKeyParam = url.searchParams.get('admin_key');
            if (adminKeyParam !== expectedHash) {
                return new Response(JSON.stringify({ error: "Unauthorized." }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
            }

            const whitelistMode = await MEMORIAL_KV.get("WHITELIST_MODE_ENABLED");
            
            let baseWordsCount = FALLBACK_BANNED_WORDS.length;
            const kvBannedWords = await MEMORIAL_KV.get("BANNED_WORDS_DICT");
            if (kvBannedWords) {
                try {
                    const parsed = JSON.parse(kvBannedWords);
                    if (Array.isArray(parsed)) baseWordsCount = parsed.length;
                } catch (e) {}
            }

            let privateWordsCount = 0;
            const kvPrivateWords = await MEMORIAL_KV.get("PRIVATE_BANNED_WORDS");
            if (kvPrivateWords) {
                try {
                    const parsed = JSON.parse(kvPrivateWords);
                    if (Array.isArray(parsed)) privateWordsCount = parsed.length;
                } catch (e) {}
            }

            let aiConfig = { enabled: false, models: [] };
            const kvAiConfig = await MEMORIAL_KV.get("AI_CONFIG");
            if (kvAiConfig) {
                try { aiConfig = JSON.parse(kvAiConfig); } catch(e){}
            }

            let llmBannedWordsList = [];
            const kvLlmWords = await MEMORIAL_KV.get("LLM_BANNED_WORDS");
            if (kvLlmWords) {
                try {
                    const parsed = JSON.parse(kvLlmWords);
                    if (Array.isArray(parsed)) llmBannedWordsList = parsed;
                } catch(e) {}
            }

            return new Response(JSON.stringify({ 
                whitelistMode: whitelistMode === "true",
                baseWordsCount: baseWordsCount,
                privateWordsCount: privateWordsCount,
                aiConfig: aiConfig,
                llmBannedWordsList: llmBannedWordsList
            }), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        /* [POST] Update config */
        if (request.method === "POST") {
            const body = await request.json();
            const { admin_key, whitelistMode, baseBannedWords, privateBannedWords, aiConfig, clearLlmBlacklist } = body;

            if (admin_key !== expectedHash) {
                return new Response(JSON.stringify({ error: "Unauthorized." }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
            }

            if (typeof whitelistMode === 'boolean') {
                await MEMORIAL_KV.put("WHITELIST_MODE_ENABLED", whitelistMode ? "true" : "false");
            }
            if (Array.isArray(baseBannedWords)) {
                await MEMORIAL_KV.put("BANNED_WORDS_DICT", JSON.stringify(baseBannedWords));
            }
            if (Array.isArray(privateBannedWords)) {
                await MEMORIAL_KV.put("PRIVATE_BANNED_WORDS", JSON.stringify(privateBannedWords));
            }
            if (aiConfig) {
                await MEMORIAL_KV.put("AI_CONFIG", JSON.stringify(aiConfig));
            }
            if (clearLlmBlacklist === true) {
                await MEMORIAL_KV.delete("LLM_BANNED_WORDS");
            }

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

async function checkDanmakuWithAI(text, msgId, aiConfig) {
    try {
        if (!aiConfig.models || aiConfig.models.length === 0) return;
        const modelObj = aiConfig.models[Math.floor(Math.random() * aiConfig.models.length)];
        const keysArray = Array.isArray(modelObj.keys) ? modelObj.keys : modelObj.keys.split('\\n').map(k => k.trim()).filter(k => k);
        if (keysArray.length === 0) return;
        const key = keysArray[Math.floor(Math.random() * keysArray.length)];
        
        let prompt = "You are a strict content moderator for a public memorial message board. Your job is to strictly filter out offensive language, profanity, and spam. Return a valid JSON object EXACTLY in this format: {\\\"status\\\": \\\"SAFE\\\"} OR {\\\"status\\\": \\\"VIOLATION\\\", \\\"words\\\": [\\\"violating_word_1\\\", \\\"violating_word_2\\\"]}. Text to analyze: " + text;

        if (aiConfig.chinaMode) {
            prompt = "You are a strict content moderator for a public memorial message board. Your job is to strictly filter out offensive language, profanity, spam, and ANY sensitive political discussions, including terms related to 'June 4th', 'Tiananmen', 'Xi Jinping', or other regional political controversies. Return a valid JSON object EXACTLY in this format: {\\\"status\\\": \\\"SAFE\\\"} OR {\\\"status\\\": \\\"VIOLATION\\\", \\\"words\\\": [\\\"violating_word_1\\\", \\\"violating_word_2\\\"]}. Text to analyze: " + text;
        }
        
        const res = await fetch(modelObj.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`
            },
            body: JSON.stringify({
                model: modelObj.model,
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: "json_object" }
            })
        });
        if (res.ok) {
            const data = await res.json();
            const replyStr = data.choices?.[0]?.message?.content?.trim() || "{}";
            const reply = JSON.parse(replyStr);
            
            if (reply.status === "VIOLATION" && Array.isArray(reply.words) && reply.words.length > 0) {
                // Delete Danmaku
                let danmakuData = await MEMORIAL_KV.get("DANMAKU_LIST");
                let list = danmakuData ? JSON.parse(danmakuData) : [];
                list = list.filter(item => typeof item === 'object' ? item.id !== msgId : true);
                await MEMORIAL_KV.put("DANMAKU_LIST", JSON.stringify(list));
                
                // Add to LLM Blacklist
                let llmData = await MEMORIAL_KV.get("LLM_BANNED_WORDS");
                let llmList = llmData ? JSON.parse(llmData) : [];
                for (const word of reply.words) {
                    llmList.push({ word: word, original_text: text, time: Date.now() });
                }
                await MEMORIAL_KV.put("LLM_BANNED_WORDS", JSON.stringify(llmList));
            }
        }
    } catch (e) {
        // AI check failed silently
    }
}
