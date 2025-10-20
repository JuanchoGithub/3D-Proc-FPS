
import * as THREE from 'three';

export const createSkeleton = (
    boneMaterial: THREE.Material, 
    shirtMaterial: THREE.Material, 
    pantsMaterial: THREE.Material, 
    shoeMaterial: THREE.Material
) => {
    const skeletonGroup = new THREE.Group();

    const headSize = 0.3;
    const torsoHeight = 0.8;
    const torsoWidth = 0.6;
    const legLength = 1.0;
    const armLength = 0.9;
    const limbWidth = 0.15;

    // Simple limb with origin at the top
    const createLimb = (length: number, width: number, material: THREE.Material) => {
        const limb = new THREE.Mesh(new THREE.BoxGeometry(width, length, width), material);
        limb.geometry.translate(0, -length / 2, 0);
        return limb;
    };

    // --- Body Parts ---
    // Legs
    const leftLeg = createLimb(legLength, limbWidth * 1.2, boneMaterial);
    leftLeg.name = 'leftLeg';
    leftLeg.position.set(-torsoWidth / 4, legLength, 0);
    skeletonGroup.add(leftLeg);

    const rightLeg = createLimb(legLength, limbWidth * 1.2, boneMaterial);
    rightLeg.name = 'rightLeg';
    rightLeg.position.set(torsoWidth / 4, legLength, 0);
    skeletonGroup.add(rightLeg);
    
    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(torsoWidth, torsoHeight, torsoWidth * 0.5), boneMaterial);
    torso.name = 'torso';
    torso.position.y = legLength + torsoHeight / 2;
    skeletonGroup.add(torso);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(headSize, 12, 12), boneMaterial);
    head.position.y = legLength + torsoHeight + headSize;
    skeletonGroup.add(head);

    // Arms
    const leftArm = createLimb(armLength, limbWidth, boneMaterial);
    leftArm.name = 'leftArm';
    leftArm.position.set(-torsoWidth/2 - limbWidth, legLength + torsoHeight, 0);
    skeletonGroup.add(leftArm);

    const rightArm = createLimb(armLength, limbWidth, boneMaterial);
    rightArm.name = 'rightArm';
    rightArm.position.set(torsoWidth/2 + limbWidth, legLength + torsoHeight, 0);
    skeletonGroup.add(rightArm);
    
    // --- Clothing ---
    // Shirt
    const shirtGeom = new THREE.BoxGeometry(torsoWidth * 1.05, torsoHeight * 1.05, torsoWidth * 0.5 * 1.05);
    const shirt = new THREE.Mesh(shirtGeom, shirtMaterial);
    shirt.position.copy(torso.position);
    skeletonGroup.add(shirt);

    // Pants (Jeans or Shorts)
    const arePantsLong = Math.random() > 0.5;
    const pantLength = arePantsLong ? legLength * 0.95 : legLength * 0.4;
    const pantWidth = limbWidth * 1.2 * 1.1;

    const createPantLeg = () => {
        const pantLegGeom = new THREE.BoxGeometry(pantWidth, pantLength, pantWidth);
        pantLegGeom.translate(0, -pantLength / 2, 0);
        return new THREE.Mesh(pantLegGeom, pantsMaterial);
    };

    const leftPantLeg = createPantLeg();
    leftPantLeg.position.copy(leftLeg.position);
    skeletonGroup.add(leftPantLeg);

    const rightPantLeg = createPantLeg();
    rightPantLeg.position.copy(rightLeg.position);
    skeletonGroup.add(rightPantLeg);

    // Shoes
    const shoeHeight = 0.25;
    const shoeWidth = limbWidth * 1.2 * 1.15;
    const shoeLength = shoeWidth * 1.2;
    const shoeGeom = new THREE.BoxGeometry(shoeWidth, shoeHeight, shoeLength);
    shoeGeom.translate(0, shoeHeight / 2, shoeLength * 0.1); // Shift forward slightly

    const leftShoe = new THREE.Mesh(shoeGeom, shoeMaterial);
    leftShoe.position.set(leftLeg.position.x, 0, leftLeg.position.z);
    skeletonGroup.add(leftShoe);
    
    const rightShoe = new THREE.Mesh(shoeGeom, shoeMaterial);
    rightShoe.position.set(rightLeg.position.x, 0, rightLeg.position.z);
    skeletonGroup.add(rightShoe);
    
    return skeletonGroup;
};
