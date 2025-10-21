import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE, WALL_HEIGHT } from './constants';

function addVertexColors(geometry: THREE.BufferGeometry, lightPositions: THREE.Vector3[]) {
    geometry.computeBoundingBox();
    const box = geometry.boundingBox!;
    const positions = geometry.attributes.position;
    const colors = [];
    const vertex = new THREE.Vector3();
    const ambientLight = 0.15;
    const lightRange = TILE_SIZE * 4;
    const lightStrength = 1.2;

    for (let i = 0; i < positions.count; i++) {
        vertex.fromBufferAttribute(positions, i);
        let maxIntensity = 0;

        if (lightPositions.length > 0) {
            for (const lightPos of lightPositions) {
                const distance = vertex.distanceTo(lightPos);
                const intensity = Math.pow(Math.max(0, 1 - distance / lightRange), 1.8) * lightStrength;
                if (intensity > maxIntensity) {
                    maxIntensity = intensity;
                }
            }
        }
        
        const finalIntensity = Math.min(1.0, ambientLight + maxIntensity);
        colors.push(finalIntensity, finalIntensity, finalIntensity);
    }
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
}

export function buildLevel(
    levelContainer: THREE.Group,
    levelData: { grid: number[][], rooms: any[], doors: any[], keys: any[], exit: any, switch: any },
    materials: any
) {
    const { grid, rooms, doors: doorLocations, keys: keyLocations, exit: exitLocation, switch: switchLocation } = levelData;

    const floorTiles: {x: number, z: number}[] = [];
    const roomMap = Array(MAP_WIDTH).fill(null).map(() => Array(MAP_HEIGHT).fill(-1));
    const wallThemeNames = Object.keys(materials.wall);
    const floorThemeNames = Object.keys(materials.floor);

    rooms.forEach((room, index) => {
        room.wallTheme = wallThemeNames[Math.floor(Math.random() * wallThemeNames.length)];
        room.floorTheme = floorThemeNames[Math.floor(Math.random() * floorThemeNames.length)];
        for (let y = room.y; y < room.y + room.height; y++) {
            for (let x = room.x; x < room.x + room.width; x++) {
                roomMap[x][y] = index;
            }
        }
    });
    
    const lampPositions: THREE.Vector3[] = [];
    rooms.forEach(room => {
        const lampCount = Math.max(1, Math.floor((room.width * room.height) / 20));
        for (let i = 0; i < lampCount; i++) {
            const tileX = room.x + Math.floor(Math.random() * room.width);
            const tileZ = room.y + Math.floor(Math.random() * room.height);
            const worldX = (tileX - MAP_WIDTH / 2) * TILE_SIZE + TILE_SIZE / 2;
            const worldZ = (tileZ - MAP_HEIGHT / 2) * TILE_SIZE + TILE_SIZE / 2;
            lampPositions.push(new THREE.Vector3(worldX, WALL_HEIGHT - 0.5, worldZ));
        }
    });

    const wallGeometry = new THREE.BoxGeometry(TILE_SIZE, WALL_HEIGHT, TILE_SIZE);
    const matrix = new THREE.Matrix4();
    const wallMatrices: { [key: string]: THREE.Matrix4[] } = Object.fromEntries(wallThemeNames.map(name => [name, []]));
    const floorGeometries: { [key: string]: THREE.BufferGeometry[] } = Object.fromEntries(floorThemeNames.map(name => [name, []]));
    const ceilingGeometries: { [key: string]: THREE.BufferGeometry[] } = Object.fromEntries(floorThemeNames.map(name => [name, []]));

    for (let i = 0; i < MAP_WIDTH; i++) {
        for (let j = 0; j < MAP_HEIGHT; j++) {
            const worldX = (i - MAP_WIDTH / 2) * TILE_SIZE + TILE_SIZE / 2;
            const worldZ = (j - MAP_HEIGHT / 2) * TILE_SIZE + TILE_SIZE / 2;

            if (grid[i][j] === 1) { // Floor
                floorTiles.push({ x: i, z: j });
                let tileFloorTheme = roomMap[i][j] !== -1 ? rooms[roomMap[i][j]].floorTheme! : 'cement';
                
                const floorGeom = new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE);
                floorGeom.rotateX(-Math.PI / 2);
                floorGeom.translate(worldX, 0, worldZ);
                addVertexColors(floorGeom, lampPositions);
                floorGeometries[tileFloorTheme].push(floorGeom);
                
                const ceilingGeom = new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE);
                ceilingGeom.rotateX(Math.PI / 2);
                ceilingGeom.translate(worldX, WALL_HEIGHT, worldZ);
                addVertexColors(ceilingGeom, lampPositions);
                ceilingGeometries[tileFloorTheme].push(ceilingGeom);

            } else { // Wall
                const isVisible = (grid[i+1]?.[j] === 1) || (grid[i-1]?.[j] === 1) || (grid[i][j+1] === 1) || (grid[i][j-1] === 1);
                if (!isVisible) continue;

                let wallTheme = 'brick';
                for(const [nx, ny] of [[i+1, j], [i-1, j], [i, j+1], [i, j-1]]) {
                    if(grid[nx]?.[ny] === 1 && roomMap[nx][ny] !== -1) {
                        wallTheme = rooms[roomMap[nx][ny]].wallTheme!;
                        break;
                    }
                }
                
                matrix.setPosition(worldX, WALL_HEIGHT / 2, worldZ);
                wallMatrices[wallTheme].push(matrix.clone());
            }
        }
    }

    for (const theme of wallThemeNames) {
        if (wallMatrices[theme].length > 0) {
            const instancedMesh = new THREE.InstancedMesh(wallGeometry, materials.wall[theme], wallMatrices[theme].length);
            wallMatrices[theme].forEach((mat, i) => instancedMesh.setMatrixAt(i, mat));
            levelContainer.add(instancedMesh);
        }
    }
    
    for (const theme of floorThemeNames) {
        if (floorGeometries[theme].length > 0) {
            const mergedFloorGeom = BufferGeometryUtils.mergeGeometries(floorGeometries[theme]);
            const floorMesh = new THREE.Mesh(mergedFloorGeom, materials.floor[theme]);
            levelContainer.add(floorMesh);
        }
        if (ceilingGeometries[theme].length > 0) {
            const mergedCeilingGeom = BufferGeometryUtils.mergeGeometries(ceilingGeometries[theme]);
            const ceilingMesh = new THREE.Mesh(mergedCeilingGeom, materials.floor[theme]);
            levelContainer.add(ceilingMesh);
        }
    }

    lampPositions.forEach(pos => {
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), materials.clutter.lampBulb);
        bulb.position.copy(pos);
        bulb.position.y += 0.5;
        levelContainer.add(bulb);
    });

    const doors: THREE.Mesh[] = [];
    const doorGeom = new THREE.BoxGeometry(TILE_SIZE, WALL_HEIGHT, 0.5);
    doorLocations.forEach((loc: { x: number, y: number, orientation: string, color: string }) => {
        const worldX = (loc.x - MAP_WIDTH / 2) * TILE_SIZE + TILE_SIZE / 2;
        const worldZ = (loc.y - MAP_HEIGHT / 2) * TILE_SIZE + TILE_SIZE / 2;
        const door = new THREE.Mesh(doorGeom, materials.door[loc.color]);
        door.position.set(worldX, WALL_HEIGHT / 2, worldZ);
        if (loc.orientation === 'horizontal') {
            door.rotation.y = Math.PI / 2;
        }
        door.userData = {
            gridX: loc.x,
            gridZ: loc.y,
            state: 'closed',
            openY: WALL_HEIGHT * 1.5 - 0.1,
            closedY: WALL_HEIGHT / 2,
            color: loc.color,
        };
        levelContainer.add(door);
        doors.push(door);
    });

    const keys: THREE.Group[] = [];
    const keyGeom = new THREE.BoxGeometry(0.5, 0.8, 0.05);
    keyLocations.forEach((loc: { x: number, y: number, color: string }) => {
        const worldX = (loc.x - MAP_WIDTH / 2) * TILE_SIZE + TILE_SIZE / 2;
        const worldZ = (loc.y - MAP_HEIGHT / 2) * TILE_SIZE + TILE_SIZE / 2;
        const keyGroup = new THREE.Group();
        const keyMesh = new THREE.Mesh(keyGeom, materials.key[loc.color]);
        keyGroup.add(keyMesh);
        
        const light = new THREE.PointLight(materials.key[loc.color].color, 5, 4);
        keyGroup.add(light);

        keyGroup.position.set(worldX, 1.5, worldZ);
        keyGroup.userData = { color: loc.color };
        levelContainer.add(keyGroup);
        keys.push(keyGroup);
    });
    
    const exitGeom = new THREE.BoxGeometry(TILE_SIZE, WALL_HEIGHT, 0.5);
    const exitMesh = new THREE.Mesh(exitGeom, materials.exitDoor);
    const exitWorldX = (exitLocation.x - MAP_WIDTH / 2) * TILE_SIZE + TILE_SIZE / 2;
    const exitWorldZ = (exitLocation.y - MAP_HEIGHT / 2) * TILE_SIZE + TILE_SIZE / 2;
    exitMesh.position.set(exitWorldX, WALL_HEIGHT / 2, exitWorldZ);
    levelContainer.add(exitMesh);

    const switchBaseGeom = new THREE.CylinderGeometry(0.5, 0.7, 1.5, 16);
    const switchButtonGeom = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16);
    switchButtonGeom.translate(0, 0.75, 0);
    const switchBase = new THREE.Mesh(switchBaseGeom, materials.clutter.switchBase);
    const switchButton = new THREE.Mesh(switchButtonGeom, materials.clutter.switchButtonInactive);
    switchButton.name = 'switchButton';
    const switchGroup = new THREE.Group();
    switchGroup.add(switchBase, switchButton);
    const switchWorldX = (switchLocation.x - MAP_WIDTH / 2) * TILE_SIZE + TILE_SIZE / 2;
    const switchWorldZ = (switchLocation.y - MAP_HEIGHT / 2) * TILE_SIZE + TILE_SIZE / 2;
    switchGroup.position.set(switchWorldX, 0.75, switchWorldZ);
    levelContainer.add(switchGroup);


    return { floorTiles, doors, keys, exitMesh, switchMesh: switchGroup };
}