import * as THREE from 'three';

export const generateBarrelTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d')!;

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 256;
    bumpCanvas.height = 256;
    const bumpContext = bumpCanvas.getContext('2d')!;
    bumpContext.fillStyle = '#7f7f7f'; // Neutral grey
    bumpContext.fillRect(0, 0, bumpCanvas.width, bumpCanvas.height);

    // Wood background
    context.fillStyle = '#8B5A2B'; // A wood-like brown
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Draw vertical planks
    const plankWidth = 32;
    for (let x = 0; x < canvas.width; x += plankWidth) {
        // Slightly vary plank color
        const colorOffset = Math.floor(Math.random() * 20) - 10;
        context.fillStyle = `rgb(${139 + colorOffset}, ${90 + colorOffset}, ${43 + colorOffset})`;
        context.fillRect(x, 0, plankWidth, canvas.height);

        // Draw dark lines for gaps
        context.fillStyle = 'rgba(0, 0, 0, 0.5)';
        context.fillRect(x - 1, 0, 2, canvas.height);
        
        // BUMP: Dark lines for gaps
        bumpContext.fillStyle = '#222222'; // Indented
        bumpContext.fillRect(x - 1, 0, 2, bumpCanvas.height);
    }
    
    // Draw metal hoops
    context.fillStyle = '#616161'; // Dark grey for metal
    context.fillRect(0, canvas.height * 0.1, canvas.width, canvas.height * 0.1);
    context.fillRect(0, canvas.height * 0.8, canvas.width, canvas.height * 0.1);

    // BUMP: metal hoops
    bumpContext.fillStyle = '#ffffff'; // Raised high
    bumpContext.fillRect(0, bumpCanvas.height * 0.1, bumpCanvas.width, bumpCanvas.height * 0.1);
    bumpContext.fillRect(0, bumpCanvas.height * 0.8, bumpCanvas.width, bumpCanvas.height * 0.1);


    // Add some highlights/shadows to hoops
    context.fillStyle = 'rgba(255, 255, 255, 0.2)';
    context.fillRect(0, canvas.height * 0.1, canvas.width, 3);
    context.fillStyle = 'rgba(0, 0, 0, 0.2)';
    context.fillRect(0, canvas.height * 0.2 - 3, canvas.width, 3);

    context.fillStyle = 'rgba(255, 255, 255, 0.2)';
    context.fillRect(0, canvas.height * 0.8, canvas.width, 3);
    context.fillStyle = 'rgba(0, 0, 0, 0.2)';
    context.fillRect(0, canvas.height * 0.9 - 3, canvas.width, 3);

    const map = new THREE.CanvasTexture(canvas);
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    
    const bumpMap = new THREE.CanvasTexture(bumpCanvas);
    bumpMap.wrapS = THREE.RepeatWrapping;
    bumpMap.wrapT = THREE.RepeatWrapping;

    return { map, bumpMap };
};
