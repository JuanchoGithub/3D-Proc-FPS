import * as THREE from 'three';

export const generateStoneWallTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d')!;

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 512;
    bumpCanvas.height = 512;
    const bumpContext = bumpCanvas.getContext('2d')!;
    
    // Mortar background
    context.fillStyle = '#4e342e';
    context.fillRect(0, 0, canvas.width, canvas.height);
    bumpContext.fillStyle = '#222222'; // Mortar is low
    bumpContext.fillRect(0, 0, bumpCanvas.width, bumpCanvas.height);


    // Draw stones
    for(let i=0; i < 80; i++) {
        const w = 40 + Math.random() * 80;
        const h = 30 + Math.random() * 50;
        const x = Math.random() * canvas.width - w/2;
        const y = Math.random() * canvas.height - h/2;
        const colorVal = 80 + Math.random() * 40;
        context.fillStyle = `rgb(${colorVal}, ${colorVal}, ${colorVal})`;
        
        // Rounded rect for stone shape
        const r = 10;
        context.beginPath();
        context.moveTo(x + r, y);
        context.lineTo(x + w - r, y);
        context.quadraticCurveTo(x + w, y, x + w, y + r);
        context.lineTo(x + w, y + h - r);
        context.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        context.lineTo(x + r, y + h);
        context.quadraticCurveTo(x, y + h, x, y + h - r);
        context.lineTo(x, y + r);
        context.quadraticCurveTo(x, y, x + r, y);
        context.closePath();
        context.fill();

        // Add a subtle shadow
        context.strokeStyle = 'rgba(0,0,0,0.3)';
        context.lineWidth = 2;
        context.stroke();

        // Bump map for stone
        const bumpColor = 150 + Math.random() * 80;
        bumpContext.fillStyle = `rgb(${bumpColor},${bumpColor},${bumpColor})`;
        bumpContext.beginPath();
        bumpContext.moveTo(x + r, y);
        bumpContext.lineTo(x + w - r, y);
        bumpContext.quadraticCurveTo(x + w, y, x + w, y + r);
        bumpContext.lineTo(x + w, y + h - r);
        bumpContext.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        bumpContext.lineTo(x + r, y + h);
        bumpContext.quadraticCurveTo(x, y + h, x, y + h - r);
        bumpContext.lineTo(x, y + r);
        bumpContext.quadraticCurveTo(x, y, x + r, y);
        bumpContext.closePath();
        bumpContext.fill();
    }
    
    // Moss (re-using logic from bricks)
    context.globalAlpha = 0.4;
    for (let i = 0; i < 100; i++) {
        const mossX = Math.random() * canvas.width;
        const mossY = Math.random() * canvas.height;
        const mossSize = 3 + Math.random() * 10;
        context.fillStyle = `hsl(${80 + Math.random() * 40}, 40%, ${15 + Math.random() * 25}%)`;
        context.beginPath();
        context.arc(mossX, mossY, mossSize, 0, 2 * Math.PI);
        context.fill();
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
