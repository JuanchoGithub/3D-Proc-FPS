import * as THREE from 'three';

export const generatePaperTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d')!;

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 256;
    bumpCanvas.height = 256;
    const bumpContext = bumpCanvas.getContext('2d')!;


    // Background paper color
    context.fillStyle = '#d7ccc8'; // Off-white/grey
    context.fillRect(0, 0, canvas.width, canvas.height);
    bumpContext.fillStyle = '#7f7f7f';
    bumpContext.fillRect(0, 0, bumpCanvas.width, bumpCanvas.height);

    // Headline
    context.fillStyle = '#212121';
    context.fillRect(10, 10, canvas.width - 20, 40);

    // Image placeholder
    context.fillStyle = '#757575';
    context.fillRect(20, 60, 120, 100);

    // Text columns
    context.strokeStyle = '#9e9e9e';
    context.lineWidth = 1;
    for (let y = 65; y < 240; y += 4) {
        context.beginPath();
        if (y < 160) {
           context.moveTo(150, y);
           context.lineTo(canvas.width - 20, y);
        } else {
           context.moveTo(20, y);
           context.lineTo(canvas.width - 20, y);
        }
        context.stroke();
    }
    
    // Stains
    context.fillStyle = 'rgba(121, 85, 72, 0.2)';
    context.beginPath();
    context.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 40 + 20, 0, Math.PI * 2);
    context.fill();

    // Add noise for paper texture
    for(let i=0; i < 5000; ++i) {
        const x = Math.random() * bumpCanvas.width;
        const y = Math.random() * bumpCanvas.height;
        const color = 127 + (Math.random() - 0.5) * 20;
        bumpContext.fillStyle = `rgb(${color},${color},${color})`;
        bumpContext.fillRect(x,y,1,1);
    }

    const map = new THREE.CanvasTexture(canvas);
    const bumpMap = new THREE.CanvasTexture(bumpCanvas);
    return { map, bumpMap };
};
