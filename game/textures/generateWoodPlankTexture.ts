import * as THREE from 'three';

export const generateWoodPlankTexture = (isFloor: boolean = false) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d')!;

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 512;
    bumpCanvas.height = 512;
    const bumpContext = bumpCanvas.getContext('2d')!;

    // Base wood color
    context.fillStyle = '#8B5A2B';
    context.fillRect(0, 0, canvas.width, canvas.height);
    bumpContext.fillStyle = '#aaaaaa'; // Raised plank surface
    bumpContext.fillRect(0, 0, bumpCanvas.width, bumpCanvas.height);
    
    const plankHeight = 64;
    for (let y = 0; y < canvas.height; y += plankHeight) {
        // Plank color variation
        const colorOffset = Math.floor(Math.random() * 20) - 10;
        context.fillStyle = `rgb(${139 + colorOffset}, ${90 + colorOffset}, ${43 + colorOffset})`;
        context.fillRect(0, y, canvas.width, plankHeight);
        
        // Wood grain
        context.strokeStyle = `rgba(0, 0, 0, 0.1)`;
        context.lineWidth = 1 + Math.random() * 2;
        bumpContext.strokeStyle = `rgba(0, 0, 0, 0.3)`;
        bumpContext.lineWidth = 1 + Math.random() * 2;
        for (let i = 0; i < 5; i++) {
            const startY = y + Math.random() * plankHeight;
            context.beginPath();
            context.moveTo(0, startY);
            context.bezierCurveTo(
                canvas.width * 0.3, y + Math.random() * plankHeight,
                canvas.width * 0.7, y + Math.random() * plankHeight,
                canvas.width, y + Math.random() * plankHeight
            );
            context.stroke();

            bumpContext.beginPath();
            bumpContext.moveTo(0, startY);
            bumpContext.bezierCurveTo(
                bumpCanvas.width * 0.3, y + Math.random() * plankHeight,
                bumpCanvas.width * 0.7, y + Math.random() * plankHeight,
                bumpCanvas.width, y + Math.random() * plankHeight
            );
            bumpContext.stroke();
        }

        // Knots
        if (Math.random() < 0.2) {
            const knotX = Math.random() * canvas.width;
            const knotY = y + Math.random() * plankHeight;
            const knotRadius = Math.random() * 8 + 4;
            context.fillStyle = 'rgba(0,0,0,0.2)';
            context.beginPath();
            context.arc(knotX, knotY, knotRadius, 0, Math.PI * 2);
            context.fill();

            bumpContext.fillStyle = 'rgba(0,0,0,0.5)';
            bumpContext.beginPath();
            bumpContext.arc(knotX, knotY, knotRadius, 0, Math.PI * 2);
            bumpContext.fill();
        }
        
        // Shadow line between planks
        context.fillStyle = 'rgba(0, 0, 0, 0.4)';
        context.fillRect(0, y - 1, canvas.width, 2);
        bumpContext.fillStyle = 'rgba(0, 0, 0, 1)';
        bumpContext.fillRect(0, y - 1, bumpCanvas.width, 2);
    }
    
    const map = new THREE.CanvasTexture(canvas);
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(isFloor ? 2 : 1, isFloor ? 2 : 1);

    const bumpMap = new THREE.CanvasTexture(bumpCanvas);
    bumpMap.wrapS = THREE.RepeatWrapping;
    bumpMap.wrapT = THREE.RepeatWrapping;
    bumpMap.repeat.set(isFloor ? 2 : 1, isFloor ? 2 : 1);

    return { map, bumpMap };
}
