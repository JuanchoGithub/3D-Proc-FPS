import * as THREE from 'three';

export const generateDirtTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d')!;

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 512;
    bumpCanvas.height = 512;
    const bumpContext = bumpCanvas.getContext('2d')!;

    // Base dirt color
    context.fillStyle = '#5d4037'; // Dark brown
    context.fillRect(0, 0, canvas.width, canvas.height);
    bumpContext.fillStyle = '#444444'; // Dark base for dirt
    bumpContext.fillRect(0, 0, bumpCanvas.width, bumpCanvas.height);

    // Add noise and texture
    for (let i = 0; i < 40000; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 2;
        const colorVal = 40 + Math.floor(Math.random() * 40);
        const color = `rgba(${colorVal}, ${colorVal - 10}, ${colorVal - 20}, ${Math.random() * 0.2})`;
        context.fillStyle = color;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();

        const bumpColor = 80 + (Math.random() - 0.5) * 60;
        bumpContext.fillStyle = `rgb(${bumpColor},${bumpColor},${bumpColor})`;
        bumpContext.beginPath();
        bumpContext.arc(x, y, radius, 0, Math.PI * 2);
        bumpContext.fill();
    }
    
    // Add pebbles/rocks
    context.globalAlpha = 0.5;
    for (let i = 0; i < 200; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = 1 + Math.random() * 4;
        const colorVal = 80 + Math.random() * 50;
        context.fillStyle = `rgb(${colorVal}, ${colorVal}, ${colorVal})`;
        context.beginPath();
        context.arc(x, y, size, 0, Math.PI * 2);
        context.fill();

        const bumpColor = 180 + Math.random() * 50;
        bumpContext.fillStyle = `rgb(${bumpColor},${bumpColor},${bumpColor})`;
        bumpContext.beginPath();
        bumpContext.arc(x, y, size, 0, Math.PI * 2);
        bumpContext.fill();
    }
    context.globalAlpha = 1.0;

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
