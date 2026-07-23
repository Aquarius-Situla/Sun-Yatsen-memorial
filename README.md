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

## PlayCaptcha Integration

The project uses a heavily customized version of `playcaptcha` to prevent spam (e.g., Danmaku abuse). It has been tailored for optimal responsive display across all viewports (including iPhone 12 mini) and features a highly specific deep dark mode overlay that respects system settings even within restricted WebViews.

To integrate this popup Captcha into other HTML pages, follow these requirements:

### 1. HTML Structure
Insert the following modal wrapper at the bottom of the `<body>`:

```html
<div id="captcha-modal-overlay" class="modal-overlay">
    <div class="captcha-modal-content" id="captcha-root"></div>
</div>
```

### 2. Dependencies
Ensure the target page includes the core stylesheet and environment script, and sets the color-scheme meta tag to enforce proper dark mode rendering in iOS WebViews:

```html
<meta name="color-scheme" content="light dark">
<link rel="stylesheet" href="main/style.css?v=1044">
<script src="api/env.js"></script>
<script src="main/script.js?v=1044"></script>
```

### 3. Invocation
The captcha operates as an independent module. Trigger it via JavaScript by calling:
```javascript
showCaptcha();
```
Upon successful human verification, the module automatically unmounts itself to cleanly reset its state and fires `window.onCaptchaSuccess()`. Define this global callback to handle your post-verification logic (e.g., restoring suspended UI elements).

## AI Agent Instructions

When maintaining this project, AI assistants and agents **must** adhere to the following rules:
- **English Comments Only**: All comments, notes, and documentation inside source code files (`.html`, `.js`, `.css`) must be written exclusively in English. Do not write Chinese comments.
- **Block Comments Only**: The use of inline/single-line comments (like `//`) is strictly prohibited. You must use standard block comments (`/* ... */` for JavaScript/CSS and `<!-- ... -->` for HTML).
- **Format Integrity**: Do not translate or alter any strings intended for user display (e.g. Traditional Chinese UI text, banners, toasts) unless explicitly instructed to do so.
- **No Temporary Notes**: Do not commit debugging notes, temporary workarounds, or informal remarks into the codebase. Keep comments professional, focusing on architecture and module boundaries.
- **Temporary Files Management**: Whenever an agent generates temporary files (such as test scripts, data extraction scripts, or debugging outputs), these files MUST be placed under `/temp/[feature_name]/` to keep the root directory clean and manageable.


## Licensing

This project uses a dual-license model:

- **Source code** — Released under the [MIT License](LICENSE).
- **Audiovisual assets** — Music, portraits, and other media remain the property of their respective rights holders. Unauthorized commercial or inappropriate use is strictly prohibited. See [html/pages/about/about_tc.md](html/pages/about/about_tc.md) for the full statement (Traditional Chinese) or [html/pages/about/about_sc.md](html/pages/about/about_sc.md) (Simplified Chinese).

---

*「革命尚未成功，同志仍須努力。」*
