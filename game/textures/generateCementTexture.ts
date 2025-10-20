import * as THREE from 'three';

export const generateCementTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d')!;

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 512;
    bumpCanvas.height = 512;
    const bumpContext = bumpCanvas.getContext('2d')!;


    // Base grey color
    context.fillStyle = '#9e9e9e';
    context.fillRect(0, 0, canvas.width, canvas.height);
    bumpContext.fillStyle = '#7f7f7f'; // Neutral grey
    bumpContext.fillRect(0, 0, bumpCanvas.width, bumpCanvas.height);

    // Add noise and mottling
    for (let i = 0; i < 20000; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 1.5;
        const color = 140 + Math.floor(Math.random() * 40);
        context.fillStyle = `rgba(${color}, ${color}, ${color}, ${Math.random() * 0.1})`;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();

        const bumpColor = 127 + (Math.random() - 0.5) * 80;
        bumpContext.fillStyle = `rgb(${bumpColor},${bumpColor},${bumpColor})`;
        bumpContext.beginPath();
        bumpContext.arc(x, y, radius, 0, Math.PI * 2);
        bumpContext.fill();
    }

    // Add darker stains
    context.globalAlpha = 0.15;
    for (let i = 0; i < 15; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const sizeX = 20 + Math.random() * 80;
        const sizeY = 20 + Math.random() * 80;
        context.fillStyle = '#616161';
        context.fillRect(x, y, sizeX, sizeY);
    }
    context.globalAlpha = 1.0;

    // Add fine cracks
    context.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    context.lineWidth = 0.5 + Math.random();
    bumpContext.strokeStyle = 'rgba(0, 0, 0, 1)';
    bumpContext.lineWidth = 0.5 + Math.random();
    for (let i = 0; i < 10; i++) {
        const startX = Math.random() * canvas.width;
        const startY = Math.random() * canvas.height;
        context.beginPath();
        context.moveTo(startX, startY);
        context.lineTo(startX + (Math.random() - 0.5) * 80, startY + (Math.random() - 0.5) * 80);
        context.stroke();
        bumpContext.beginPath();
        bumpContext.moveTo(startX, startY);
        bumpContext.lineTo(startX + (Math.random() - 0.5) * 80, startY + (Math.random() - 0.5) * 80);
        bumpContext.stroke();
    }
    
    const map = new THREE.CanvasTexture(canvas);
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(2, 2);

    const bumpMap = new THREE.CanvasTexture(bumpCanvas);
    bumpMap.wrapS = THREE.RepeatWrapping;
    bumpMap.wrapT = THREE.RepeatWrapping;
    bumpMap.repeat.set(2, 2);

    return { map, bumpMap };
};
