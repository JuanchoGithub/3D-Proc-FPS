import * as THREE from 'three';

export const generateMetalPanelTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d')!;

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 512;
    bumpCanvas.height = 512;
    const bumpContext = bumpCanvas.getContext('2d')!;

    // Base metal color
    context.fillStyle = '#546e7a';
    context.fillRect(0, 0, canvas.width, canvas.height);
    bumpContext.fillStyle = '#cccccc'; // Raised panel
    bumpContext.fillRect(0, 0, bumpCanvas.width, bumpCanvas.height);


    // Panel lines
    context.strokeStyle = '#263238';
    context.lineWidth = 4;
    context.strokeRect(0, 0, canvas.width, canvas.height);
    context.beginPath();
    context.moveTo(canvas.width / 2, 0);
    context.lineTo(canvas.width / 2, canvas.height);
    context.stroke();
    context.beginPath();
    context.moveTo(0, canvas.height / 2);
    context.lineTo(canvas.width, canvas.height / 2);
    context.stroke();

    bumpContext.strokeStyle = '#222222';
    bumpContext.lineWidth = 4;
    bumpContext.strokeRect(0, 0, bumpCanvas.width, bumpCanvas.height);
    bumpContext.beginPath();
    bumpContext.moveTo(bumpCanvas.width / 2, 0);
    bumpContext.lineTo(bumpCanvas.width / 2, bumpCanvas.height);
    bumpContext.stroke();
    bumpContext.beginPath();
    bumpContext.moveTo(0, bumpCanvas.height / 2);
    bumpContext.lineTo(bumpCanvas.width, bumpCanvas.height / 2);
    bumpContext.stroke();
    
    // Rivets
    context.fillStyle = '#37474f';
    bumpContext.fillStyle = '#000000';
    const rivetCoords = [15, canvas.width / 2 - 15, canvas.width / 2 + 15, canvas.width - 15];
    for(const x of rivetCoords) {
        for(const y of rivetCoords) {
            context.beginPath();
            context.arc(x, y, 5, 0, Math.PI * 2);
            context.fill();
            bumpContext.beginPath();
            bumpContext.arc(x, y, 5, 0, Math.PI * 2);
            bumpContext.fill();
        }
    }
    
    // Scratches and grime
    context.globalAlpha = 0.3;
    context.strokeStyle = 'rgba(0,0,0,0.5)';
    context.lineWidth = 0.5;
    bumpContext.strokeStyle = 'rgba(0,0,0,1)';
    bumpContext.lineWidth = 0.5;
    for (let i = 0; i < 20; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const endX = x + (Math.random()-0.5)*30;
        const endY = y + (Math.random()-0.5)*30;
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(endX, endY);
        context.stroke();
        bumpContext.beginPath();
        bumpContext.moveTo(x, y);
        bumpContext.lineTo(endX, endY);
        bumpContext.stroke();
    }
    
    // Rust
    for (let i = 0; i < 15; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = 10 + Math.random() * 30;
        context.fillStyle = `rgba(183, 65, 14, ${0.1 + Math.random() * 0.2})`;
        context.beginPath();
        context.arc(x, y, size, 0, Math.PI * 2);
        context.fill();
    }
    context.globalAlpha = 1.0;

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
