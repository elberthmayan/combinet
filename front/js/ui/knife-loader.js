/**
 * Renderiza e anima uma faca de chef ultrarrealista e cenouras usando a API de Canvas 2D.
 * @param {HTMLCanvasElement} canvas - O elemento canvas onde a animação será desenhada.
 */
export function renderKnifeAnimation(canvas) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width = 300;
    const height = canvas.height = 200;

    function draw() {
        ctx.clearRect(0, 0, width, height);

        // --- Tábua de corte com textura de madeira ---
        const boardGradient = ctx.createLinearGradient(0, height - 90, 0, height);
        boardGradient.addColorStop(0, '#d4a373');
        boardGradient.addColorStop(1, '#a17a48');
        ctx.fillStyle = boardGradient;
        ctx.strokeStyle = '#6f4e24';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(10, height - 90);
        ctx.lineTo(width - 10, height - 90);
        ctx.quadraticCurveTo(width, height - 90, width, height - 80);
        ctx.lineTo(width, height - 10);
        ctx.quadraticCurveTo(width, height, width - 10, height);
        ctx.lineTo(10, height);
        ctx.quadraticCurveTo(0, height, 0, height - 10);
        ctx.lineTo(0, height - 80);
        ctx.quadraticCurveTo(0, height - 90, 10, height - 90);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // --- Cenoura detalhada ---
        const carrotBody = new Path2D("M80,145 Q180,135 200,155 L190,165 Q170,155 70,160 Z");
        const carrotGradient = ctx.createLinearGradient(80, 140, 200, 160);
        carrotGradient.addColorStop(0, '#f39c12');
        carrotGradient.addColorStop(1, '#e67e22');
        ctx.fillStyle = carrotGradient;
        ctx.strokeStyle = '#d35400';
        ctx.lineWidth = 2;
        ctx.fill(carrotBody);
        ctx.stroke(carrotBody);

        // --- Fatias dinâmicas ---
        const sliceCount = 3;
        for (let i = 0; i < sliceCount; i++) {
            const progress = (performance.now() / 900 + i * 0.33) % 1;
            if (progress > 0.5 && progress < 0.8) {
                ctx.save();
                const jumpX = 190 + (progress - 0.5) * 60;
                const jumpY = height - 55 - Math.sin((progress - 0.5) * Math.PI / 0.3) * 50;
                ctx.translate(jumpX, jumpY);
                ctx.rotate(progress * Math.PI * 5);
                ctx.fillStyle = '#f5b041';
                ctx.beginPath();
                ctx.ellipse(0, 0, 10, 8, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }
        
        // --- Faca de Chef Realista ---
        ctx.save();
        const pivotX = 250;
        const pivotY = 160;
        const currentAngle = -5 + 20 * Math.sin(performance.now() / 450);
        ctx.translate(pivotX, pivotY);
        ctx.rotate(currentAngle * Math.PI / 180);
        ctx.translate(-pivotX, -pivotY);

        // Lâmina com reflexo
        const blade = new Path2D("M 50,80 L 200,70 L 210,120 L 60,130 Z");
        const bladeGradient = ctx.createLinearGradient(50, 70, 50, 130);
        bladeGradient.addColorStop(0, '#f8f8f8');
        bladeGradient.addColorStop(0.5, '#d0d0d0');
        bladeGradient.addColorStop(1, '#f0f0f0');
        ctx.fillStyle = bladeGradient;
        ctx.strokeStyle = '#a0a0a0';
        ctx.lineWidth = 1;
        ctx.fill(blade);
        ctx.stroke(blade);
        
        // Cabo de madeira
        const handle = new Path2D("M 210,120 L 220,115 L 280,135 L 270,145 Z");
        const handleGradient = ctx.createLinearGradient(210, 115, 280, 145);
        handleGradient.addColorStop(0, '#8b6c4b');
        handleGradient.addColorStop(1, '#5a3a1a');
        ctx.fillStyle = handleGradient;
        ctx.strokeStyle = '#4a2a0a';
        ctx.lineWidth = 1.5;
        ctx.fill(handle);
        ctx.stroke(handle);

        // Rebites metálicos no cabo
        ctx.fillStyle = '#e0e0e0';
        ctx.beginPath();
        ctx.arc(225, 122, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(255, 132, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();

        requestAnimationFrame(draw);
    }

    draw();
}

