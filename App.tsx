

import React, { useRef, useEffect, useCallback, useState } from 'react';
import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

const MAP_WIDTH = 40;
const MAP_HEIGHT = 40;
const TILE_SIZE = 5;
const WALL_HEIGHT = 5;

// --- Helper Functions ---

const generateBoneTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d')!;

    // Base bone color
    context.fillStyle = '#e0d5b1';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Add noise and mottling for an aged look
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
    }

    // Add fine cracks
    context.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    context.lineWidth = 0.5 + Math.random() * 0.5;
    for (let i = 0; i < 15; i++) {
        const startX = Math.random() * canvas.width;
        const startY = Math.random() * canvas.height;
        context.beginPath();
        context.moveTo(startX, startY);
        context.lineTo(startX + (Math.random() - 0.5) * 40, startY + (Math.random() - 0.5) * 40);
        context.stroke();
    }
    
    // Add darker stains
    context.globalAlpha = 0.1;
    for (let i = 0; i < 10; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const sizeX = 10 + Math.random() * 40;
        const sizeY = 10 + Math.random() * 40;
        context.fillStyle = '#6d5a3a';
        context.fillRect(x, y, sizeX, sizeY);
    }
    context.globalAlpha = 1.0;

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
};

const createSkeleton = (material: THREE.Material) => {
    const skeletonGroup = new THREE.Group();

    const headSize = 0.3;
    const torsoHeight = 0.8;
    const torsoWidth = 0.6;
    const legLength = 1.0;
    const armLength = 0.9;
    const limbWidth = 0.15;

    // Simple limb with origin at the top
    const createLimb = (length: number, width: number) => {
        const limb = new THREE.Mesh(new THREE.BoxGeometry(width, length, width), material);
        limb.geometry.translate(0, -length / 2, 0);
        return limb;
    };

    // Legs
    const leftLeg = createLimb(legLength, limbWidth * 1.2);
    leftLeg.name = 'leftLeg';
    leftLeg.position.set(-torsoWidth / 4, legLength, 0);
    skeletonGroup.add(leftLeg);

    const rightLeg = createLimb(legLength, limbWidth * 1.2);
    rightLeg.name = 'rightLeg';
    rightLeg.position.set(torsoWidth / 4, legLength, 0);
    skeletonGroup.add(rightLeg);
    
    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(torsoWidth, torsoHeight, torsoWidth * 0.5), material);
    torso.name = 'torso';
    torso.position.y = legLength + torsoHeight / 2;
    skeletonGroup.add(torso);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(headSize, 12, 12), material);
    head.position.y = legLength + torsoHeight + headSize;
    skeletonGroup.add(head);

    // Arms
    const leftArm = createLimb(armLength, limbWidth);
    leftArm.name = 'leftArm';
    leftArm.position.set(-torsoWidth/2 - limbWidth, legLength + torsoHeight, 0);
    skeletonGroup.add(leftArm);

    const rightArm = createLimb(armLength, limbWidth);
    rightArm.name = 'rightArm';
    rightArm.position.set(torsoWidth/2 + limbWidth, legLength + torsoHeight, 0);
    skeletonGroup.add(rightArm);
    
    return skeletonGroup;
};


const generateDoorTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 512; // Taller for door shape
    const context = canvas.getContext('2d')!;

    // Base metal color
    context.fillStyle = '#455a64';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Frame
    context.strokeStyle = '#263238';
    context.lineWidth = 16;
    context.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

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
    for (let i = 0; i < 200; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = 10 + Math.random() * 40;
        context.fillStyle = 'rgba(0,0,0,0.5)';
        context.fillRect(x, y, size, size);
    }
    context.globalAlpha = 1.0;

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
};

const generateStainedConcreteTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d')!;

    // Base grey color
    context.fillStyle = '#8a8a8a';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Add noise and mottling
    for (let i = 0; i < 30000; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 2;
        const color = 120 + Math.floor(Math.random() * 40);
        context.fillStyle = `rgba(${color}, ${color}, ${color}, ${Math.random() * 0.15})`;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
    }

    // Add darker stains and grime
    context.globalAlpha = 0.2;
    for (let i = 0; i < 40; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const sizeX = 10 + Math.random() * 60;
        const sizeY = 10 + Math.random() * 60;
        context.fillStyle = '#424242';
        context.fillRect(x, y, sizeX, sizeY);
    }
    
    // Add long vertical water stains
    for (let i = 0; i < 15; i++) {
        const x = Math.random() * canvas.width;
        const width = 2 + Math.random() * 4;
        context.fillStyle = `rgba(0, 0, 0, ${0.05 + Math.random() * 0.1})`;
        context.fillRect(x, 0, width, canvas.height);
    }
    context.globalAlpha = 1.0;

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    return texture;
};

const generateMetalPanelTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d')!;

    // Base metal color
    context.fillStyle = '#546e7a';
    context.fillRect(0, 0, canvas.width, canvas.height);

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
    
    // Rivets
    context.fillStyle = '#37474f';
    const rivetCoords = [15, canvas.width / 2 - 15, canvas.width / 2 + 15, canvas.width - 15];
    for(const x of rivetCoords) {
        for(const y of rivetCoords) {
            context.beginPath();
            context.arc(x, y, 5, 0, Math.PI * 2);
            context.fill();
        }
    }
    
    // Scratches and grime
    context.globalAlpha = 0.3;
    context.strokeStyle = 'rgba(0,0,0,0.5)';
    context.lineWidth = 0.5;
    for (let i = 0; i < 20; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x + (Math.random()-0.5)*30, y + (Math.random()-0.5)*30);
        context.stroke();
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

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    return texture;
};

const generateStoneWallTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d')!;
    
    // Mortar background
    context.fillStyle = '#4e342e';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Draw stones
    for(let i=0; i < 80; i++) {
        const w = 40 + Math.random() * 80;
        const h = 30 + Math.random() * 50;
        const x = Math.random() * canvas.width - w/2;
        const y = Math.random() * canvas.height - h/2;
        const colorVal = 80 + Math.random() * 40;
        context.fillStyle = `rgb(${colorVal}, ${colorVal}, ${colorVal})`;
        
        // Rounded rect for stone shape
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

        // Add a subtle shadow
        context.strokeStyle = 'rgba(0,0,0,0.3)';
        context.lineWidth = 2;
        context.stroke();
    }
    
    // Moss (re-using logic from bricks)
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

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    return texture;
};


const generateDirtTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d')!;

    // Base dirt color
    context.fillStyle = '#5d4037'; // Dark brown
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Add noise and texture
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
    }
    
    // Add pebbles/rocks
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
    }
    context.globalAlpha = 1.0;

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
};

const generatePaperTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d')!;

    // Background paper color
    context.fillStyle = '#d7ccc8'; // Off-white/grey
    context.fillRect(0, 0, canvas.width, canvas.height);

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

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
};

const generateCementTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d')!;

    // Base grey color
    context.fillStyle = '#9e9e9e';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Add noise and mottling
    for (let i = 0; i < 20000; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 1.5;
        const color = 140 + Math.floor(Math.random() * 40);
        context.fillStyle = `rgba(${color}, ${color}, ${color}, ${Math.random() * 0.1})`;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
    }

    // Add darker stains
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

    // Add fine cracks
    context.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    context.lineWidth = 0.5 + Math.random();
    for (let i = 0; i < 10; i++) {
        const startX = Math.random() * canvas.width;
        const startY = Math.random() * canvas.height;
        context.beginPath();
        context.moveTo(startX, startY);
        context.lineTo(startX + (Math.random() - 0.5) * 80, startY + (Math.random() - 0.5) * 80);
        context.stroke();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
};

const generateBarrelTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d')!;

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
    }
    
    // Draw metal hoops
    context.fillStyle = '#616161'; // Dark grey for metal
    context.fillRect(0, canvas.height * 0.1, canvas.width, canvas.height * 0.1);
    context.fillRect(0, canvas.height * 0.8, canvas.width, canvas.height * 0.1);

    // Add some highlights/shadows to hoops
    context.fillStyle = 'rgba(255, 255, 255, 0.2)';
    context.fillRect(0, canvas.height * 0.1, canvas.width, 3);
    context.fillStyle = 'rgba(0, 0, 0, 0.2)';
    context.fillRect(0, canvas.height * 0.2 - 3, canvas.width, 3);

    context.fillStyle = 'rgba(255, 255, 255, 0.2)';
    context.fillRect(0, canvas.height * 0.8, canvas.width, 3);
    context.fillStyle = 'rgba(0, 0, 0, 0.2)';
    context.fillRect(0, canvas.height * 0.9 - 3, canvas.width, 3);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
};

const generateBarrelTopTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d')!;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Wood background color
    context.fillStyle = '#a1662f'; 
    context.beginPath();
    context.arc(centerX, centerY, centerX, 0, Math.PI * 2);
    context.fill();
    
    // Draw wood grain rings
    context.strokeStyle = '#694518'; 
    context.lineWidth = 1.5;
    for (let r = 5; r < centerX - 10; r += Math.random() * 8 + 4) {
        context.beginPath();
        const distortion = 1 + (Math.random() - 0.5) * 0.1;
        context.ellipse(centerX, centerY, r, r * distortion, Math.random() * Math.PI, 0, Math.PI * 2);
        context.stroke();
    }
    
    // Draw plank lines
    context.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    context.lineWidth = 3;
    const plankWidth = 32;
    for (let x = plankWidth; x < canvas.width; x += plankWidth) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, canvas.height);
        context.stroke();
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

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
};

const generateWoodPlankTexture = (isFloor: boolean = false) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d')!;

    // Base wood color
    context.fillStyle = '#8B5A2B';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    const plankHeight = 64;
    for (let y = 0; y < canvas.height; y += plankHeight) {
        // Plank color variation
        const colorOffset = Math.floor(Math.random() * 20) - 10;
        context.fillStyle = `rgb(${139 + colorOffset}, ${90 + colorOffset}, ${43 + colorOffset})`;
        context.fillRect(0, y, canvas.width, plankHeight);
        
        // Wood grain
        context.strokeStyle = `rgba(0, 0, 0, 0.1)`;
        context.lineWidth = 1 + Math.random() * 2;
        for (let i = 0; i < 5; i++) {
            context.beginPath();
            context.moveTo(0, y + Math.random() * plankHeight);
            context.bezierCurveTo(
                canvas.width * 0.3, y + Math.random() * plankHeight,
                canvas.width * 0.7, y + Math.random() * plankHeight,
                canvas.width, y + Math.random() * plankHeight
            );
            context.stroke();
        }

        // Knots
        if (Math.random() < 0.2) {
            const knotX = Math.random() * canvas.width;
            const knotY = y + Math.random() * plankHeight;
            context.fillStyle = 'rgba(0,0,0,0.2)';
            context.beginPath();
            context.arc(knotX, knotY, Math.random() * 8 + 4, 0, Math.PI * 2);
            context.fill();
        }
        
        // Shadow line between planks
        context.fillStyle = 'rgba(0, 0, 0, 0.4)';
        context.fillRect(0, y - 1, canvas.width, 2);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(isFloor ? 2 : 1, isFloor ? 2 : 1);
    return texture;
}

// Generate procedural textures
const generateBrickTexture = () => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;
  canvas.width = 512;
  canvas.height = 512;

    const brickWidth = 60;
    const brickHeight = 30;
    const mortarWidth = 4;
    const mortarHeight = 4;

    context.fillStyle = '#5D4037';
    context.fillRect(0, 0, canvas.width, canvas.height);

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

    context.globalAlpha = 0.3;
    for (let i = 0; i < 10; i++) {
        const mossX = Math.random() * canvas.width;
        const mossY = Math.random() * canvas.height;
        const mossSize = 1 + Math.random() * 4;
        context.fillStyle = `hsl(${100 + Math.random() * 20}, 30%, ${10 + Math.random() * 15}%)`;
        context.beginPath();
        context.arc(mossX, mossY, mossSize, 0, 2 * Math.PI);
        context.fill();
    }
    context.globalAlpha = 1.0;

    context.globalAlpha = 0.3;
    for (let i = 0; i < 50; i++) {
        const dirtX = Math.random() * canvas.width;
        const dirtY = Math.random() * canvas.height;
        const dirtSize = 5 + Math.random() * 20;
        context.fillStyle = `rgba(40, 20, 10, ${Math.random() * 0.5})`;
        context.beginPath();
        context.arc(dirtX, dirtY, dirtSize, 0, 2 * Math.PI);
        context.fill();
    }

    context.globalAlpha = 0.6;
    context.strokeStyle = '#2C1810';
    context.lineWidth = 1 + Math.random() * 1.5;
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
    }

    context.globalAlpha = 1.0;

    context.fillStyle = 'rgba(0, 0, 0, 0.1)';
    context.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  return texture;
};


// Generate level layout using rooms and corridors
const generateLevel = () => {
    const grid = Array(MAP_WIDTH).fill(null).map(() => Array(MAP_HEIGHT).fill(0)); // 0 = wall, 1 = floor
    const rooms: { x: number, y: number, width: number, height: number, wallTheme?: string, floorTheme?: string }[] = [];
    const maxRooms = 15;
    const minRoomSize = 4;
    const maxRoomSize = 8;

    for (let i = 0; i < maxRooms; i++) {
        const w = Math.floor(Math.random() * (maxRoomSize - minRoomSize + 1)) + minRoomSize;
        const h = Math.floor(Math.random() * (maxRoomSize - minRoomSize + 1)) + minRoomSize;
        const x = Math.floor(Math.random() * (MAP_WIDTH - w - 2)) + 1;
        const y = Math.floor(Math.random() * (MAP_HEIGHT - h - 2)) + 1;

        const newRoom = { x, y, width: w, height: h };
        let failed = false;
        for (const otherRoom of rooms) {
            if (
                newRoom.x < otherRoom.x + otherRoom.width &&
                newRoom.x + newRoom.width > otherRoom.x &&
                newRoom.y < otherRoom.y + otherRoom.height &&
                newRoom.y + newRoom.height > otherRoom.y
            ) {
                failed = true;
                break;
            }
        }

        if (!failed) {
            for (let ry = newRoom.y; ry < newRoom.y + newRoom.height; ry++) {
                for (let rx = newRoom.x; rx < newRoom.x + newRoom.width; rx++) {
                    grid[rx][ry] = 1;
                }
            }
            rooms.push(newRoom);
        }
    }

    // Connect rooms with corridors
    for (let i = 0; i < rooms.length - 1; i++) {
        const center1 = { x: Math.floor(rooms[i].x + rooms[i].width / 2), y: Math.floor(rooms[i].y + rooms[i].height / 2) };
        const center2 = { x: Math.floor(rooms[i+1].x + rooms[i+1].width / 2), y: Math.floor(rooms[i+1].y + rooms[i+1].height / 2) };

        if (Math.random() > 0.5) { // Horizontal then vertical
            for (let x = Math.min(center1.x, center2.x); x <= Math.max(center1.x, center2.x); x++) grid[x][center1.y] = 1;
            for (let y = Math.min(center1.y, center2.y); y <= Math.max(center1.y, center2.y); y++) grid[center2.x][y] = 1;
        } else { // Vertical then horizontal
            for (let y = Math.min(center1.y, center2.y); y <= Math.max(center1.y, center2.y); y++) grid[center1.x][y] = 1;
            for (let x = Math.min(center1.x, center2.x); x <= Math.max(center1.x, center2.x); x++) grid[x][center2.y] = 1;
        }
    }
    
    // Find door locations
    const doorLocations: { x: number, y: number, orientation: 'horizontal' | 'vertical' }[] = [];
    for (let x = 1; x < MAP_WIDTH - 1; x++) {
        for (let y = 1; y < MAP_HEIGHT - 1; y++) {
            if (grid[x][y] !== 1) continue;

            // Check for vertical passage (walls left/right, floor top/bottom)
            const isVerticalPassage = grid[x - 1][y] === 0 && grid[x + 1][y] === 0 && grid[x][y - 1] === 1 && grid[x][y + 1] === 1;
            // Check for horizontal passage (walls top/bottom, floor left/right)
            const isHorizontalPassage = grid[x][y - 1] === 0 && grid[x][y + 1] === 0 && grid[x - 1][y] === 1 && grid[x + 1][y] === 1;

            if (isVerticalPassage || isHorizontalPassage) {
                // Avoid placing doors right next to each other
                const tooClose = doorLocations.some(d => Math.abs(d.x - x) + Math.abs(d.y - y) < 3);
                if (!tooClose) {
                    doorLocations.push({ x, y, orientation: isVerticalPassage ? 'vertical' : 'horizontal' });
                }
            }
        }
    }
    
    return { grid, rooms, doorLocations };
};

function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const gameData = useRef<any>({});
  const [gameState, setGameState] = useState<'menu' | 'generating' | 'preview' | 'playing'>('menu');

  const setupScene = useCallback(async () => {
    if (!mountRef.current || gameState === 'generating') return;
    
    setGameState('generating');
    const playBtn = document.getElementById('play-btn') as HTMLButtonElement;
    const genBtn = document.getElementById('generate-btn') as HTMLButtonElement;
    const subtitle = document.getElementById('subtitle') as HTMLParagraphElement;
    playBtn.disabled = true;
    genBtn.disabled = true;
    subtitle.textContent = "Generating level...";

    const currentMount = mountRef.current;
    
    if (gameData.current.levelContainer) {
        gameData.current.scene.remove(gameData.current.levelContainer);
    }

    if (!gameData.current.scene) {
        gameData.current.scene = new THREE.Scene();
        gameData.current.scene.background = new THREE.Color(0x101010);
        
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        currentMount.appendChild(renderer.domElement);
        gameData.current.renderer = renderer;

        gameData.current.perspectiveCamera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
        
        const aspect = currentMount.clientWidth / currentMount.clientHeight;
        const width = MAP_WIDTH * TILE_SIZE;
        const height = MAP_HEIGHT * TILE_SIZE;
        gameData.current.orthographicCamera = new THREE.OrthographicCamera(width / -2, width / 2, height / (2 * aspect), height / (-2 * aspect), 1, 1000);
        gameData.current.orthographicCamera.position.y = 50;
        gameData.current.orthographicCamera.lookAt(0, 0, 0);

        gameData.current.controls = new PointerLockControls(gameData.current.perspectiveCamera, renderer.domElement);
        gameData.current.scene.add(gameData.current.controls.getObject());

        gameData.current.wallMaterials = {
            brick: new THREE.MeshStandardMaterial({ map: generateBrickTexture(), roughness: 0.8 }),
            wood: new THREE.MeshStandardMaterial({ map: generateWoodPlankTexture(), roughness: 0.7 }),
            stone: new THREE.MeshStandardMaterial({ map: generateStoneWallTexture(), roughness: 0.85 }),
            metal: new THREE.MeshStandardMaterial({ map: generateMetalPanelTexture(), roughness: 0.4, metalness: 0.6 }),
            concrete: new THREE.MeshStandardMaterial({ map: generateStainedConcreteTexture(), roughness: 0.9 }),
        };
        gameData.current.floorMaterials = {
            cement: new THREE.MeshStandardMaterial({ map: generateCementTexture(), roughness: 0.9 }),
            wood: new THREE.MeshStandardMaterial({ map: generateWoodPlankTexture(true), roughness: 0.7 }),
            dirt: new THREE.MeshStandardMaterial({ map: generateDirtTexture(), roughness: 0.95 }),
        };
        
        gameData.current.doorMaterial = new THREE.MeshStandardMaterial({ map: generateDoorTexture(), roughness: 0.6, metalness: 0.7 });
        gameData.current.boneMaterial = new THREE.MeshStandardMaterial({ map: generateBoneTexture(), roughness: 0.8 });
        gameData.current.brickMaterial = new THREE.MeshStandardMaterial({ color: 0xb7410e, roughness: 0.8, metalness: 0.1 });
        gameData.current.barrelMaterial = new THREE.MeshStandardMaterial({ map: generateBarrelTexture(), roughness: 0.7 });
        gameData.current.barrelTopMaterial = new THREE.MeshStandardMaterial({ map: generateBarrelTopTexture(), roughness: 0.7 });
        gameData.current.debrisMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9 });
        gameData.current.paperMaterial = new THREE.MeshStandardMaterial({ map: generatePaperTexture(), side: THREE.DoubleSide });
        gameData.current.lampMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.4, metalness: 0.8 });
        gameData.current.lampBulbMaterial = new THREE.MeshStandardMaterial({ color: 0xffffee, emissive: 0xffffee, emissiveIntensity: 1 });
        
        if (!gameData.current.ambientLight) {
            gameData.current.ambientLight = new THREE.AmbientLight(0xffffff, 0.05);
            gameData.current.scene.add(gameData.current.ambientLight);
        }
        gameData.current.keys = {};
        gameData.current.isMapVisible = false;
        gameData.current.doorInteractionCooldown = 0;
        const mapCanvas = document.getElementById('map-canvas') as HTMLCanvasElement;
        gameData.current.mapCtx = mapCanvas.getContext('2d');
    }
    const { scene } = gameData.current;
    
    // --- Level Generation ---
    const { grid, rooms, doorLocations } = generateLevel();
    gameData.current.grid = grid;
    gameData.current.rooms = rooms;
    gameData.current.doorLocations = doorLocations;
    gameData.current.levelContainer = new THREE.Group();
    scene.add(gameData.current.levelContainer);

    const floorTiles: {x: number, z: number}[] = [];
    const roomMap = Array(MAP_WIDTH).fill(null).map(() => Array(MAP_HEIGHT).fill(-1));
    const wallThemeNames = Object.keys(gameData.current.wallMaterials);
    const floorThemeNames = Object.keys(gameData.current.floorMaterials);

    rooms.forEach((room, index) => {
        room.wallTheme = wallThemeNames[Math.floor(Math.random() * wallThemeNames.length)];
        room.floorTheme = floorThemeNames[Math.floor(Math.random() * floorThemeNames.length)];
        for (let y = room.y; y < room.y + room.height; y++) {
            for (let x = room.x; x < room.x + room.width; x++) {
                roomMap[x][y] = index;
            }
        }
    });

    const wallGeometry = new THREE.BoxGeometry(TILE_SIZE, WALL_HEIGHT, TILE_SIZE);
    const floorGeometry = new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE);
    floorGeometry.rotateX(-Math.PI / 2);
    const ceilingGeometry = new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE);
    ceilingGeometry.rotateX(Math.PI / 2);

    const matrix = new THREE.Matrix4();
    const wallMatrices: { [key: string]: THREE.Matrix4[] } = { brick: [], wood: [], stone: [], metal: [], concrete: [] };
    const floorMatrices: { [key: string]: THREE.Matrix4[] } = { cement: [], wood: [], dirt: [] };
    const ceilingMatrices: { [key: string]: THREE.Matrix4[] } = { cement: [], wood: [], dirt: [] };

    for (let i = 0; i < MAP_WIDTH; i++) {
        for (let j = 0; j < MAP_HEIGHT; j++) {
            const worldX = (i - MAP_WIDTH / 2) * TILE_SIZE + TILE_SIZE / 2;
            const worldZ = (j - MAP_HEIGHT / 2) * TILE_SIZE + TILE_SIZE / 2;

            if (grid[i][j] === 1) {
                floorTiles.push({ x: i, z: j });
                
                let tileFloorTheme = 'cement'; // Default floor for corridors
                const roomIndex = roomMap[i][j];
                if (roomIndex !== -1) {
                    tileFloorTheme = rooms[roomIndex].floorTheme!;
                }
                
                matrix.setPosition(worldX, 0, worldZ);
                floorMatrices[tileFloorTheme].push(matrix.clone());
                
                matrix.setPosition(worldX, WALL_HEIGHT, worldZ);
                ceilingMatrices[tileFloorTheme].push(matrix.clone());

            } else { // It's a wall
                const isVisible = (grid[i+1] && grid[i+1][j] === 1) || (grid[i-1] && grid[i-1][j] === 1) || (grid[i][j+1] === 1) || (grid[i][j-1] === 1);
                if (!isVisible) continue;

                let wallTheme = 'brick';
                const neighbors = [[i+1, j], [i-1, j], [i, j+1], [i, j-1]];
                for(const [nx, ny] of neighbors) {
                    if(grid[nx] && grid[nx][ny] === 1 && roomMap[nx][ny] !== -1) {
                        wallTheme = rooms[roomMap[nx][ny]].wallTheme!;
                        break;
                    }
                }
                
                matrix.setPosition(worldX, WALL_HEIGHT / 2, worldZ);
                wallMatrices[wallTheme].push(matrix.clone());
            }
        }
    }

    // Create instanced meshes for walls, floors, and ceilings
    for (const theme of wallThemeNames) {
        const wallMats = wallMatrices[theme];
        if (wallMats.length > 0) {
            const material = gameData.current.wallMaterials[theme];
            const instancedMesh = new THREE.InstancedMesh(wallGeometry, material, wallMats.length);
            wallMats.forEach((mat, i) => instancedMesh.setMatrixAt(i, mat));
            gameData.current.levelContainer.add(instancedMesh);
        }
    }
    for (const theme of floorThemeNames) {
        const floorMats = floorMatrices[theme];
        if(floorMats.length > 0) {
            const material = gameData.current.floorMaterials[theme];
            const instancedMesh = new THREE.InstancedMesh(floorGeometry, material, floorMats.length);
            floorMats.forEach((mat, i) => instancedMesh.setMatrixAt(i, mat));
            gameData.current.levelContainer.add(instancedMesh);
        }
        const ceilMats = ceilingMatrices[theme];
        if(ceilMats.length > 0) {
            const material = gameData.current.floorMaterials[theme];
            const instancedMesh = new THREE.InstancedMesh(ceilingGeometry, material, ceilMats.length);
            ceilMats.forEach((mat, i) => instancedMesh.setMatrixAt(i, mat));
            gameData.current.levelContainer.add(instancedMesh);
        }
    }
    await new Promise(resolve => setTimeout(resolve, 10)); // Allow render updates
    
    gameData.current.floorTiles = floorTiles;
    
    // --- Clutter and Lamp Generation ---
    const clutterContainer = new THREE.Group();
    gameData.current.levelContainer.add(clutterContainer);
    
    rooms.forEach(room => {
        // Floor Clutter
        const clutterCount = 1 + Math.floor(Math.random() * 3); // 1-3 clutter items per room
        for (let i = 0; i < clutterCount; i++) {
            const tileX = room.x + Math.floor(Math.random() * room.width);
            const tileZ = room.y + Math.floor(Math.random() * room.height);
            const worldX = (tileX - MAP_WIDTH / 2) * TILE_SIZE + (Math.random() * TILE_SIZE - TILE_SIZE/2);
            const worldZ = (tileZ - MAP_HEIGHT / 2) * TILE_SIZE + (Math.random() * TILE_SIZE - TILE_SIZE/2);

            const clutterType = Math.random();
            if (clutterType < 0.33) { // Barrels
                const barrelHeight = WALL_HEIGHT * 0.6;
                const barrelRadiusTop = 1.2; const barrelRadiusMiddle = 1.5;
                const points = Array.from({length: 11}, (_, i) => {
                    const y = (i / 10 - 0.5) * barrelHeight;
                    const a = Math.abs(y) / (barrelHeight / 2);
                    return new THREE.Vector2(THREE.MathUtils.lerp(barrelRadiusMiddle, barrelRadiusTop, a * a), y);
                });
                const barrelSideGeometry = new THREE.LatheGeometry(points, 12);
                const capGeometry = new THREE.CircleGeometry(barrelRadiusTop, 12);
                const barrelGroup = new THREE.Group();
                barrelGroup.add(new THREE.Mesh(barrelSideGeometry, gameData.current.barrelMaterial));
                const topCap = new THREE.Mesh(capGeometry, gameData.current.barrelTopMaterial);
                topCap.position.y = barrelHeight / 2; topCap.rotation.x = -Math.PI / 2;
                barrelGroup.add(topCap);
                const bottomCap = new THREE.Mesh(capGeometry, gameData.current.barrelTopMaterial);
                bottomCap.position.y = -barrelHeight / 2; bottomCap.rotation.x = Math.PI / 2;
                barrelGroup.add(bottomCap);
                barrelGroup.position.set(worldX, barrelHeight / 2, worldZ);
                clutterContainer.add(barrelGroup);
            } else if (clutterType < 0.66) { // Debris
                const debrisPile = new THREE.Group();
                const numDebris = 5 + Math.floor(Math.random() * 10);
                for(let d=0; d<numDebris; d++) {
                    const debrisGeom = new THREE.BoxGeometry(0.1 + Math.random() * 0.3, 0.1 + Math.random() * 0.3, 0.1 + Math.random() * 0.3);
                    const debris = new THREE.Mesh(debrisGeom, gameData.current.debrisMaterial);
                    debris.position.set(worldX + (Math.random() - 0.5), 0.1, worldZ + (Math.random() - 0.5));
                    debris.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
                    debrisPile.add(debris);
                }
                clutterContainer.add(debrisPile);
            } else { // Newspapers
                const paperGeom = new THREE.PlaneGeometry(0.5, 0.7);
                const paper = new THREE.Mesh(paperGeom, gameData.current.paperMaterial);
                paper.position.set(worldX, 0.01, worldZ);
                paper.rotation.x = -Math.PI / 2;
                paper.rotation.z = Math.random() * Math.PI * 2;
                clutterContainer.add(paper);
            }
        }
        
        // Ceiling Lamps
        const roomArea = room.width * room.height;
        const lampCount = Math.max(1, Math.floor(roomArea / 12));
        for (let i = 0; i < lampCount; i++) {
            const tileX = room.x + Math.floor(Math.random() * room.width);
            const tileZ = room.y + Math.floor(Math.random() * room.height);
            const worldX = (tileX - MAP_WIDTH / 2) * TILE_SIZE + TILE_SIZE / 2;
            const worldZ = (tileZ - MAP_HEIGHT / 2) * TILE_SIZE + TILE_SIZE / 2;
            
            const lampGroup = new THREE.Group();
            const baseGeom = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 12);
            const base = new THREE.Mesh(baseGeom, gameData.current.lampMaterial);
            base.position.y = -0.05;
            lampGroup.add(base);
            
            const bulbGeom = new THREE.SphereGeometry(0.25, 8, 8);
            const bulb = new THREE.Mesh(bulbGeom, gameData.current.lampBulbMaterial);
            bulb.position.y = -0.3;
            lampGroup.add(bulb);
            
            const light = new THREE.PointLight(0xffe0b2, 4.0, TILE_SIZE * 5);
            light.position.y = -0.3;
            lampGroup.add(light);
            
            lampGroup.position.set(worldX, WALL_HEIGHT, worldZ);
            clutterContainer.add(lampGroup);
        }
    });

    // --- Door Generation ---
    const doorContainer = new THREE.Group();
    gameData.current.levelContainer.add(doorContainer);
    gameData.current.doors = [];
    const doorGeom = new THREE.BoxGeometry(TILE_SIZE, WALL_HEIGHT, 0.5); // Thin door
    doorLocations.forEach((loc: { x: number, y: number, orientation: 'horizontal' | 'vertical' }) => {
        const worldX = (loc.x - MAP_WIDTH / 2) * TILE_SIZE + TILE_SIZE / 2;
        const worldZ = (loc.y - MAP_HEIGHT / 2) * TILE_SIZE + TILE_SIZE / 2;

        const door = new THREE.Mesh(doorGeom, gameData.current.doorMaterial);
        door.position.set(worldX, WALL_HEIGHT / 2, worldZ);
        
        if (loc.orientation === 'horizontal') {
            // A horizontal passage runs along the X-axis. The door geometry is wide along
            // the X-axis by default, so we need to rotate it 90 degrees to block the passage.
            door.rotation.y = Math.PI / 2;
        }
        // For a vertical passage (along Z-axis), the default door orientation is correct.
        
        door.userData = {
            gridX: loc.x,
            gridZ: loc.y,
            state: 'closed', // closed, opening, open, closing
            openY: WALL_HEIGHT * 1.5 - 0.1,
            closedY: WALL_HEIGHT / 2,
        };
        
        doorContainer.add(door);
        gameData.current.doors.push(door);
    });

    // --- Finalize ---
    playBtn.disabled = false;
    genBtn.disabled = false;
    subtitle.textContent = "Level generated. Press Play!";
    setGameState('preview');
  }, [gameState]);

  const enterGameMode = useCallback(() => {
    const { scene, perspectiveCamera, floorTiles, boneMaterial, controls } = gameData.current;

    if (gameData.current.enemies) {
        gameData.current.enemies.forEach((e: THREE.Group) => scene.remove(e));
    }

    const spawnTile = floorTiles[Math.floor(Math.random() * floorTiles.length)];
    perspectiveCamera.position.set(
        (spawnTile.x - MAP_WIDTH / 2) * TILE_SIZE + TILE_SIZE / 2,
        WALL_HEIGHT / 2,
        (spawnTile.z - MAP_HEIGHT / 2) * TILE_SIZE + TILE_SIZE / 2
    );

    const enemies: THREE.Group[] = [];
    const numEnemies = Math.floor(floorTiles.length / 15);
    for (let i = 0; i < numEnemies; i++) {
      const tile = floorTiles[Math.floor(Math.random() * floorTiles.length)];
      if (tile === spawnTile) continue;
      const enemy = createSkeleton(boneMaterial);
      enemy.userData.animationOffset = Math.random() * Math.PI * 2;
      enemy.position.set(
        (tile.x - MAP_WIDTH / 2) * TILE_SIZE + TILE_SIZE / 2,
        0,
        (tile.z - MAP_HEIGHT / 2) * TILE_SIZE + TILE_SIZE / 2
      );
      scene.add(enemy);
      enemies.push(enemy);
    }
    gameData.current.enemies = enemies;
    
    if (!gameData.current.playerLight) {
        gameData.current.playerLight = new THREE.PointLight(0xfff0d1, 1.0, TILE_SIZE * 4);
        scene.add(gameData.current.playerLight);
    }
    
    controls.lock();
    gameData.current.bullets = [];
  }, []);


  useEffect(() => {
    const currentMount = mountRef.current!;
    if (!gameData.current.renderer) {
      const playBtn = document.getElementById('play-btn') as HTMLButtonElement;
      playBtn.disabled = true;
    }
    const { renderer, controls, perspectiveCamera, orthographicCamera } = gameData.current;

    const overlay = document.getElementById('overlay')!;
    const crosshair = document.getElementById('crosshair')!;
    const generateBtn = document.getElementById('generate-btn')!;
    const playBtn = document.getElementById('play-btn')!;
    const mapOverlay = document.getElementById('map-overlay')!;

    const onLock = () => { setGameState('playing'); overlay.style.display = 'none'; crosshair.style.display = 'block'; };
    const onUnlock = () => {
        setGameState('menu');
        overlay.style.display = 'flex';
        crosshair.style.display = 'none';
        mapOverlay.style.display = 'none';
        gameData.current.isMapVisible = false;
    };
    const onMouseDown = (event: MouseEvent) => {
      if (gameState === 'playing' && event.button === 0) {
        const bulletMaterial = new THREE.MeshBasicMaterial({color: 0xffff00});
        const bulletGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
        
        bullet.userData.velocity = new THREE.Vector3();
        perspectiveCamera.getWorldDirection(bullet.userData.velocity);
        bullet.userData.velocity.multiplyScalar(50);
        bullet.position.copy(perspectiveCamera.position);
        
        gameData.current.scene.add(bullet);
        gameData.current.bullets.push(bullet);
      }
    };

    if (controls) {
      controls.addEventListener('lock', onLock);
      controls.addEventListener('unlock', onUnlock);
    }
    
    generateBtn.addEventListener('click', setupScene);
    playBtn.addEventListener('click', enterGameMode);
    
    window.addEventListener('mousedown', onMouseDown);
    const handleKeyDown = (event: KeyboardEvent) => { 
      gameData.current.keys[event.code] = true;
      if (event.code === 'Tab') {
        event.preventDefault();
        if (gameState === 'playing') {
            gameData.current.isMapVisible = !gameData.current.isMapVisible;
            mapOverlay.style.display = gameData.current.isMapVisible ? 'block' : 'none';
        }
      }
    };
    const handleKeyUp = (event: KeyboardEvent) => { 
      gameData.current.keys[event.code] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    const handleResize = () => {
        if (!gameData.current.renderer) return;
        const aspect = currentMount.clientWidth / currentMount.clientHeight;
        perspectiveCamera.aspect = aspect;
        perspectiveCamera.updateProjectionMatrix();

        const width = MAP_WIDTH * TILE_SIZE;
        const height = MAP_HEIGHT * TILE_SIZE;
        orthographicCamera.left = width / -2;
        orthographicCamera.right = width / 2;
        orthographicCamera.top = height / (2 * aspect);
        orthographicCamera.bottom = height / (-2 * aspect);
        orthographicCamera.updateProjectionMatrix();

        renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    const updateMap = () => {
        const { mapCtx, grid, enemies, perspectiveCamera } = gameData.current;
        if (!mapCtx || !grid) return;
        const canvas = mapCtx.canvas;
        mapCtx.fillStyle = '#222';
        mapCtx.fillRect(0, 0, canvas.width, canvas.height);

        const mapTileSize = canvas.width / MAP_WIDTH;
        mapCtx.fillStyle = '#555';
        for(let i = 0; i < MAP_WIDTH; i++) {
            for(let j = 0; j < MAP_HEIGHT; j++) {
                if(grid[i][j] === 1) {
                    mapCtx.fillRect(i * mapTileSize, j * mapTileSize, mapTileSize, mapTileSize);
                }
            }
        }
        
        mapCtx.fillStyle = '#fff';
        enemies.forEach((enemy: THREE.Group) => {
            const mapX = (enemy.position.x / TILE_SIZE + MAP_WIDTH / 2) * mapTileSize;
            const mapZ = (enemy.position.z / TILE_SIZE + MAP_HEIGHT / 2) * mapTileSize;
            mapCtx.beginPath();
            mapCtx.arc(mapX, mapZ, 2, 0, Math.PI * 2);
            mapCtx.fill();
        });

        const playerMapX = (perspectiveCamera.position.x / TILE_SIZE + MAP_WIDTH / 2) * mapTileSize;
        const playerMapZ = (perspectiveCamera.position.z / TILE_SIZE + MAP_HEIGHT / 2) * mapTileSize;
        const forward = new THREE.Vector3();
        perspectiveCamera.getWorldDirection(forward);
        const angle = Math.atan2(forward.z, forward.x);

        mapCtx.save();
        mapCtx.translate(playerMapX, playerMapZ);
        mapCtx.rotate(angle + Math.PI / 2);
        mapCtx.fillStyle = '#ff0';
        mapCtx.beginPath();
        mapCtx.moveTo(0, -5);
        mapCtx.lineTo(4, 5);
        mapCtx.lineTo(-4, 5);
        mapCtx.closePath();
        mapCtx.fill();
        mapCtx.restore();
    };

    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (!gameData.current.renderer) return;

      const { scene, renderer, keys } = gameData.current;
      const time = performance.now();
      const delta = (gameData.current.lastTime ? (time - gameData.current.lastTime) : 0) / 1000;

      if (gameState === 'playing') {
          const { perspectiveCamera, grid, playerLight, bullets, enemies, doors } = gameData.current;
          
          const isCollision = (posX: number, posZ: number) => {
              const gridX = Math.floor((posX / TILE_SIZE) + MAP_WIDTH / 2);
              const gridZ = Math.floor((posZ / TILE_SIZE) + MAP_HEIGHT / 2);
              if (grid[gridX]?.[gridZ] === 0) return true;
              const door = doors.find((d: THREE.Mesh) => d.userData.gridX === gridX && d.userData.gridZ === gridZ);
              if (door && (door.userData.state === 'closed' || door.userData.state === 'closing')) return true;
              return false;
          };

          if (gameData.current.doorInteractionCooldown > 0) {
              gameData.current.doorInteractionCooldown -= delta;
          }
          if (keys['Space'] && gameData.current.doorInteractionCooldown <= 0) {
              const interactionRange = TILE_SIZE * 1.5;
              let triggeredDoor = false;
              for (const door of doors) {
                  if (door.position.distanceTo(perspectiveCamera.position) < interactionRange) {
                      if (door.userData.state === 'closed') { door.userData.state = 'opening'; triggeredDoor = true; break; }
                      if (door.userData.state === 'open') { door.userData.state = 'closing'; triggeredDoor = true; break; }
                  }
              }
              if (triggeredDoor) gameData.current.doorInteractionCooldown = 0.5;
          }
          
          const doorSpeed = 8.0;
          doors.forEach((door: THREE.Mesh) => {
              let targetY = door.position.y;
              if (door.userData.state === 'opening') {
                  targetY = door.userData.openY;
                  if (Math.abs(door.position.y - targetY) < 0.01) { 
                      door.userData.state = 'open';
                      door.position.y = targetY;
                      door.userData.openTime = time; // Track when the door fully opens
                  }
              } else if (door.userData.state === 'closing') {
                  targetY = door.userData.closedY;
                  if (Math.abs(door.position.y - targetY) < 0.01) { 
                      door.userData.state = 'closed';
                      door.position.y = targetY;
                      delete door.userData.openTime; // Clean up timer property
                  }
              } else if (door.userData.state === 'open' && door.userData.openTime && time > door.userData.openTime + 5000) {
                  // If open for more than 5 seconds, start closing
                  door.userData.state = 'closing';
              }
              
              if (door.position.y !== targetY) {
                  door.position.y = THREE.MathUtils.lerp(door.position.y, targetY, delta * doorSpeed);
              }
          });

          for (let i = bullets.length - 1; i >= 0; i--) {
            const bullet = bullets[i];
            bullet.position.addScaledVector(bullet.userData.velocity, delta);
            let hit = false;
            for (let j = enemies.length - 1; j >= 0; j--) {
              const enemy = enemies[j];
              const torso = enemy.getObjectByName('torso') as THREE.Mesh;
              if(torso) {
                  const torsoPosition = torso.getWorldPosition(new THREE.Vector3());
                  if (bullet.position.distanceTo(torsoPosition) < 1.0) {
                    scene.remove(enemy); enemies.splice(j, 1); hit = true; break;
                  }
              }
            }
            if (hit || bullet.position.distanceTo(perspectiveCamera.position) > 100) {
              scene.remove(bullet); bullets.splice(i, 1);
            }
          }

          const walkCycleSpeed = 4;
          const bobAmount = 0.05;
          const limbSwingAmount = Math.PI / 4;

          enemies.forEach((enemy: THREE.Group) => {
              const phase = time / 1000 * walkCycleSpeed + enemy.userData.animationOffset;
              
              const leftArm = enemy.getObjectByName('leftArm');
              const rightArm = enemy.getObjectByName('rightArm');
              const leftLeg = enemy.getObjectByName('leftLeg');
              const rightLeg = enemy.getObjectByName('rightLeg');
              
              if(leftArm) (leftArm as THREE.Mesh).rotation.x = Math.sin(phase) * limbSwingAmount;
              if(rightArm) (rightArm as THREE.Mesh).rotation.x = -Math.sin(phase) * limbSwingAmount;
              if(leftLeg) (leftLeg as THREE.Mesh).rotation.x = -Math.sin(phase) * limbSwingAmount;
              if(rightLeg) (rightLeg as THREE.Mesh).rotation.x = Math.sin(phase) * limbSwingAmount;

              const playerPosition = new THREE.Vector3().copy(perspectiveCamera.position);
              playerPosition.y = enemy.position.y + 1.5;
              enemy.lookAt(playerPosition);

              const distanceToPlayer = enemy.position.distanceTo(perspectiveCamera.position);
              if (distanceToPlayer > 2) {
                  const skeletonSpeed = 1.2;
                  const moveStep = skeletonSpeed * delta;
                  const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(enemy.quaternion);
                  
                  const nextX = enemy.position.x + forward.x * moveStep;
                  const nextZ = enemy.position.z + forward.z * moveStep;

                  if (!isCollision(nextX, enemy.position.z)) {
                      enemy.position.x = nextX;
                  }
                  if (!isCollision(enemy.position.x, nextZ)) {
                      enemy.position.z = nextZ;
                  }
              }
              
              enemy.position.y = Math.sin(phase * 2) * bobAmount;
          });


          const speed = 5.0;
          let moveX = 0; let moveZ = 0;
          if (keys['KeyW'] || keys['ArrowUp']) moveZ = -1;
          if (keys['KeyS'] || keys['ArrowDown']) moveZ = 1;
          if (keys['KeyA'] || keys['ArrowLeft']) moveX = -1;
          if (keys['KeyD'] || keys['ArrowRight']) moveX = 1;

          const cameraDirection = new THREE.Vector3();
          perspectiveCamera.getWorldDirection(cameraDirection);
          cameraDirection.y = 0;
          cameraDirection.normalize();

          const rightDirection = new THREE.Vector3();
          rightDirection.crossVectors(cameraDirection, perspectiveCamera.up).normalize();
          
          const moveDirection = new THREE.Vector3();
          moveDirection.add(cameraDirection.multiplyScalar(-moveZ));
          moveDirection.add(rightDirection.multiplyScalar(moveX));
          moveDirection.normalize();

          const totalMove = moveDirection.multiplyScalar(speed * delta);
          const oldPosition = perspectiveCamera.position.clone();
          
          perspectiveCamera.position.x += totalMove.x;
          if (isCollision(perspectiveCamera.position.x, perspectiveCamera.position.z)) {
              perspectiveCamera.position.x = oldPosition.x;
          }
          perspectiveCamera.position.z += totalMove.z;
          if (isCollision(perspectiveCamera.position.x, perspectiveCamera.position.z)) {
              perspectiveCamera.position.z = oldPosition.z;
          }
          
          if(gameData.current.isMapVisible) updateMap();
          playerLight.position.copy(perspectiveCamera.position);
          renderer.render(scene, perspectiveCamera);

      } else { // 'menu' or 'preview' or 'generating'
        if(scene && gameData.current.orthographicCamera)
            renderer.render(scene, gameData.current.orthographicCamera);
      }
      gameData.current.lastTime = time;
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', onMouseDown);
      if (controls) {
        controls.removeEventListener('lock', onLock);
        controls.removeEventListener('unlock', onUnlock);
      }
      generateBtn.removeEventListener('click', setupScene);
      playBtn.removeEventListener('click', enterGameMode);
      cancelAnimationFrame(animationFrameId);
    };
  }, [setupScene, enterGameMode, gameState]);

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
}

export default App;
