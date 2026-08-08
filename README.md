# 私立中山紀念堂

A client-side memorial web application for Dr. Sun Yat-sen and the pioneers of the Chinese Republican revolution. The project serves as both a commemorative platform and a technical exploration of multimedia playback, immersive interaction, and responsive design without framework dependencies.

---

## Features

- **Ritual interaction** — Ceremony prompt guiding visitors to bow before the presidential portrait, with sequential music playback tied to the interaction.
- **Contextual audio** — Background music automatically switches based on the current date or active memorial event page.
- **Republican calendar** — Displays the current date in the Republic of China (Minguo) era in the navigation bar.
- **PWA support** — Full Web App Manifest, iOS splash screens, and `apple-touch-icon` for a native-like experience on mobile and desktop.
- **Historical content** — Includes Sun Yat-sen's last will, biographical timelines, and dedicated memorial event pages with associated music.
- **Danmaku commentary** — Live bullet-comment overlay backed by Cloudflare Workers KV with rate limiting and backend content filtering.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5 / Vanilla CSS3 / Vanilla JavaScript |
| Backend | Cloudflare Workers + KV |
| Deployment | Docker + Nginx |

## Directory Structure

```
sys-memorial/
├── html/
│   ├── index.html              # Application entry point
│   ├── api/                    # Runtime environment configuration (env.js)
│   ├── archive/                # Assets not in active use
│   ├── events/                 # Memorial event pages
│   │   ├── whampoa/            # Whampoa Military Academy founding anniversary
│   │   ├── militaries/         # Victory of the War of Resistance anniversary
│   │   └── yatsen/             # Sun Yat-sen birth / death anniversaries
│   ├── main/                   # Core stylesheet, scripts, and primary assets
│   │   ├── style.css
│   │   ├── script.js
│   │   ├── portrait.jpg
│   │   ├── anthem/             # Default music and album cover
│   │   └── favicon/            # SVG and ICO favicons
│   ├── pages/                  # Secondary pages
│   │   ├── announcement/       # Site status and memorial announcements
│   │   ├── biography/          # Sun Yat-sen biographical timeline
│   │   ├── about/              # About and legal statement
│   │   └── thanks/             # Credits
│   └── webapp/                 # PWA manifest, icons, and iOS splash screens
├── docker-compose.yml
├── temp/                       # Temporary files generated during agent development
├── bugfix/                     # Archive of epic bug post-mortems and lessons learned
├── workers.js                  # Cloudflare Worker source
└── README.md
```

## Deployment

### Docker (Nginx)

```bash
docker-compose up -d
```

The compose file mounts `./html` as a read-only volume served by Nginx.

### Cloudflare Worker

1. Create a new Worker in the Cloudflare dashboard.
2. Bind a KV namespace with the binding name `MEMORIAL_KV`.
3. Deploy `workers.js` to the Worker.
4. Copy `html/api/env.example.js` to `html/api/env.js` and set `WORKER_API` to your Worker URL.

## Admin Dashboard

The project includes a centralized Admin Dashboard for managing platform data, moderation, and AI settings. It features an iOS/macOS-inspired frosted glass aesthetic with deep dark mode support.

- **URL Path**: `/#admin` (Shortcut) or `/pages/admin/index.html` (Full path)
- **Authentication**: Secured by a client-side SHA-256 hashed `admin_key` matching the backend environment variable. Also protected by PlayCaptcha to prevent brute-force attacks.
- **Key Features**:
  - **Danmaku Management**: View, delete, and filter all live comments. Upload and sync `public.json` and `private.json` prohibited word lists directly to the Cloudflare KV store.
  - **AI Matrix Management**: Configure, edit, and delete backend AI personalities.
  - **Platform Settings**: Toggle site-wide announcements, maintenance modes, and other configuration flags.

## Situla Auth SSO Integration

To protect the Admin Dashboard from unauthorized access and enable Single Sign-On (SSO), you can integrate this project with [Situla Auth](https://github.com/Aquarius-Situla/Situla-auth) via Nginx Proxy Manager (NPM).

This setup uses a **Zero-File SSO Injection** technique. The password is injected directly through Nginx Proxy Manager on your protected domain, allowing you to safely deploy public mirrors (e.g., on Vercel or GitHub Pages) without exposing the password. Mirror sites will gracefully fall back to the standard password input screen.

In your Nginx Proxy Manager **Advanced** configuration tab for this site, insert the following:

```nginx
# 1. Define Situla Auth endpoint
location /_auth {
    internal;
    proxy_pass http://situla-auth:3000/verify;
    proxy_pass_request_body off;
    proxy_set_header Content-Length "";
    proxy_set_header X-Original-URI $request_uri;
}

# 2. Redirect unauthenticated users to login
error_page 401 = @error401;
location @error401 {
    # Replace with your actual Situla Auth domain
    return 302 https://auth.example.com/?rd=https://$http_host$request_uri;
}

# 3. Virtual SSO Injection (Replace YOUR_PASSWORD with the actual admin password)
location = /api/sso_key {
    auth_request /_auth;
    default_type application/json;
    return 200 '{"key": "YOUR_PASSWORD"}';
}

# 4. Protect the admin dashboard files
location /pages/admin/ {
    auth_request /_auth;
    proxy_pass $forward_scheme://$server:$port;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# 5. Quick Shortcut: Redirect /admin to /pages/admin/
location = /admin {
    return 301 /pages/admin/;
}
```

Once configured, accessing `/admin` will automatically redirect you to Situla Auth for verification. After logging in, the frontend will transparently fetch the injected SSO key and log you in instantly.

### Protecting the Entire Site (with PWA/Icon Whitelist)

If you want to protect the **entire memorial site** with SSO but ensure iOS devices and browsers can still load the `apple-touch-icon`, splash screens, and `manifest.json` (so the app can be added to the home screen without being blocked), use this configuration in NPM's Advanced tab instead:

```nginx
# 1. Define Situla Auth endpoint
location /_auth {
    internal;
    proxy_pass http://situla-auth:3000/verify;
    proxy_pass_request_body off;
    proxy_set_header Content-Length "";
    proxy_set_header X-Original-URI $request_uri;
}

# 2. Redirect unauthenticated users to login
error_page 401 = @error401;
location @error401 {
    # Replace auth.aquarius2009.me with your Situla Auth domain
    return 302 https://auth.aquarius2009.me/?rd=$scheme://$http_host$request_uri;
}

# 3. Whitelist Apple icons, splash screens, and WebApp Manifest (Bypass Auth)
location ~* ^/(webapp/|main/favicon/|favicon\.ico) {
    proxy_pass $forward_scheme://$server:$port;
    proxy_set_header Host $host;
}

# 4. Protect the rest of the entire site
location / {
    auth_request /_auth;
    proxy_pass $forward_scheme://$server:$port;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

> [!NOTE]
> Currently, Situla Auth relies on Zero-File SSO Injection via Nginx Proxy Manager headers. Future updates to Situla Auth will include native **OIDC (OpenID Connect)** support, offering an alternative standards-based integration method.

## PlayCaptcha Integration

The project uses a heavily customized version of `playcaptcha` to prevent spam and automated attacks (e.g., Danmaku abuse, brute-force logins). It has been tailored for optimal responsive display and features a highly specific deep dark mode overlay that respects system settings even within restricted WebViews.

To ensure maximum stability and avoid script loading conflicts, the Captcha must be integrated using the **isolated iframe method**. 

To add the Captcha to any new page, follow these steps:

### 1. HTML Structure
Insert the following modal wrapper at the bottom of the `<body>`. Ensure the `src` path correctly points to the `html/captcha/index.html` file relative to your page.

```html
<div id="captcha-modal-overlay" class="modal-overlay" style="display: none; align-items: center; justify-content: center; z-index: 9999;">
    <div class="captcha-modal-content" style="background: transparent; width: 440px; height: 620px; display: flex; justify-content: center; align-items: center;">
        <iframe id="captcha-iframe" src="../../captcha/index.html" style="border: none; width: 100%; height: 100%; border-radius: 14px; background: transparent;" allowtransparency="true"></iframe>
    </div>
</div>
```

### 2. Invocation & Event Listener
In your page's JavaScript, you do not need to dynamically load any React scripts. Simply show the overlay, reload the iframe (to reset the game state), and listen for the `CAPTCHA_SUCCESS` message.

```javascript
let captchaSuccessCallback = null;

// 1. Listen for the success signal from the iframe
window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CAPTCHA_SUCCESS') {
        const overlay = document.getElementById('captcha-modal-overlay');
        if (overlay) overlay.style.display = 'none';
        
        // Execute callback
        if (captchaSuccessCallback) {
            const cb = captchaSuccessCallback;
            captchaSuccessCallback = null;
            setTimeout(cb, 300);
        }
    }
});

// 2. Trigger the Captcha
function showCaptcha(onSuccess) {
    const overlay = document.getElementById('captcha-modal-overlay');
    const iframe = document.getElementById('captcha-iframe');
    if (!overlay || !iframe) return;
    
    captchaSuccessCallback = onSuccess;
    
    // Reload the iframe to ensure a fresh Captcha session
    iframe.src = iframe.src;
    overlay.style.display = 'flex';
}
```

## Danmaku Filter (Prohibited Words)

The Danmaku system uses a robust backend filter to prevent inappropriate content. The prohibited words are managed via two JSON files: `public.json` and `private.json`.

> [!WARNING]
> Placing or modifying these `.json` files inside the local `/html/api/prohibited_words/` directory **has no effect on the live system**. The local directory is strictly for archival and reference purposes.

To enforce the prohibited words filter, the lists must be synchronized with the Cloudflare Worker KV store. You must manually upload these files via the Admin Dashboard:
1. Log into the Memorial Admin Dashboard.
2. Navigate to the **Danmaku Management** (彈幕管理) section.
3. Use the upload interface to upload your latest `public.json` and `private.json` files to the backend KV namespace.

## AI Agent Instructions

When maintaining this project, AI assistants and agents **must** adhere to the following rules:
- **English Comments Only**: All comments, notes, and documentation inside source code files (`.html`, `.js`, `.css`) must be written exclusively in English. Do not write Chinese comments.
- **Block Comments Only**: The use of inline/single-line comments (like `//`) is strictly prohibited. You must use standard block comments (`/* ... */` for JavaScript/CSS and `<!-- ... -->` for HTML).
- **Format Integrity**: Do not translate or alter any strings intended for user display (e.g. Traditional Chinese UI text, banners, toasts) unless explicitly instructed to do so.
- **No Temporary Notes**: Do not commit debugging notes, temporary workarounds, or informal remarks into the codebase. Keep comments professional, focusing on architecture and module boundaries.
- **Temporary Files Management**: Whenever an agent generates temporary files (such as test scripts, data extraction scripts, or debugging outputs), these files MUST be placed under `/temp/[feature_name]/` to keep the root directory clean and manageable.
- **Captcha Integration (CRITICAL)**: **NEVER** attempt to dynamically inject React/ReactDOM UMD scripts to render the Captcha on a page, as it causes severe dependency conflicts, styling bugs, and race conditions. **ALWAYS** use the isolated `iframe` method exactly as documented in the `PlayCaptcha Integration` section above. Do not alter the `captcha/index.html` file unless specifically requested.


## Open Source Acknowledgements

This project utilizes the following open-source libraries licensed under the MIT License:

- **zero-md**: Sub-page Markdown rendering engine. Copyright (c) 2018 Jason Lee.
- **github-markdown-css**: Elegant and readable Markdown stylesheet. Copyright (c) Sindre Sorhus.
- **playcaptcha**: Interactive claw machine captcha component. Copyright (c) 2026 iisac.

## Licensing

This project uses a dual-license model:

- **Source code** — Released under the [GNU Affero General Public License v3.0 (AGPLv3)](LICENSE).
- **Audiovisual assets** — Music, portraits, and other media remain the property of their respective rights holders. Unauthorized commercial or inappropriate use is strictly prohibited. See [html/pages/about/about_tc.md](html/pages/about/about_tc.md) for the full statement (Traditional Chinese) or [html/pages/about/about_sc.md](html/pages/about/about_sc.md) (Simplified Chinese).

---

*「革命尚未成功，同志仍須努力。」*
