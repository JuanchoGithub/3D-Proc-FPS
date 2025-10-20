import * as THREE from 'three';

export const generatePantsTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d')!;

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 256;
    bumpCanvas.height = 256;
    const bumpContext = bumpCanvas.getContext('2d')!;

    // Base color - blue for jeans, or khaki/grey
    const colorType = Math.random();
    let baseColor = '#3d5afe'; // Blue
    if (colorType > 0.66) {
        baseColor = '#8d6e63'; // Khaki
    } else if (colorType > 0.33) {
        baseColor = '#616161'; // Grey
    }

    context.fillStyle = baseColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
    bumpContext.fillStyle = '#7f7f7f';
    bumpContext.fillRect(0, 0, bumpCanvas.width, bumpCanvas.height);

    // Denim/fabric texture using noise
    for (let i = 0; i < 15000; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 1;
        const alpha = Math.random() * 0.15;
        context.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
        
        const bumpColor = 127 + (Math.random() - 0.5) * 40;
        bumpContext.fillStyle = `rgb(${bumpColor},${bumpColor},${bumpColor})`;
        bumpContext.beginPath();
        bumpContext.arc(x, y, radius, 0, Math.PI * 2);
        bumpContext.fill();
    }
    
    // Worn-out look
    context.globalAlpha = 0.1;
    const gradient = context.createRadialGradient(canvas.width / 2, canvas.height/2, 10, canvas.width/2, canvas.height/2, 150);
    gradient.addColorStop(0, 'rgba(255,255,255,0.5)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    context.fillStyle = gradient;
    context.fillRect(0,0, canvas.width, canvas.height);
    context.globalAlpha = 1.0;

    const map = new THREE.CanvasTexture(canvas);
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    
    const bumpMap = new THREE.CanvasTexture(bumpCanvas);
    bumpMap.wrapS = THREE.RepeatWrapping;
    bumpMap.wrapT = THREE.RepeatWrapping;
    
    return { map, bumpMap };
};
