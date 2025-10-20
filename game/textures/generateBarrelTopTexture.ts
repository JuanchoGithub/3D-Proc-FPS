import * as THREE from 'three';

export const generateBarrelTopTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d')!;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 256;
    bumpCanvas.height = 256;
    const bumpContext = bumpCanvas.getContext('2d')!;
    bumpContext.fillStyle = '#7f7f7f';
    bumpContext.fillRect(0,0,bumpCanvas.width, bumpCanvas.height);


    // Wood background color
    context.fillStyle = '#a1662f'; 
    context.beginPath();
    context.arc(centerX, centerY, centerX, 0, Math.PI * 2);
    context.fill();
    
    // Draw wood grain rings
    context.strokeStyle = '#694518'; 
    context.lineWidth = 1.5;
    bumpContext.strokeStyle = 'rgba(0,0,0,0.5)';
    bumpContext.lineWidth = 1.5;
    for (let r = 5; r < centerX - 10; r += Math.random() * 8 + 4) {
        const distortion = 1 + (Math.random() - 0.5) * 0.1;
        const angle = Math.random() * Math.PI;
        context.beginPath();
        context.ellipse(centerX, centerY, r, r * distortion, angle, 0, Math.PI * 2);
        context.stroke();
        bumpContext.beginPath();
        bumpContext.ellipse(centerX, centerY, r, r * distortion, angle, 0, Math.PI * 2);
        bumpContext.stroke();
    }
    
    // Draw plank lines
    context.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    context.lineWidth = 3;
    bumpContext.strokeStyle = '#111111';
    bumpContext.lineWidth = 3;
    const plankWidth = 32;
    for (let x = plankWidth; x < canvas.width; x += plankWidth) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, canvas.height);
        context.stroke();
        bumpContext.beginPath();
        bumpContext.moveTo(x, 0);
        bumpContext.lineTo(x, canvas.height);
        bumpContext.stroke();
    }

    // Metal rim
    context.strokeStyle = '#4a4a4a';
    context.lineWidth = 14;
    context.beginPath();
    context.arc(centerX, centerY, centerX - 7, 0, Math.PI * 2);
    context.stroke();
    context.strokeStyle = '#717171'; // highlight
    context.lineWidth = 2;
    context.beginPath();
    context.arc(centerX, centerY, centerX - 13, 0, Math.PI * 2);
    context.stroke();
    
    bumpContext.strokeStyle = '#ffffff';
    bumpContext.lineWidth = 14;
    bumpContext.beginPath();
    bumpContext.arc(centerX, centerY, centerX - 7, 0, Math.PI * 2);
    bumpContext.stroke();

    const map = new THREE.CanvasTexture(canvas);
    const bumpMap = new THREE.CanvasTexture(bumpCanvas);
    return { map, bumpMap };
};
