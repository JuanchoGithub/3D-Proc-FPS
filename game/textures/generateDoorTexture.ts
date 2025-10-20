import * as THREE from 'three';

export const generateDoorTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 512; // Taller for door shape
    const context = canvas.getContext('2d')!;

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 256;
    bumpCanvas.height = 512;
    const bumpContext = bumpCanvas.getContext('2d')!;

    // Base metal color
    context.fillStyle = '#455a64';
    context.fillRect(0, 0, canvas.width, canvas.height);
    bumpContext.fillStyle = '#888888';
    bumpContext.fillRect(0, 0, bumpCanvas.width, bumpCanvas.height);


    // Frame
    context.strokeStyle = '#263238';
    context.lineWidth = 16;
    context.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
    
    bumpContext.strokeStyle = '#ffffff';
    bumpContext.lineWidth = 4;
    bumpContext.strokeRect(14, 14, canvas.width - 28, canvas.height - 28);
    bumpContext.strokeStyle = '#000000';
    bumpContext.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    // Hazard stripes
    context.save();
    context.beginPath();
    context.moveTo(0, canvas.height * 0.4);
    context.lineTo(canvas.width, canvas.height * 0.4);
    context.lineTo(canvas.width, canvas.height * 0.6);
    context.lineTo(0, canvas.height * 0.6);
    context.closePath();
    context.clip();

    context.lineWidth = 30;
    for (let i = -canvas.width; i < canvas.width * 2; i += 60) {
        context.strokeStyle = '#fdd835'; // Yellow
        context.beginPath();
        context.moveTo(i, -50);
        context.lineTo(i + canvas.height, canvas.height + 50);
        context.stroke();
    }
    context.restore();

    // Grime and scratches
    context.globalAlpha = 0.15;
    bumpContext.globalAlpha = 0.4;
    for (let i = 0; i < 200; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = 10 + Math.random() * 40;
        context.fillStyle = 'rgba(0,0,0,0.5)';
        context.fillRect(x, y, size, size);
        bumpContext.fillStyle = 'rgba(0,0,0,1)';
        bumpContext.fillRect(x, y, size, 1);
    }
    context.globalAlpha = 1.0;
    bumpContext.globalAlpha = 1.0;

    const map = new THREE.CanvasTexture(canvas);
    const bumpMap = new THREE.CanvasTexture(bumpCanvas);

    return { map, bumpMap };
};
