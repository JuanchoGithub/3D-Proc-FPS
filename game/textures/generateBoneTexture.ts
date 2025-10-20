import * as THREE from 'three';

export const generateBoneTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d')!;

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 256;
    bumpCanvas.height = 256;
    const bumpContext = bumpCanvas.getContext('2d')!;

    // Base bone color
    context.fillStyle = '#e0d5b1';
    context.fillRect(0, 0, canvas.width, canvas.height);
    bumpContext.fillStyle = '#7f7f7f'; // Neutral grey
    bumpContext.fillRect(0, 0, bumpCanvas.width, bumpCanvas.height);

    // Add noise and mottling for an aged look
    for (let i = 0; i < 10000; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 1.5;
        const colorVal = 180 + Math.floor(Math.random() * 40);
        const alpha = Math.random() * 0.1;
        context.fillStyle = `rgba(${colorVal}, ${colorVal - 10}, ${colorVal - 30}, ${alpha})`;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
        
        const bumpColor = 127 + (Math.random() - 0.5) * 50;
        bumpContext.fillStyle = `rgb(${bumpColor},${bumpColor},${bumpColor})`;
        bumpContext.beginPath();
        bumpContext.arc(x, y, radius, 0, Math.PI * 2);
        bumpContext.fill();
    }

    // Add fine cracks
    context.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    context.lineWidth = 0.5 + Math.random() * 0.5;
    bumpContext.strokeStyle = 'rgba(0, 0, 0, 1)';
    bumpContext.lineWidth = 0.5 + Math.random() * 0.5;
    for (let i = 0; i < 15; i++) {
        const startX = Math.random() * canvas.width;
        const startY = Math.random() * canvas.height;
        const endX = startX + (Math.random() - 0.5) * 40;
        const endY = startY + (Math.random() - 0.5) * 40;
        context.beginPath();
        context.moveTo(startX, startY);
        context.lineTo(endX, endY);
        context.stroke();
        bumpContext.beginPath();
        bumpContext.moveTo(startX, startY);
        bumpContext.lineTo(endX, endY);
        bumpContext.stroke();
    }
    
    // Add darker stains
    context.globalAlpha = 0.1;
    bumpContext.globalAlpha = 0.2;
    for (let i = 0; i < 10; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const sizeX = 10 + Math.random() * 40;
        const sizeY = 10 + Math.random() * 40;
        context.fillStyle = '#6d5a3a';
        context.fillRect(x, y, sizeX, sizeY);
        bumpContext.fillStyle = '#444444'; // Indented stains
        bumpContext.fillRect(x, y, sizeX, sizeY);
    }
    context.globalAlpha = 1.0;
    bumpContext.globalAlpha = 1.0;

    const map = new THREE.CanvasTexture(canvas);
    const bumpMap = new THREE.CanvasTexture(bumpCanvas);
    return { map, bumpMap };
};
