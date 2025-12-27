class ParticleSystem {
    constructor(canvasId) {
        // Use the same canvas helper or overlay? 
        // Ideally, we draw on the same canvas as the board to keep it simple.
        // But the BoardRenderer clears the canvas.
        // So we should pass the ctx to the drawing method.
        this.particles = [];
    }

    spawn(x, y, color, type) {
        let count = 10;
        let speed = 2;
        let life = 30;

        if (type === 'explosion') {
            count = 30;
            speed = 4;
            life = 50;
        } else if (type === 'sparkle') {
            count = 15;
            speed = 1.5;
            life = 40;
        } else if (type === 'trail') {
            count = 3;
            speed = 0.5;
            life = 15;
        }

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const velocity = Math.random() * speed;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity,
                alpha: 1,
                color: color,
                life: life,
                maxLife: life,
                type: type
            });
        }
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            p.alpha = p.life / p.maxLife;

            if (p.type === 'sparkle') {
                p.vy -= 0.05; // float up
            }

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        ctx.save();
        for (const p of this.particles) {
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.type === 'trail' ? 2 : 3, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}
