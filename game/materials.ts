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

    const doorTexture = Textures.generateDoorTexture();
    const boneTexture = Textures.generateBoneTexture();
    const barrelTextures = Textures.generateBarrelTexture();
    const barrelTopTextures = Textures.generateBarrelTopTexture();
    const paperTextures = Textures.generatePaperTexture();
    const bulletDecalTexture = Textures.generateBulletDecalTexture();

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
        door: new THREE.MeshStandardMaterial({ map: doorTexture.map, normalMap: doorTexture.normalMap, normalScale: new THREE.Vector2(1.0, 1.0), roughness: 0.6, metalness: 0.7 }),
        bone: new THREE.MeshStandardMaterial({ map: boneTexture.map, normalMap: boneTexture.normalMap, normalScale: new THREE.Vector2(0.7, 0.7), roughness: 0.8 }),
        clutter: {
            barrel: new THREE.MeshStandardMaterial({ map: barrelTextures.map, normalMap: barrelTextures.normalMap, normalScale: new THREE.Vector2(0.8, 0.8), roughness: 0.7 }),
            barrelTop: new THREE.MeshStandardMaterial({ map: barrelTopTextures.map, normalMap: barrelTopTextures.normalMap, normalScale: new THREE.Vector2(0.6, 0.6), roughness: 0.7 }),
            debris: new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9 }),
            paper: new THREE.MeshStandardMaterial({ map: paperTextures.map, normalMap: paperTextures.normalMap, normalScale: new THREE.Vector2(0.2, 0.2), side: THREE.DoubleSide }),
            lamp: new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.4, metalness: 0.8 }),
            lampBulb: new THREE.MeshStandardMaterial({ color: 0xffffee, emissive: 0xffffee, emissiveIntensity: 1 }),
        },
        decal: new THREE.MeshStandardMaterial({
            map: bulletDecalTexture,
            transparent: true,
            polygonOffset: true,
            polygonOffsetFactor: -4,
            depthWrite: false, // Prevents transparent parts from incorrectly occluding objects behind them
        }),
        playerLight: new THREE.SpotLight(0xfff0d1, 12, 35, Math.PI / 6, 0.2, 2),
    };
};
