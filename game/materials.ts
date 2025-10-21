import * as THREE from 'three';
import * as Textures from './textures';

export const createMaterials = () => {
    const wallTextures = {
        brick: Textures.generateBrickTexture(),
        wood: Textures.generateWoodPlankTexture(false),
        stone: Textures.generateStoneWallTexture(),
        metal: Textures.generateMetalPanelTexture(),
        concrete: Textures.generateStainedConcreteTexture(),
    };

    const floorTextures = {
        cement: Textures.generateCementTexture(),
        wood: Textures.generateWoodPlankTexture(true),
        dirt: Textures.generateDirtTexture(),
    };

    const doorTextures = {
        red: Textures.generateColoredDoorTexture(new THREE.Color('#d32f2f')),
        green: Textures.generateColoredDoorTexture(new THREE.Color('#388e3c')),
        blue: Textures.generateColoredDoorTexture(new THREE.Color('#1976d2')),
        yellow: Textures.generateColoredDoorTexture(new THREE.Color('#fbc02d')),
    };
    
    const keyTextures = {
        red: Textures.generateKeycardTexture(new THREE.Color('#d32f2f')),
        green: Textures.generateKeycardTexture(new THREE.Color('#388e3c')),
        blue: Textures.generateKeycardTexture(new THREE.Color('#1976d2')),
        yellow: Textures.generateKeycardTexture(new THREE.Color('#fbc02d')),
    };

    const exitDoorTexture = Textures.generateExitDoorTexture();
    const boneTexture = Textures.generateBoneTexture();
    const barrelTextures = Textures.generateBarrelTexture();
    const barrelTopTextures = Textures.generateBarrelTopTexture();
    const paperTextures = Textures.generatePaperTexture();
    const bulletDecalTextures = Textures.generateBulletDecalTexture();
    const chitinTexture = Textures.generateChitinTexture();
    const droneTexture = Textures.generateDroneTexture();

    const createDoorMaterial = (textures: {map: THREE.CanvasTexture, normalMap: THREE.CanvasTexture}) => 
        new THREE.MeshStandardMaterial({ map: textures.map, normalMap: textures.normalMap, normalScale: new THREE.Vector2(1.0, 1.0), roughness: 0.6, metalness: 0.7 });

    const createKeyMaterial = (textures: {map: THREE.CanvasTexture}, color: THREE.Color) =>
        new THREE.MeshStandardMaterial({ map: textures.map, roughness: 0.4, metalness: 0.5, color, emissive: color, emissiveIntensity: 0.5 });

    return {
        wall: {
            brick: new THREE.MeshStandardMaterial({ map: wallTextures.brick.map, normalMap: wallTextures.brick.normalMap, normalScale: new THREE.Vector2(0.8, 0.8), roughness: 0.8 }),
            wood: new THREE.MeshStandardMaterial({ map: wallTextures.wood.map, normalMap: wallTextures.wood.normalMap, normalScale: new THREE.Vector2(0.6, 0.6), roughness: 0.7 }),
            stone: new THREE.MeshStandardMaterial({ map: wallTextures.stone.map, normalMap: wallTextures.stone.normalMap, normalScale: new THREE.Vector2(1.0, 1.0), roughness: 0.85 }),
            metal: new THREE.MeshStandardMaterial({ map: wallTextures.metal.map, normalMap: wallTextures.metal.normalMap, normalScale: new THREE.Vector2(0.5, 0.5), roughness: 0.4, metalness: 0.6 }),
            concrete: new THREE.MeshStandardMaterial({ map: wallTextures.concrete.map, normalMap: wallTextures.concrete.normalMap, normalScale: new THREE.Vector2(0.9, 0.9), roughness: 0.9 }),
        },
        floor: {
            cement: new THREE.MeshStandardMaterial({ map: floorTextures.cement.map, normalMap: floorTextures.cement.normalMap, normalScale: new THREE.Vector2(0.8, 0.8), roughness: 0.9, vertexColors: true }),
            wood: new THREE.MeshStandardMaterial({ map: floorTextures.wood.map, normalMap: floorTextures.wood.normalMap, normalScale: new THREE.Vector2(0.6, 0.6), roughness: 0.7, vertexColors: true }),
            dirt: new THREE.MeshStandardMaterial({ map: floorTextures.dirt.map, normalMap: floorTextures.dirt.normalMap, normalScale: new THREE.Vector2(1.2, 1.2), roughness: 0.95, vertexColors: true }),
        },
        door: {
            red: createDoorMaterial(doorTextures.red),
            green: createDoorMaterial(doorTextures.green),
            blue: createDoorMaterial(doorTextures.blue),
            yellow: createDoorMaterial(doorTextures.yellow),
        },
        key: {
            red: createKeyMaterial(keyTextures.red, new THREE.Color('#d32f2f')),
            green: createKeyMaterial(keyTextures.green, new THREE.Color('#388e3c')),
            blue: createKeyMaterial(keyTextures.blue, new THREE.Color('#1976d2')),
            yellow: createKeyMaterial(keyTextures.yellow, new THREE.Color('#fbc02d')),
        },
        exitDoor: new THREE.MeshStandardMaterial({ map: exitDoorTexture.map, normalMap: exitDoorTexture.normalMap, emissiveMap: exitDoorTexture.map, emissive: 0xffffff, emissiveIntensity: 0.8, roughness: 0.7, metalness: 0.8 }),
        bone: new THREE.MeshStandardMaterial({ map: boneTexture.map, normalMap: boneTexture.normalMap, normalScale: new THREE.Vector2(0.7, 0.7), roughness: 0.8 }),
        enemy: {
            scuttlerBody: new THREE.MeshStandardMaterial({ map: chitinTexture.map, normalMap: chitinTexture.normalMap, normalScale: new THREE.Vector2(0.8, 0.8), roughness: 0.8 }),
            scuttlerLegs: new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 }),
            sentinelBody: new THREE.MeshStandardMaterial({ map: droneTexture.map, normalMap: droneTexture.normalMap, normalScale: new THREE.Vector2(0.5, 0.5), roughness: 0.4, metalness: 0.7 }),
            sentinelEye: new THREE.MeshStandardMaterial({ color: 0xff2222, emissive: 0xff0000, emissiveIntensity: 2, roughness: 0.2, metalness: 0.1 }),
        },
        clutter: {
            barrel: new THREE.MeshStandardMaterial({ map: barrelTextures.map, normalMap: barrelTextures.normalMap, normalScale: new THREE.Vector2(0.8, 0.8), roughness: 0.7 }),
            barrelTop: new THREE.MeshStandardMaterial({ map: barrelTopTextures.map, normalMap: barrelTopTextures.normalMap, normalScale: new THREE.Vector2(0.6, 0.6), roughness: 0.7 }),
            debris: new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9 }),
            paper: new THREE.MeshStandardMaterial({ map: paperTextures.map, normalMap: paperTextures.normalMap, normalScale: new THREE.Vector2(0.2, 0.2), side: THREE.DoubleSide }),
            lamp: new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.4, metalness: 0.8 }),
            lampBulb: new THREE.MeshStandardMaterial({ color: 0xffffee, emissive: 0xffffee, emissiveIntensity: 1 }),
        },
        decal: new THREE.MeshStandardMaterial({
            map: bulletDecalTextures.map,
            normalMap: bulletDecalTextures.normalMap,
            normalScale: new THREE.Vector2(1.5, 1.5),
            transparent: true,
            polygonOffset: true,
            polygonOffsetFactor: -4,
            depthWrite: false,
        }),
        playerLight: new THREE.SpotLight(0xfff0d1, 12, 35, Math.PI / 6, 0.2, 2),
    };
};