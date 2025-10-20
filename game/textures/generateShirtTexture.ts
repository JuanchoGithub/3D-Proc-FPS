import * as THREE from 'three';

export const generateShirtTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d')!;

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 256;
    bumpCanvas.height = 256;
    const bumpContext = bumpCanvas.getContext('2d')!;

    // Random base color
    const hue = Math.random() * 360;
    const saturation = 50 + Math.random() * 30;
    const lightness = 40 + Math.random() * 20;
    const baseColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    context.fillStyle = baseColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
    bumpContext.fillStyle = '#7f7f7f';
    bumpContext.fillRect(0, 0, bumpCanvas.width, bumpCanvas.height);


    const patternType = Math.random();

    if (patternType < 0.33) { // Vertical Stripes
        const stripeColor = `hsl(${hue}, ${saturation}%, ${lightness - 20}%)`;
        context.strokeStyle = stripeColor;
        context.lineWidth = Math.random() * 10 + 5;
        bumpContext.strokeStyle = '#555555';
        bumpContext.lineWidth = context.lineWidth;
        for (let x = 0; x < canvas.width; x += Math.random() * 30 + 15) {
            context.beginPath();
            context.moveTo(x, 0);
            context.lineTo(x, canvas.height);
            context.stroke();
            bumpContext.beginPath();
            bumpContext.moveTo(x, 0);
            bumpContext.lineTo(x, canvas.height);
            bumpContext.stroke();
        }
    } else if (patternType < 0.66) { // Horizontal Stripes
        const stripeColor = `hsl(${hue}, ${saturation}%, ${lightness + 20}%)`;
        context.strokeStyle = stripeColor;
        context.lineWidth = Math.random() * 10 + 5;
        bumpContext.strokeStyle = '#aaaaaa';
        bumpContext.lineWidth = context.lineWidth;
        for (let y = 0; y < canvas.height; y += Math.random() * 30 + 15) {
            context.beginPath();
            context.moveTo(0, y);
            context.lineTo(canvas.width, y);
            context.stroke();
            bumpContext.beginPath();
            bumpContext.moveTo(0, y);
            bumpContext.lineTo(canvas.width, y);
            bumpContext.stroke();
        }
    }
    // else: solid color, which is already drawn

    // Add some noise/grime
    for (let i = 0; i < 5000; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 1.5;
        context.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.05})`;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();

        const bumpColor = 127 + (Math.random() - 0.5) * 30;
        bumpContext.fillStyle = `rgb(${bumpColor},${bumpColor},${bumpColor})`;
        bumpContext.beginPath();
        bumpContext.arc(x, y, radius, 0, Math.PI * 2);
        bumpContext.fill();
    }


    const map = new THREE.CanvasTexture(canvas);
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;

    const bumpMap = new THREE.CanvasTexture(bumpCanvas);
    bumpMap.wrapS = THREE.RepeatWrapping;
    bumpMap.wrapT = THREE.RepeatWrapping;
    
    return { map, bumpMap };
};
