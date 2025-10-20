import * as THREE from 'three';

// Generate procedural textures
export const generateBrickTexture = () => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;
  canvas.width = 512;
  canvas.height = 512;

    const bumpCanvas = document.createElement('canvas');
    const bumpContext = bumpCanvas.getContext('2d')!;
    bumpCanvas.width = 512;
    bumpCanvas.height = 512;

    const brickWidth = 60;
    const brickHeight = 30;
    const mortarWidth = 4;
    const mortarHeight = 4;

    // Color map: Mortar
    context.fillStyle = '#5D4037';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Bump map: Mortar
    bumpContext.fillStyle = '#222222'; // Mortar is low (dark)
    bumpContext.fillRect(0, 0, bumpCanvas.width, bumpCanvas.height);

    const numRows = Math.ceil(canvas.height / (brickHeight + mortarHeight));
    for (let row = 0; row < numRows; row++) {
        const y = row * (brickHeight + mortarHeight);
        const isEvenRow = row % 2 === 0;
        const numBricks = Math.ceil(canvas.width / (brickWidth + mortarWidth));
        
        for (let col = 0; col < numBricks; col++) {
            const x = col * (brickWidth + mortarWidth) + (isEvenRow ? 0 : (brickWidth + mortarWidth) / 2);
            if (x + brickWidth > canvas.width) continue;
            
            // Color map: Brick
            const baseRed = 120 + Math.random() * 60;
            const baseGreen = 50 + Math.random() * 40;
            const baseBlue = 10 + Math.random() * 30;
            const red = Math.floor(Math.max(0, baseRed - Math.random() * 30));
            const green = Math.floor(Math.max(0, baseGreen - Math.random() * 20));
            const blue = Math.floor(Math.max(0, baseBlue - Math.random() * 10));
            context.fillStyle = `rgb(${red}, ${green}, ${blue})`;
            context.fillRect(x, y, brickWidth, brickHeight);
            context.strokeStyle = '#3E2723';
            context.lineWidth = 1 + Math.random();
            context.strokeRect(x, y, brickWidth, brickHeight);

            // Bump map: Brick
            const brickGray = 180 + Math.random() * 40;
            bumpContext.fillStyle = `rgb(${brickGray}, ${brickGray}, ${brickGray})`;
            bumpContext.fillRect(x, y, brickWidth, brickHeight);

            if (Math.random() < 0.3) {
                const numPatches = 1 + Math.floor(Math.random() * 3);
                for (let p = 0; p < numPatches; p++) {
                    const mx = x + Math.random() * brickWidth;
                    const my = y + Math.random() * brickHeight;
                    const msize = 2 + Math.random() * 6;
                    context.globalAlpha = 0.4;
                    context.fillStyle = `hsl(${80 + Math.random() * 40}, 40%, ${15 + Math.random() * 25}%)`;
                    context.beginPath();
                    context.arc(mx, my, msize, 0, 2 * Math.PI);
                    context.fill();
                }
                context.globalAlpha = 1.0;
            }
        }
    }

    // Cracks
    context.globalAlpha = 0.6;
    context.strokeStyle = '#2C1810';
    context.lineWidth = 1 + Math.random() * 1.5;
    bumpContext.strokeStyle = '#000000';
    bumpContext.lineWidth = 1 + Math.random() * 1.5;
    for (let i = 0; i < 15; i++) {
        const startX = Math.random() * canvas.width;
        const startY = Math.random() * canvas.height;
        const endX = startX + (Math.random() - 0.5) * 100;
        const endY = startY + (Math.random() - 0.5) * 100;
        
        context.beginPath();
        context.moveTo(startX, startY);
        let currentX = startX;
        let currentY = startY;
        const steps = 5 + Math.random() * 10;
        for (let j = 0; j < steps; j++) {
            currentX += (endX - startX) / steps + (Math.random() - 0.5) * 10;
            currentY += (endY - startY) / steps + (Math.random() - 0.5) * 10;
            context.lineTo(currentX, currentY);
        }
        context.stroke();
        bumpContext.beginPath();
        bumpContext.moveTo(startX, startY);
        bumpContext.lineTo(endX, endY);
        bumpContext.stroke();
    }
    context.globalAlpha = 1.0;

  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(1, 1);
  
  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(1, 1);
  
  return { map, bumpMap };
};
