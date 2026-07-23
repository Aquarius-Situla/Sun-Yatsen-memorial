/* ============================================================================
 * Apple Watch Style Fireworks (fireworks.js)
 * ============================================================================
 * Renders smooth, vibrant particle fireworks mimicking the watchOS effect.
 * Self-destructs gracefully after 6 seconds to free up resources.
 * ============================================================================ */

(function initFireworks() {
    // 1. Create and inject canvas
    const canvas = document.createElement('canvas');
    canvas.id = 'fireworks-canvas';
    document.body.appendChild(canvas);
    
    const ctx = canvas.getContext('2d', { alpha: true });
    
    let width, height;
    function resize() {
        width = canvas.width = window.innerWidth * (window.devicePixelRatio || 1);
        height = canvas.height = window.innerHeight * (window.devicePixelRatio || 1);
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
    }
    window.addEventListener('resize', resize);
    resize();

    // 2. Particle System Physics
    const particles = [];
    const colors = [
        [255, 60, 150],  // Neon Pink
        [60, 255, 200],  // Neon Cyan
        [255, 220, 50],  // Neon Yellow
        [100, 255, 100], // Neon Green
        [150, 100, 255], // Neon Purple
        [255, 100, 50]   // Neon Orange
    ];

    class Particle {
        constructor(x, y, color) {
            this.x = x;
            this.y = y;
            const angle = Math.random() * Math.PI * 2;
            // WatchOS fireworks have a strong burst velocity
            const speed = (Math.random() * 8 + 4) * (window.devicePixelRatio || 1);
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.friction = 0.93; // Smooth deceleration
            this.gravity = 0.15 * (window.devicePixelRatio || 1);
            this.alpha = 1;
            this.decay = Math.random() * 0.015 + 0.015;
            this.color = color; // [r,g,b]
            // Randomly pick a spark radius
            this.radius = (Math.random() * 2.5 + 1.5) * (window.devicePixelRatio || 1);
        }

        update() {
            this.vx *= this.friction;
            this.vy *= this.friction;
            this.vy += this.gravity;
            this.x += this.vx;
            this.y += this.vy;
            this.alpha -= this.decay;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, ${this.alpha})`;
            ctx.fill();
        }
    }

    // 3. Explosion Logic
    function explode(x, y) {
        // Pick one primary color and a secondary chance
        const baseColor = colors[Math.floor(Math.random() * colors.length)];
        const particleCount = Math.floor(Math.random() * 50 + 90);
        
        for (let i = 0; i < particleCount; i++) {
            // 20% chance to mix a white spark for that glossy Apple look
            const col = Math.random() > 0.8 ? [255, 255, 255] : baseColor;
            particles.push(new Particle(x, y, col));
        }
    }

    const recentExplosions = [];

    function randomExplosion() {
        let x, y;
        let attempts = 0;
        let valid = false;
        
        // Try up to 10 times to find a dispersed location
        while (!valid && attempts < 10) {
            x = Math.random() * width;
            y = Math.random() * (height * 0.7); // Avoid exploding too low
            valid = true;
            
            for (const pos of recentExplosions) {
                const dx = pos.x - x;
                const dy = pos.y - y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                // Ensure new explosion is at least ~150px away from recent ones
                if (dist < 150 * (window.devicePixelRatio || 1)) {
                    valid = false;
                    break;
                }
            }
            attempts++;
        }
        
        // Track this explosion
        recentExplosions.push({x, y});
        if (recentExplosions.length > 3) {
            recentExplosions.shift(); // Remember only the last 3 locations
        }
        
        explode(x, y);
    }

    // 4. Animation Loop
    let animationId;
    let isActive = true;

    function loop() {
        // Create smooth trails by filling with a semi-transparent dark mask
        // We use destination-out or rgba(0,0,0,0.2) based on composite needs.
        // For standard glow, transparent dark is best.
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, width, height);
        
        ctx.globalCompositeOperation = 'lighter'; // Glow effect

        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.update();
            if (p.alpha <= 0) {
                particles.splice(i, 1);
            } else {
                p.draw();
            }
        }

        animationId = requestAnimationFrame(loop);
    }

    // 5. Lifecycle Management
    let explosionInterval;
    
    function start() {
        loop();
        // Initial burst
        randomExplosion();
        setTimeout(randomExplosion, 400);
        setTimeout(randomExplosion, 800);
        
        // Continuous burst for a short period
        explosionInterval = setInterval(() => {
            if (Math.random() > 0.4) randomExplosion();
        }, 600);

        // Stop creating new fireworks after 5.5 seconds
        setTimeout(() => {
            clearInterval(explosionInterval);
            isActive = false;
        }, 5500);

        // Fade out canvas and destroy completely after 8.5 seconds
        setTimeout(() => {
            canvas.classList.add('fade-out');
        }, 7000);

        setTimeout(() => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', resize);
            if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
        }, 8500);
    }

    start();
})();
