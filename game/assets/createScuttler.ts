import * as THREE from 'three';

export const createScuttler = (bodyMaterial: THREE.Material, legMaterial: THREE.Material) => {
    const group = new THREE.Group();

    const bodyWidth = 0.5;
    const bodyHeight = 0.3;
    const bodyLength = 0.8;

    // Body
    const bodyGeom = new THREE.CapsuleGeometry(bodyWidth / 2, bodyLength - bodyWidth, 4, 8);
    bodyGeom.rotateX(Math.PI / 2);
    const body = new THREE.Mesh(bodyGeom, bodyMaterial);
    body.name = "body";
    body.position.y = bodyHeight;
    group.add(body);
    
    // Head
    const headGeom = new THREE.SphereGeometry(bodyWidth/2 * 0.8, 8, 8);
    const head = new THREE.Mesh(headGeom, bodyMaterial);
    head.position.set(0, bodyHeight, -bodyLength/2);
    group.add(head);

    // Legs
    const legLength = 0.6;
    const legWidth = 0.05;
    const createLeg = () => {
        const legGroup = new THREE.Group();
        const upperGeom = new THREE.BoxGeometry(legWidth, legLength / 2, legWidth);
        upperGeom.translate(0, -legLength/4, 0);
        const upperLeg = new THREE.Mesh(upperGeom, legMaterial);

        const lowerGeom = new THREE.BoxGeometry(legWidth, legLength / 2, legWidth);
        lowerGeom.translate(0, -legLength/4, 0);
        const lowerLeg = new THREE.Mesh(lowerGeom, legMaterial);
        lowerLeg.position.y = -legLength/2;
        lowerLeg.rotation.x = -Math.PI / 4;
        
        upperLeg.add(lowerLeg);
        legGroup.add(upperLeg);
        return legGroup;
    }

    const legPositions = [
        { x: -bodyWidth/2, z: -bodyLength/4, rotY: Math.PI / 4 },
        { x: bodyWidth/2, z: -bodyLength/4, rotY: -Math.PI / 4 },
        { x: -bodyWidth/2, z: 0, rotY: Math.PI / 2 },
        { x: bodyWidth/2, z: 0, rotY: -Math.PI / 2 },
        { x: -bodyWidth/2, z: bodyLength/4, rotY: Math.PI * 3/4 },
        { x: bodyWidth/2, z: bodyLength/4, rotY: -Math.PI * 3/4 },
    ];
    
    legPositions.forEach((pos, i) => {
        const leg = createLeg();
        leg.name = `leg${i}`;
        leg.position.set(pos.x, bodyHeight, pos.z);
        (leg.children[0] as THREE.Mesh).rotation.z = pos.rotY;
        group.add(leg);
    });

    return group;
}
