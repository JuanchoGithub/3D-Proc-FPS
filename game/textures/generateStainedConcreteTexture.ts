import * as THREE from 'three';

export const generateStainedConcreteTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d')!;

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 512;
    bumpCanvas.height = 512;
    const bumpContext = bumpCanvas.getContext('2d')!;

    // Base grey color
    context.fillStyle = '#8a8a8a';
    context.fillRect(0, 0, canvas.width, canvas.height);
    bumpContext.fillStyle = '#7f7f7f'; // Neutral grey
    bumpContext.fillRect(0, 0, bumpCanvas.width, bumpCanvas.height);

    // Add noise and mottling
    for (let i = 0; i < 30000; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 2;
        const color = 120 + Math.floor(Math.random() * 40);
        context.fillStyle = `rgba(${color}, ${color}, ${color}, ${Math.random() * 0.15})`;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();

        const bumpColor = 127 + (Math.random() - 0.5) * 60;
        bumpContext.fillStyle = `rgb(${bumpColor},${bumpColor},${bumpColor})`;
        bumpContext.beginPath();
        bumpContext.arc(x, y, radius, 0, Math.PI * 2);
        bumpContext.fill();
    }

    // Add darker stains and grime
    context.globalAlpha = 0.2;
    bumpContext.globalAlpha = 0.3;
    for (let i = 0; i < 40; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const sizeX = 10 + Math.random() * 60;
        const sizeY = 10 + Math.random() * 60;
        context.fillStyle = '#424242';
        context.fillRect(x, y, sizeX, sizeY);
        bumpContext.fillStyle = '#444444'; // Indented
        bumpContext.fillRect(x, y, sizeX, sizeY);
    }
    
    // Add long vertical water stains
    for (let i = 0; i < 15; i++) {
        const x = Math.random() * canvas.width;
        const width = 2 + Math.random() * 4;
        context.fillStyle = `rgba(0, 0, 0, ${0.05 + Math.random() * 0.1})`;
        context.fillRect(x, 0, width, canvas.height);
        bumpContext.fillStyle = `rgba(0, 0, 0, ${0.1 + Math.random() * 0.2})`;
        bumpContext.fillRect(x, 0, width, canvas.height);
    }
    context.globalAlpha = 1.0;
    bumpContext.globalAlpha = 1.0;


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
