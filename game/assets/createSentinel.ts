import * as THREE from 'three';

export const createSentinel = (
    bodyMaterial: THREE.Material, 
    eyeMaterial: THREE.Material
) => {
    const group = new THREE.Group();
    
    const bodySize = 0.8;
    // Main Body
    const bodyGeom = new THREE.IcosahedronGeometry(bodySize / 2, 1);
    const body = new THREE.Mesh(bodyGeom, bodyMaterial);
    body.name = "body";
    group.add(body);
    
    // "Eye" that will track player
    const eyeGeom = new THREE.SphereGeometry(bodySize / 4, 16, 16);
    const eye = new THREE.Mesh(eyeGeom, eyeMaterial);
    eye.name = "eye";
    eye.position.z = -bodySize / 2.5;
    body.add(eye);
    
    // Floating panels
    const panelGeom = new THREE.BoxGeometry(bodySize * 0.4, bodySize * 0.1, bodySize * 0.4);
    const panelPositions = [
      new THREE.Vector3(bodySize * 0.7, bodySize * 0.7, 0),
      new THREE.Vector3(-bodySize * 0.7, bodySize * 0.7, 0),
      new THREE.Vector3(bodySize * 0.7, -bodySize * 0.7, 0),
      new THREE.Vector3(-bodySize * 0.7, -bodySize * 0.7, 0),
    ];
    
    panelPositions.forEach((pos, i) => {
        const panel = new THREE.Mesh(panelGeom, bodyMaterial);
        panel.name = `panel${i}`;
        panel.position.copy(pos);
        panel.lookAt(body.position);
        group.add(panel);
    });

    return group;
}
