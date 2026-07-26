/* ============================================================================
 * Apple Watch Style Fireworks (fireworks.js)
 * ============================================================================
 * Renders smooth, vibrant particle fireworks mimicking the watchOS effect.
 * Self-destructs gracefully after 6 seconds to free up resources.
 * ============================================================================ */

window.triggerFireworks = function() {
    if (document.getElementById('fireworks-canvas')) return; // Prevent multiple overlapping triggers

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

    class Particle {
        constructor(x, y, hsl, finalSpeed, angle) {
            this.x = x;
            this.y = y;
            
            // Scale up on larger screens (PC)
            const scale = window.innerWidth > 768 ? 1.8 : 1;
            
            const speed = finalSpeed * (window.devicePixelRatio || 1) * scale;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.friction = 0.93; // Smooth deceleration
            this.gravity = 0.15 * (window.devicePixelRatio || 1) * scale;
            this.alpha = 1;
            this.decay = Math.random() * 0.015 + 0.015;
            this.hsl = hsl; // [hue, saturation, lightness]
            this.radius = (Math.random() * 2.5 + 1.5) * (window.devicePixelRatio || 1) * scale;
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
            
            let l = this.hsl[2];
            
            if (this.alpha > 0.8) {
                // Flash white initially for ignition
                l += (this.alpha - 0.8) * 200;
            }
            
            ctx.fillStyle = `hsla(${this.hsl[0]}, ${this.hsl[1]}%, ${l}%, ${this.alpha})`;
            ctx.fill();
        }
    }

    // 3. Explosion Logic
    function explode(x, y) {
        // Pick THREE base hues for a richer radial gradient (e.g. Center -> Middle -> Edge)
        const hueA = Math.random() * 360;
        const hueB = hueA + (Math.random() * 60 + 30) * (Math.random() > 0.5 ? 1 : -1);
        const hueC = hueB + (Math.random() * 60 + 30) * (Math.random() > 0.5 ? 1 : -1);
        
        // Single cohesive explosion
        const count = Math.floor(Math.random() * 100 + 120);
        
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            
            // Bias the distribution towards the outer edge using Math.pow
            const normalizedRadius = Math.pow(Math.random(), 0.6); 
            
            // Map the normalized radius to a speed (from 1 to 10)
            const finalSpeed = 1 + normalizedRadius * 9;
            
            // Interpolate hue across 3 colors based on radius
            let h;
            if (normalizedRadius < 0.5) {
                const t = normalizedRadius * 2; // 0 to 1
                h = hueA * (1 - t) + hueB * t;
            } else {
                const t = (normalizedRadius - 0.5) * 2; // 0 to 1
                h = hueB * (1 - t) + hueC * t;
            }
            
            h += (Math.random() - 0.5) * 10; // Tiny organic variance
            
            // 10% chance of pure white spark
            const hsl = Math.random() > 0.9 ? [0, 0, 100] : [h % 360, 100, 60];
            particles.push(new Particle(x, y, hsl, finalSpeed, angle));
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
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
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
};
