import * as THREE from 'three';

export const generateShoeTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext('2d')!;

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 64;
    bumpCanvas.height = 64;
    const bumpContext = bumpCanvas.getContext('2d')!;

    // Dark shoe color
    const colorVal = 20 + Math.random() * 20;
    context.fillStyle = `rgb(${colorVal}, ${colorVal}, ${colorVal})`;
    context.fillRect(0, 0, canvas.width, canvas.height);
    bumpContext.fillStyle = '#aaaaaa'; // Main shoe part is raised
    bumpContext.fillRect(0, 0, bumpCanvas.width, bumpCanvas.height);
    
    // Subtle noise
    for (let i = 0; i < 1000; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 1;
        context.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.05})`;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
    }
    
    // Sole
    context.fillStyle = `rgba(10, 10, 10, 1)`;
    context.fillRect(0, canvas.height - 5, canvas.width, 5);
    bumpContext.fillStyle = `#666666`; // Sole is lower than main shoe
    bumpContext.fillRect(0, bumpCanvas.height - 5, bumpCanvas.width, 5);


    const map = new THREE.CanvasTexture(canvas);
    const bumpMap = new THREE.CanvasTexture(bumpCanvas);

    return { map, bumpMap };
};
