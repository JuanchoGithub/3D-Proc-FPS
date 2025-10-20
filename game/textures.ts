import * as THREE from 'three';

// Helper to convert a grayscale height map (in a canvas) to a normal map canvas
const createNormalMapFromHeightMap = (heightCanvas: HTMLCanvasElement, strength: number = 1.0) => {
    const context = heightCanvas.getContext('2d', { willReadFrequently: true })!;
    const width = heightCanvas.width;
    const height = heightCanvas.height;
    const srcData = context.getImageData(0, 0, width, height).data;

    const normalCanvas = document.createElement('canvas');
    normalCanvas.width = width;
    normalCanvas.height = height;
    const normalContext = normalCanvas.getContext('2d')!;
    const destImageData = normalContext.createImageData(width, height);
    const destData = destImageData.data;

    const getHeight = (x: number, y: number): number => {
        x = Math.max(0, Math.min(width - 1, x));
        y = Math.max(0, Math.min(height - 1, y));
        return srcData[(y * width + x) * 4] / 255.0;
    };

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const hl = getHeight(x - 1, y);
            const hr = getHeight(x + 1, y);
            const ht = getHeight(x, y - 1);
            const hb = getHeight(x, y + 1);

            const dzx = (hr - hl) * strength;
            const dzy = (hb - ht) * strength;

            const z = 1.0;
            const len = Math.sqrt(dzx * dzx + dzy * dzy + z * z);
            const vecX = dzx / len;
            const vecY = dzy / len;
            const vecZ = z / len;

            const i = (y * width + x) * 4;
            destData[i] = (vecX + 1.0) * 127.5;
            destData[i + 1] = (vecY + 1.0) * 127.5;
            destData[i + 2] = (vecZ + 1.0) * 127.5;
            destData[i + 3] = 255;
        }
    }

    normalContext.putImageData(destImageData, 0, 0);
    return normalCanvas;
};

export const generateBulletDecalTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext('2d')!;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Scorch marks
    const scorchGradient = context.createRadialGradient(centerX, centerY, 10, centerX, centerY, 50);
    scorchGradient.addColorStop(0, 'rgba(40, 30, 20, 0.6)');
    scorchGradient.addColorStop(0.5, 'rgba(40, 30, 20, 0.2)');
    scorchGradient.addColorStop(1, 'rgba(40, 30, 20, 0)');
    context.fillStyle = scorchGradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Central hole
    const holeGradient = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, 8);
    holeGradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
    holeGradient.addColorStop(0.5, 'rgba(10, 10, 10, 1)');
    holeGradient.addColorStop(1, 'rgba(20, 20, 20, 0.5)');
    context.fillStyle = holeGradient;
    context.beginPath();
    context.arc(centerX, centerY, 8, 0, Math.PI * 2);
    context.fill();

    // Cracks
    context.strokeStyle = 'rgba(0, 0, 0, 0.7)';
    context.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
        const angle = Math.random() * Math.PI * 2;
        const length = 10 + Math.random() * 20;
        context.beginPath();
        context.moveTo(centerX, centerY);
        let curX = centerX;
        let curY = centerY;
        for (let j = 0; j < 3; j++) {
            const segAngle = angle + (Math.random() - 0.5) * 0.5;
            const segLength = length / 3;
            curX += Math.cos(segAngle) * segLength;
            curY += Math.sin(segAngle) * segLength;
            context.lineTo(curX, curY);
        }
        context.stroke();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
};


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
        const colorOffset = Math.floor(Math.random() * 20) - 10;
        context.fillStyle = `rgb(${139 + colorOffset}, ${90 + colorOffset}, ${43 + colorOffset})`;
        context.fillRect(x, 0, plankWidth, canvas.height);
        context.fillStyle = 'rgba(0, 0, 0, 0.5)';
        context.fillRect(x - 1, 0, 2, canvas.height);
        bumpContext.fillStyle = '#222222'; // Indented
        bumpContext.fillRect(x - 1, 0, 2, bumpCanvas.height);
    }
    
    // Draw metal hoops
    context.fillStyle = '#616161';
    context.fillRect(0, canvas.height * 0.1, canvas.width, canvas.height * 0.1);
    context.fillRect(0, canvas.height * 0.8, canvas.width, canvas.height * 0.1);
    bumpContext.fillStyle = '#ffffff'; // Raised high
    bumpContext.fillRect(0, bumpCanvas.height * 0.1, bumpCanvas.width, bumpCanvas.height * 0.1);
    bumpContext.fillRect(0, bumpCanvas.height * 0.8, bumpCanvas.width, bumpCanvas.height * 0.1);

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
    
    const normalCanvas = createNormalMapFromHeightMap(bumpCanvas, 4.0);
    const normalMap = new THREE.CanvasTexture(normalCanvas);
    normalMap.wrapS = THREE.RepeatWrapping;
    normalMap.wrapT = THREE.RepeatWrapping;

    return { map, normalMap };
};

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

    context.fillStyle = '#a1662f'; 
    context.beginPath();
    context.arc(centerX, centerY, centerX, 0, Math.PI * 2);
    context.fill();
    
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
    const normalCanvas = createNormalMapFromHeightMap(bumpCanvas, 3.0);
    const normalMap = new THREE.CanvasTexture(normalCanvas);
    return { map, normalMap };
};

export const generateBoneTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d')!;

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 256;
    bumpCanvas.height = 256;
    const bumpContext = bumpCanvas.getContext('2d')!;

    context.fillStyle = '#e0d5b1';
    context.fillRect(0, 0, canvas.width, canvas.height);
    bumpContext.fillStyle = '#7f7f7f';
    bumpContext.fillRect(0, 0, bumpCanvas.width, bumpCanvas.height);

    for (let i = 0; i < 10000; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 1.5;
        const colorVal = 180 + Math.floor(Math.random() * 40);
        const alpha = Math.random() * 0.1;
        context.fillStyle = `rgba(${colorVal}, ${colorVal - 10}, ${colorVal - 30}, ${alpha})`;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
        
        const bumpColor = 127 + (Math.random() - 0.5) * 50;
        bumpContext.fillStyle = `rgb(${bumpColor},${bumpColor},${bumpColor})`;
        bumpContext.beginPath();
        bumpContext.arc(x, y, radius, 0, Math.PI * 2);
        bumpContext.fill();
    }

    context.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    context.lineWidth = 0.5 + Math.random() * 0.5;
    bumpContext.strokeStyle = 'rgba(0, 0, 0, 1)';
    bumpContext.lineWidth = 0.5 + Math.random() * 0.5;
    for (let i = 0; i < 15; i++) {
        const startX = Math.random() * canvas.width;
        const startY = Math.random() * canvas.height;
        const endX = startX + (Math.random() - 0.5) * 40;
        const endY = startY + (Math.random() - 0.5) * 40;
        context.beginPath();
        context.moveTo(startX, startY);
        context.lineTo(endX, endY);
        context.stroke();
        bumpContext.beginPath();
        bumpContext.moveTo(startX, startY);
        bumpContext.lineTo(endX, endY);
        bumpContext.stroke();
    }
    
    context.globalAlpha = 0.1;
    bumpContext.globalAlpha = 0.2;
    for (let i = 0; i < 10; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const sizeX = 10 + Math.random() * 40;
        const sizeY = 10 + Math.random() * 40;
        context.fillStyle = '#6d5a3a';
        context.fillRect(x, y, sizeX, sizeY);
        bumpContext.fillStyle = '#444444';
        bumpContext.fillRect(x, y, sizeX, sizeY);
    }
    context.globalAlpha = 1.0;
    bumpContext.globalAlpha = 1.0;

    const map = new THREE.CanvasTexture(canvas);
    const normalCanvas = createNormalMapFromHeightMap(bumpCanvas, 2.0);
    const normalMap = new THREE.CanvasTexture(normalCanvas);
    return { map, normalMap };
};

export const generateBrickTexture = () => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;
  canvas.width = 512;
  canvas.height = 512;

    const bumpCanvas = document.createElement('canvas');
    const bumpContext = bumpCanvas.getContext('2d')!;
    bumpCanvas.width = 512;
    bumpCanvas.height = 512;

    const brickWidth = 60;
    const brickHeight = 30;
    const mortarWidth = 4;
    const mortarHeight = 4;

    context.fillStyle = '#5D4037';
    context.fillRect(0, 0, canvas.width, canvas.height);
    bumpContext.fillStyle = '#222222';
    bumpContext.fillRect(0, 0, bumpCanvas.width, bumpCanvas.height);

    const numRows = Math.ceil(canvas.height / (brickHeight + mortarHeight));
    for (let row = 0; row < numRows; row++) {
        const y = row * (brickHeight + mortarHeight);
        const isEvenRow = row % 2 === 0;
        const numBricks = Math.ceil(canvas.width / (brickWidth + mortarWidth));
        
        for (let col = 0; col < numBricks; col++) {
            const x = col * (brickWidth + mortarWidth) + (isEvenRow ? 0 : (brickWidth + mortarWidth) / 2);
            if (x + brickWidth > canvas.width) continue;
            
            const baseRed = 120 + Math.random() * 60;
            const baseGreen = 50 + Math.random() * 40;
            const baseBlue = 10 + Math.random() * 30;
            const red = Math.floor(Math.max(0, baseRed - Math.random() * 30));
            const green = Math.floor(Math.max(0, baseGreen - Math.random() * 20));
            const blue = Math.floor(Math.max(0, baseBlue - Math.random() * 10));
            context.fillStyle = `rgb(${red}, ${green}, ${blue})`;
            context.fillRect(x, y, brickWidth, brickHeight);
            context.strokeStyle = '#3E2723';
            context.lineWidth = 1 + Math.random();
            context.strokeRect(x, y, brickWidth, brickHeight);

            const brickGray = 180 + Math.random() * 40;
            bumpContext.fillStyle = `rgb(${brickGray}, ${brickGray}, ${brickGray})`;
            bumpContext.fillRect(x, y, brickWidth, brickHeight);

            if (Math.random() < 0.3) {
                const numPatches = 1 + Math.floor(Math.random() * 3);
                for (let p = 0; p < numPatches; p++) {
                    const mx = x + Math.random() * brickWidth;
                    const my = y + Math.random() * brickHeight;
                    const msize = 2 + Math.random() * 6;
                    context.globalAlpha = 0.4;
                    context.fillStyle = `hsl(${80 + Math.random() * 40}, 40%, ${15 + Math.random() * 25}%)`;
                    context.beginPath();
                    context.arc(mx, my, msize, 0, 2 * Math.PI);
                    context.fill();
                }
                context.globalAlpha = 1.0;
            }
        }
    }

    context.globalAlpha = 0.6;
    context.strokeStyle = '#2C1810';
    context.lineWidth = 1 + Math.random() * 1.5;
    bumpContext.strokeStyle = '#000000';
    bumpContext.lineWidth = 1 + Math.random() * 1.5;
    for (let i = 0; i < 15; i++) {
        const startX = Math.random() * canvas.width;
        const startY = Math.random() * canvas.height;
        const endX = startX + (Math.random() - 0.5) * 100;
        const endY = startY + (Math.random() - 0.5) * 100;
        
        context.beginPath();
        context.moveTo(startX, startY);
        let currentX = startX;
        let currentY = startY;
        const steps = 5 + Math.random() * 10;
        for (let j = 0; j < steps; j++) {
            currentX += (endX - startX) / steps + (Math.random() - 0.5) * 10;
            currentY += (endY - startY) / steps + (Math.random() - 0.5) * 10;
            context.lineTo(currentX, currentY);
        }
        context.stroke();
        bumpContext.beginPath();
        bumpContext.moveTo(startX, startY);
        bumpContext.lineTo(endX, endY);
        bumpContext.stroke();
    }
    context.globalAlpha = 1.0;

  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(1, 1);
  
  const normalCanvas = createNormalMapFromHeightMap(bumpCanvas, 5.0);
  const normalMap = new THREE.CanvasTexture(normalCanvas);
  normalMap.wrapS = THREE.RepeatWrapping;
  normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.repeat.set(1, 1);
  
  return { map, normalMap };
};

export const generateCementTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d')!;

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 512;
    bumpCanvas.height = 512;
    const bumpContext = bumpCanvas.getContext('2d')!;

    context.fillStyle = '#9e9e9e';
    context.fillRect(0, 0, canvas.width, canvas.height);
    bumpContext.fillStyle = '#7f7f7f';
    bumpContext.fillRect(0, 0, bumpCanvas.width, bumpCanvas.height);

    for (let i = 0; i < 20000; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 1.5;
        const color = 140 + Math.floor(Math.random() * 40);
        context.fillStyle = `rgba(${color}, ${color}, ${color}, ${Math.random() * 0.1})`;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();

        const bumpColor = 127 + (Math.random() - 0.5) * 80;
        bumpContext.fillStyle = `rgb(${bumpColor},${bumpColor},${bumpColor})`;
        bumpContext.beginPath();
        bumpContext.arc(x, y, radius, 0, Math.PI * 2);
        bumpContext.fill();
    }

    context.globalAlpha = 0.15;
    for (let i = 0; i < 15; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const sizeX = 20 + Math.random() * 80;
        const sizeY = 20 + Math.random() * 80;
        context.fillStyle = '#616161';
        context.fillRect(x, y, sizeX, sizeY);
    }
    context.globalAlpha = 1.0;

    context.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    context.lineWidth = 0.5 + Math.random();
    bumpContext.strokeStyle = 'rgba(0, 0, 0, 1)';
    bumpContext.lineWidth = 0.5 + Math.random();
    for (let i = 0; i < 10; i++) {
        const startX = Math.random() * canvas.width;
        const startY = Math.random() * canvas.height;
        context.beginPath();
        context.moveTo(startX, startY);
        context.lineTo(startX + (Math.random() - 0.5) * 80, startY + (Math.random() - 0.5) * 80);
        context.stroke();
        bumpContext.beginPath();
        bumpContext.moveTo(startX, startY);
        bumpContext.lineTo(startX + (Math.random() - 0.5) * 80, startY + (Math.random() - 0.5) * 80);
        bumpContext.stroke();
    }
    
    const map = new THREE.CanvasTexture(canvas);
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(2, 2);

    const normalCanvas = createNormalMapFromHeightMap(bumpCanvas, 3.0);
    const normalMap = new THREE.CanvasTexture(normalCanvas);
    normalMap.wrapS = THREE.RepeatWrapping;
    normalMap.wrapT = THREE.RepeatWrapping;
    normalMap.repeat.set(2, 2);

    return { map, normalMap };
};

export const generateDirtTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d')!;

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 512;
    bumpCanvas.height = 512;
    const bumpContext = bumpCanvas.getContext('2d')!;

    context.fillStyle = '#5d4037';
    context.fillRect(0, 0, canvas.width, canvas.height);
    bumpContext.fillStyle = '#444444';
    bumpContext.fillRect(0, 0, bumpCanvas.width, bumpCanvas.height);

    for (let i = 0; i < 40000; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 2;
        const colorVal = 40 + Math.floor(Math.random() * 40);
        const color = `rgba(${colorVal}, ${colorVal - 10}, ${colorVal - 20}, ${Math.random() * 0.2})`;
        context.fillStyle = color;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();

        const bumpColor = 80 + (Math.random() - 0.5) * 60;
        bumpContext.fillStyle = `rgb(${bumpColor},${bumpColor},${bumpColor})`;
        bumpContext.beginPath();
        bumpContext.arc(x, y, radius, 0, Math.PI * 2);
        bumpContext.fill();
    }
    
    context.globalAlpha = 0.5;
    for (let i = 0; i < 200; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = 1 + Math.random() * 4;
        const colorVal = 80 + Math.random() * 50;
        context.fillStyle = `rgb(${colorVal}, ${colorVal}, ${colorVal})`;
        context.beginPath();
        context.arc(x, y, size, 0, Math.PI * 2);
        context.fill();

        const bumpColor = 180 + Math.random() * 50;
        bumpContext.fillStyle = `rgb(${bumpColor},${bumpColor},${bumpColor})`;
        bumpContext.beginPath();
        bumpContext.arc(x, y, size, 0, Math.PI * 2);
        bumpContext.fill();
    }
    context.globalAlpha = 1.0;

    const map = new THREE.CanvasTexture(canvas);
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(2, 2);

    const normalCanvas = createNormalMapFromHeightMap(bumpCanvas, 4.0);
    const normalMap = new THREE.CanvasTexture(normalCanvas);
    normalMap.wrapS = THREE.RepeatWrapping;
    normalMap.wrapT = THREE.RepeatWrapping;
    normalMap.repeat.set(2, 2);
    
    return { map, normalMap };
};

export const generateDoorTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 512;
    const context = canvas.getContext('2d')!;

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 256;
    bumpCanvas.height = 512;
    const bumpContext = bumpCanvas.getContext('2d')!;

    context.fillStyle = '#455a64';
    context.fillRect(0, 0, canvas.width, canvas.height);
    bumpContext.fillStyle = '#888888';
    bumpContext.fillRect(0, 0, bumpCanvas.width, bumpCanvas.height);

    context.strokeStyle = '#263238';
    context.lineWidth = 16;
    context.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
    
    bumpContext.strokeStyle = '#ffffff';
    bumpContext.lineWidth = 4;
    bumpContext.strokeRect(14, 14, canvas.width - 28, canvas.height - 28);
    bumpContext.strokeStyle = '#000000';
    bumpContext.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

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
        context.strokeStyle = '#fdd835';
        context.beginPath();
        context.moveTo(i, -50);
        context.lineTo(i + canvas.height, canvas.height + 50);
        context.stroke();
    }
    context.restore();

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
    const normalCanvas = createNormalMapFromHeightMap(bumpCanvas, 5.0);
    const normalMap = new THREE.CanvasTexture(normalCanvas);

    return { map, normalMap };
};

export const generateMetalPanelTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d')!;

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 512;
    bumpCanvas.height = 512;
    const bumpContext = bumpCanvas.getContext('2d')!;

    context.fillStyle = '#546e7a';
    context.fillRect(0, 0, canvas.width, canvas.height);
    bumpContext.fillStyle = '#cccccc';
    bumpContext.fillRect(0, 0, bumpCanvas.width, bumpCanvas.height);

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

    const normalCanvas = createNormalMapFromHeightMap(bumpCanvas, 6.0);
    const normalMap = new THREE.CanvasTexture(normalCanvas);
    normalMap.wrapS = THREE.RepeatWrapping;
    normalMap.wrapT = THREE.RepeatWrapping;
    normalMap.repeat.set(1, 1);

    return { map, normalMap };
};

export const generatePaperTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d')!;

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 256;
    bumpCanvas.height = 256;
    const bumpContext = bumpCanvas.getContext('2d')!;

    context.fillStyle = '#d7ccc8';
    context.fillRect(0, 0, canvas.width, canvas.height);
    bumpContext.fillStyle = '#7f7f7f';
    bumpContext.fillRect(0, 0, bumpCanvas.width, bumpCanvas.height);

    context.fillStyle = '#212121';
    context.fillRect(10, 10, canvas.width - 20, 40);

    context.fillStyle = '#757575';
    context.fillRect(20, 60, 120, 100);

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
    
    context.fillStyle = 'rgba(121, 85, 72, 0.2)';
    context.beginPath();
    context.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 40 + 20, 0, Math.PI * 2);
    context.fill();

    for(let i=0; i < 5000; ++i) {
        const x = Math.random() * bumpCanvas.width;
        const y = Math.random() * bumpCanvas.height;
        const color = 127 + (Math.random() - 0.5) * 20;
        bumpContext.fillStyle = `rgb(${color},${color},${color})`;
        bumpContext.fillRect(x,y,1,1);
    }

    const map = new THREE.CanvasTexture(canvas);
    const normalCanvas = createNormalMapFromHeightMap(bumpCanvas, 1.0);
    const normalMap = new THREE.CanvasTexture(normalCanvas);
    return { map, normalMap };
};

export const generateStainedConcreteTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d')!;

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 512;
    bumpCanvas.height = 512;
    const bumpContext = bumpCanvas.getContext('2d')!;

    context.fillStyle = '#8a8a8a';
    context.fillRect(0, 0, canvas.width, canvas.height);
    bumpContext.fillStyle = '#7f7f7f';
    bumpContext.fillRect(0, 0, bumpCanvas.width, bumpCanvas.height);

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

    context.globalAlpha = 0.2;
    bumpContext.globalAlpha = 0.3;
    for (let i = 0; i < 40; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const sizeX = 10 + Math.random() * 60;
        const sizeY = 10 + Math.random() * 60;
        context.fillStyle = '#424242';
        context.fillRect(x, y, sizeX, sizeY);
        bumpContext.fillStyle = '#444444';
        bumpContext.fillRect(x, y, sizeX, sizeY);
    }
    
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

    const normalCanvas = createNormalMapFromHeightMap(bumpCanvas, 2.5);
    const normalMap = new THREE.CanvasTexture(normalCanvas);
    normalMap.wrapS = THREE.RepeatWrapping;
    normalMap.wrapT = THREE.RepeatWrapping;
    normalMap.repeat.set(1, 1);
    
    return { map, normalMap };
};

export const generateStoneWallTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d')!;

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 512;
    bumpCanvas.height = 512;
    const bumpContext = bumpCanvas.getContext('2d')!;
    
    context.fillStyle = '#4e342e';
    context.fillRect(0, 0, canvas.width, canvas.height);
    bumpContext.fillStyle = '#222222';
    bumpContext.fillRect(0, 0, bumpCanvas.width, bumpCanvas.height);

    for(let i=0; i < 80; i++) {
        const w = 40 + Math.random() * 80;
        const h = 30 + Math.random() * 50;
        const x = Math.random() * canvas.width - w/2;
        const y = Math.random() * canvas.height - h/2;
        const colorVal = 80 + Math.random() * 40;
        context.fillStyle = `rgb(${colorVal}, ${colorVal}, ${colorVal})`;
        
        const r = 10;
        context.beginPath();
        context.moveTo(x + r, y);
        context.lineTo(x + w - r, y);
        context.quadraticCurveTo(x + w, y, x + w, y + r);
        context.lineTo(x + w, y + h - r);
        context.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        context.lineTo(x + r, y + h);
        context.quadraticCurveTo(x, y + h, x, y + h - r);
        context.lineTo(x, y + r);
        context.quadraticCurveTo(x, y, x + r, y);
        context.closePath();
        context.fill();

        context.strokeStyle = 'rgba(0,0,0,0.3)';
        context.lineWidth = 2;
        context.stroke();

        const bumpColor = 150 + Math.random() * 80;
        bumpContext.fillStyle = `rgb(${bumpColor},${bumpColor},${bumpColor})`;
        bumpContext.beginPath();
        bumpContext.moveTo(x + r, y);
        bumpContext.lineTo(x + w - r, y);
        bumpContext.quadraticCurveTo(x + w, y, x + w, y + r);
        bumpContext.lineTo(x + w, y + h - r);
        bumpContext.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        bumpContext.lineTo(x + r, y + h);
        bumpContext.quadraticCurveTo(x, y + h, x, y + h - r);
        bumpContext.lineTo(x, y + r);
        bumpContext.quadraticCurveTo(x, y, x + r, y);
        bumpContext.closePath();
        bumpContext.fill();
    }
    
    context.globalAlpha = 0.4;
    for (let i = 0; i < 100; i++) {
        const mossX = Math.random() * canvas.width;
        const mossY = Math.random() * canvas.height;
        const mossSize = 3 + Math.random() * 10;
        context.fillStyle = `hsl(${80 + Math.random() * 40}, 40%, ${15 + Math.random() * 25}%)`;
        context.beginPath();
        context.arc(mossX, mossY, mossSize, 0, 2 * Math.PI);
        context.fill();
    }
    context.globalAlpha = 1.0;

    const map = new THREE.CanvasTexture(canvas);
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(1, 1);

    const normalCanvas = createNormalMapFromHeightMap(bumpCanvas, 6.0);
    const normalMap = new THREE.CanvasTexture(normalCanvas);
    normalMap.wrapS = THREE.RepeatWrapping;
    normalMap.wrapT = THREE.RepeatWrapping;
    normalMap.repeat.set(1, 1);

    return { map, normalMap };
};

export const generateWoodPlankTexture = (isFloor: boolean = false) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d')!;

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 512;
    bumpCanvas.height = 512;
    const bumpContext = bumpCanvas.getContext('2d')!;

    context.fillStyle = '#8B5A2B';
    context.fillRect(0, 0, canvas.width, canvas.height);
    bumpContext.fillStyle = '#aaaaaa';
    bumpContext.fillRect(0, 0, bumpCanvas.width, bumpCanvas.height);
    
    const plankHeight = 64;
    for (let y = 0; y < canvas.height; y += plankHeight) {
        const colorOffset = Math.floor(Math.random() * 20) - 10;
        context.fillStyle = `rgb(${139 + colorOffset}, ${90 + colorOffset}, ${43 + colorOffset})`;
        context.fillRect(0, y, canvas.width, plankHeight);
        
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
        
        context.fillStyle = 'rgba(0, 0, 0, 0.4)';
        context.fillRect(0, y - 1, canvas.width, 2);
        bumpContext.fillStyle = 'rgba(0, 0, 0, 1)';
        bumpContext.fillRect(0, y - 1, bumpCanvas.width, 2);
    }
    
    const map = new THREE.CanvasTexture(canvas);
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(isFloor ? 2 : 1, isFloor ? 2 : 1);

    const normalCanvas = createNormalMapFromHeightMap(bumpCanvas, 4.0);
    const normalMap = new THREE.CanvasTexture(normalCanvas);
    normalMap.wrapS = THREE.RepeatWrapping;
    normalMap.wrapT = THREE.RepeatWrapping;
    normalMap.repeat.set(isFloor ? 2 : 1, isFloor ? 2 : 1);

    return { map, normalMap };
}

export const generatePantsTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d')!;

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 256;
    bumpCanvas.height = 256;
    const bumpContext = bumpCanvas.getContext('2d')!;

    const colorType = Math.random();
    let baseColor = '#3d5afe';
    if (colorType > 0.66) {
        baseColor = '#8d6e63';
    } else if (colorType > 0.33) {
        baseColor = '#616161';
    }

    context.fillStyle = baseColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
    bumpContext.fillStyle = '#7f7f7f';
    bumpContext.fillRect(0, 0, bumpCanvas.width, bumpCanvas.height);

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
    
    const normalCanvas = createNormalMapFromHeightMap(bumpCanvas, 2.0);
    const normalMap = new THREE.CanvasTexture(normalCanvas);
    normalMap.wrapS = THREE.RepeatWrapping;
    normalMap.wrapT = THREE.RepeatWrapping;
    
    return { map, normalMap };
};

export const generateShirtTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d')!;

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 256;
    bumpCanvas.height = 256;
    const bumpContext = bumpCanvas.getContext('2d')!;

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

    const normalCanvas = createNormalMapFromHeightMap(bumpCanvas, 2.0);
    const normalMap = new THREE.CanvasTexture(normalCanvas);
    normalMap.wrapS = THREE.RepeatWrapping;
    normalMap.wrapT = THREE.RepeatWrapping;
    
    return { map, normalMap };
};

export const generateShoeTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext('2d')!;

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 64;
    bumpCanvas.height = 64;
    const bumpContext = bumpCanvas.getContext('2d')!;

    const colorVal = 20 + Math.random() * 20;
    context.fillStyle = `rgb(${colorVal}, ${colorVal}, ${colorVal})`;
    context.fillRect(0, 0, canvas.width, canvas.height);
    bumpContext.fillStyle = '#aaaaaa';
    bumpContext.fillRect(0, 0, bumpCanvas.width, bumpCanvas.height);
    
    for (let i = 0; i < 1000; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 1;
        context.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.05})`;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
    }
    
    context.fillStyle = `rgba(10, 10, 10, 1)`;
    context.fillRect(0, canvas.height - 5, canvas.width, 5);
    bumpContext.fillStyle = `#666666`;
    bumpContext.fillRect(0, bumpCanvas.height - 5, bumpCanvas.width, 5);

    const map = new THREE.CanvasTexture(canvas);
    const normalCanvas = createNormalMapFromHeightMap(bumpCanvas, 3.0);
    const normalMap = new THREE.CanvasTexture(normalCanvas);

    return { map, normalMap };
};
