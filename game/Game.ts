import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE, WALL_HEIGHT } from './constants';
import { generateLevel } from './levelGenerator';
import { createMaterials } from './materials';
import { buildLevel } from './LevelBuilder';
import Player from './Player';
import EnemyManager from './EnemyManager';
import { generateProceduralGun } from './assets/procedural-gun';
import { playDoorLocked, playGunshot, playKeyPickup, playSwitchActivate } from './sfx';
import type { RefObject } from 'react';

export type GameState = 'menu' | 'generating' | 'preview' | 'playing' | 'won';

export default class Game {
    private mount: HTMLDivElement;
    private stateChangeCallback: (newState: GameState, data?: any) => void;
    private mapCanvasRef: RefObject<HTMLCanvasElement>;

    private renderer!: THREE.WebGLRenderer;
    private scene!: THREE.Scene;
    private perspectiveCamera!: THREE.PerspectiveCamera;
    private orthographicCamera!: THREE.OrthographicCamera;
    private controls!: PointerLockControls;
    
    private materials: any;
    private player!: Player;
    private enemyManager!: EnemyManager;

    private levelContainer: THREE.Group | null = null;
    private levelData: any = {};
    private bullets: THREE.Mesh[] = [];
    private deadParts: any[] = [];
    private decals: any[] = [];
    private keys: { [key: string]: boolean } = {};
    private isMapVisible = false;
    private isSprinting = false;
    private lastTime = 0;
    private animationFrameId!: number;

    private state: GameState = 'menu';
    private playerGuns: any[] = [];
    private currentGunIndex = 0;
    private lastShotTime = 0;
    
    public ui: { gunSprite: HTMLImageElement | null } = { gunSprite: null };

    constructor(mount: HTMLDivElement, stateChangeCallback: (newState: GameState, data?: any) => void, mapCanvasRef: RefObject<HTMLCanvasElement>) {
        this.mount = mount;
        this.stateChangeCallback = stateChangeCallback;
        this.mapCanvasRef = mapCanvasRef;
    }

    public init() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x101010);
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.mount.clientWidth, this.mount.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.mount.appendChild(this.renderer.domElement);

        this.perspectiveCamera = new THREE.PerspectiveCamera(75, this.mount.clientWidth / this.mount.clientHeight, 0.1, 1000);
        
        const aspect = this.mount.clientWidth / this.mount.clientHeight;
        const width = MAP_WIDTH * TILE_SIZE;
        const height = MAP_HEIGHT * TILE_SIZE;
        this.orthographicCamera = new THREE.OrthographicCamera(width / -2, width / 2, height / (2 * aspect), height / (-2 * aspect), 1, 1000);
        this.orthographicCamera.position.y = 50;
        this.orthographicCamera.lookAt(0, 0, 0);

        this.controls = new PointerLockControls(this.perspectiveCamera, this.renderer.domElement);
        this.scene.add(this.perspectiveCamera);
        this.controls.addEventListener('lock', this.onLock);
        this.controls.addEventListener('unlock', this.onUnlock);

        this.materials = createMaterials();
        this.player = new Player(this.perspectiveCamera, this.controls, this.scene, this.materials.playerLight);
        this.enemyManager = new EnemyManager(this.scene, this.materials);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.03);
        this.scene.add(ambientLight);

        this.animate();
    }
    
    private setState(newState: GameState, data?: any) {
        this.state = newState;
        this.stateChangeCallback(newState, data);
    }

    private setObjective(text: string) {
        this.stateChangeCallback(this.state, { objectiveText: text });
    }
    
    public async generateNewLevel() {
        if (this.state === 'generating') return;
        this.setState('generating', { subtitle: 'Generating level...' });

        if (this.levelContainer) {
            this.scene.remove(this.levelContainer);
        }
        this.levelData = {};

        const levelGenData = generateLevel();
        this.levelData = { ...this.levelData, ...levelGenData };
        
        this.levelContainer = new THREE.Group();
        this.scene.add(this.levelContainer);

        await new Promise(resolve => setTimeout(resolve, 10));

        const buildResult = buildLevel(this.levelContainer, levelGenData, this.materials);
        this.levelData = { ...this.levelData, ...buildResult };

        this.playerGuns = Array.from({ length: 10 }, () => generateProceduralGun());
        
        const initialKeys: { [color: string]: boolean } = {};
        this.levelData.keyColors.forEach((color: string) => initialKeys[color] = false);

        this.setState('preview', { 
            subtitle: 'Level generated. Press Play!',
            guns: this.playerGuns,
            playerKeys: initialKeys,
        });
    }

    public startGame() {
        if (this.state !== 'preview') return;
        this.enemyManager.clearEnemies();

        const spawnPos = new THREE.Vector3(
            (this.levelData.spawn.x - MAP_WIDTH / 2) * TILE_SIZE + TILE_SIZE / 2,
            WALL_HEIGHT / 2,
            (this.levelData.spawn.y - MAP_HEIGHT / 2) * TILE_SIZE + TILE_SIZE / 2
        );
        this.player.spawn(spawnPos, this.levelData.keyColors);
        
        this.enemyManager.spawnEnemies(this.levelData.floorTiles, this.levelData.spawn, this.levelData.grid);
        
        this.bullets.forEach(b => this.scene.remove(b));
        this.bullets = [];

        this.deadParts.forEach(p => this.scene.remove(p.mesh));
        this.deadParts = [];

        this.decals.forEach(d => this.scene.remove(d.mesh));
        this.decals = [];

        this.lastShotTime = 0;
        this.levelData.switchActivated = false;

        const initialKeys: { [color: string]: boolean } = {};
        this.levelData.keyColors.forEach((color: string) => initialKeys[color] = false);
        this.stateChangeCallback('playing', { playerKeys: initialKeys });
        this.setObjective(this.levelData.keyColors.length > 0 ? 'Find the colored keys to proceed.' : 'Find and activate the main switch.');

        this.controls.lock();
    }
    
    private getCollision = (posX: number, posZ: number): { type: 'wall' | 'door', object?: THREE.Object3D } | null => {
        const gridX = Math.floor((posX / TILE_SIZE) + MAP_WIDTH / 2);
        const gridZ = Math.floor((posZ / TILE_SIZE) + MAP_HEIGHT / 2);

        if (gridX < 0 || gridX >= MAP_WIDTH || gridZ < 0 || gridZ >= MAP_HEIGHT) {
            return { type: 'wall' };
        }

        if (this.levelData.grid[gridX]?.[gridZ] === 0) {
            return { type: 'wall' };
        }
        
        const door = this.levelData.doors.find((d: THREE.Mesh) => d.userData.gridX === gridX && d.userData.gridZ === gridZ);
        if (door && (door.userData.state === 'closed' || door.userData.state === 'closing')) {
            return { type: 'door', object: door };
        }
        
        return null;
    };
    
    private isCollision = (posX: number, posZ: number) => {
        return this.getCollision(posX, posZ) !== null;
    };

    private updateDoorState(delta: number, time: number) {
        const doorSpeed = 8.0;
        this.levelData.doors.forEach((door: THREE.Mesh) => {
            let targetY = door.position.y;
            if (door.userData.state === 'opening') {
                targetY = door.userData.openY;
                if (Math.abs(door.position.y - targetY) < 0.01) { 
                    door.userData.state = 'open';
                    door.position.y = targetY;
                    door.userData.openTime = time;
                }
            } else if (door.userData.state === 'closing') {
                targetY = door.userData.closedY;
                if (Math.abs(door.position.y - targetY) < 0.01) { 
                    door.userData.state = 'closed';
                    door.position.y = targetY;
                    delete door.userData.openTime;
                }
            } else if (door.userData.state === 'open' && !door.userData.permanent && door.userData.openTime && time > door.userData.openTime + 5000) {
                door.userData.state = 'closing';
            }

            if (door.position.y !== targetY) {
                door.position.y = THREE.MathUtils.lerp(door.position.y, targetY, delta * doorSpeed);
            }
        });
    }
    
    private createBulletDecal(position: THREE.Vector3, velocity: THREE.Vector3) {
        const decalSize = Math.random() * 0.4 + 0.3;
        const decalGeometry = new THREE.PlaneGeometry(decalSize, decalSize);
        const decalMaterial = this.materials.decal.clone();
        const decal = new THREE.Mesh(decalGeometry, decalMaterial);
        
        const normal = new THREE.Vector3();
        if (Math.abs(velocity.x) > Math.abs(velocity.z)) {
            normal.set(-Math.sign(velocity.x), 0, 0);
        } else {
            normal.set(0, 0, -Math.sign(velocity.z));
        }
        
        decal.position.copy(position).add(normal.clone().multiplyScalar(0.01));

        decal.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
        decal.rotateZ(Math.random() * Math.PI * 2);
        
        this.scene.add(decal);
        this.decals.push({ mesh: decal, lifetime: 15.0 + Math.random() * 10 });
    }

    private updateBullets(delta: number) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            const prevPos = bullet.position.clone();
            bullet.position.addScaledVector(bullet.userData.velocity, delta);
            let hit = false;

            const collision = this.getCollision(bullet.position.x, bullet.position.z);
            if (collision?.type === 'wall' || (collision?.type === 'door' && collision.object?.userData.state === 'closed')) {
                this.createBulletDecal(bullet.position.clone(), bullet.userData.velocity);
                hit = true;
            }

            if (!hit) {
                 const hitEnemy = this.enemyManager.checkHit(bullet.position);
                if (hitEnemy) {
                    const newParts = this.enemyManager.killEnemy(hitEnemy, bullet.userData.velocity);
                    this.deadParts.push(...newParts);
                    hit = true;
                }
            }

            if (hit || bullet.position.distanceTo(this.perspectiveCamera.position) > 100) {
              this.scene.remove(bullet); 
              this.bullets.splice(i, 1);
            }
        }
    }

    private updateDeadParts(delta: number) {
        const gravity = -15.0;
        for (let i = this.deadParts.length - 1; i >= 0; i--) {
            const part = this.deadParts[i];
            part.lifetime -= delta;

            if (part.lifetime <= 0) {
                this.scene.remove(part.mesh);
                part.mesh.geometry.dispose();
                (part.mesh.material as THREE.Material).dispose();
                this.deadParts.splice(i, 1);
                continue;
            }

            if (part.lifetime < 1.0) {
                const material = part.mesh.material as THREE.MeshStandardMaterial;
                if (!material.transparent) material.transparent = true;
                material.opacity = part.lifetime;
            }
            
            part.velocity.y += gravity * delta;
            part.mesh.position.addScaledVector(part.velocity, delta);
            const deltaRotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(part.angularVelocity.x * delta, part.angularVelocity.y * delta, part.angularVelocity.z * delta));
            part.mesh.quaternion.multiplyQuaternions(deltaRotation, part.mesh.quaternion);

            if (part.mesh.position.y < 0) {
                part.mesh.position.y = 0;
                part.velocity.y *= -0.4;
                part.velocity.x *= 0.8;
                part.velocity.z *= 0.8;
                part.angularVelocity.multiplyScalar(0.8);
            }
        }
    }

    private updateDecals(delta: number) {
        for (let i = this.decals.length - 1; i >= 0; i--) {
            const decal = this.decals[i];
            decal.lifetime -= delta;

            if (decal.lifetime <= 0) {
                this.scene.remove(decal.mesh);
                decal.mesh.geometry.dispose();
                (decal.mesh.material as THREE.Material).dispose();
                this.decals.splice(i, 1);
                continue;
            }

            if (decal.lifetime < 1.0) {
                (decal.mesh.material as THREE.MeshStandardMaterial).opacity = decal.lifetime;
            }
        }
    }

    private updateInteractables(delta: number) {
        // Key collection
        for(let i = this.levelData.keys.length - 1; i >= 0; i--) {
            const keyObject = this.levelData.keys[i];
            keyObject.rotation.y += delta * 1.5;
            keyObject.position.y = 1.5 + Math.sin(performance.now() / 500 + keyObject.userData.color.length) * 0.2;

            if (keyObject.position.distanceTo(this.player.camera.position) < 2.0) {
                const color = keyObject.userData.color;
                this.player.collectedKeys[color] = true;
                playKeyPickup();
                
                if (this.levelContainer) this.levelContainer.remove(keyObject);
                this.levelData.keys.splice(i, 1);

                const allKeysCollected = this.levelData.keyColors.every((c: string) => this.player.collectedKeys[c]);
                if (allKeysCollected) {
                    this.setObjective('All keys found! Find and activate the main switch.');
                }

                this.stateChangeCallback('playing', { playerKeys: { ...this.player.collectedKeys } });
            }
        }

        // Switch interaction
        if (!this.levelData.switchActivated && this.levelData.switchMesh && this.keys['Space']) {
            if (this.levelData.switchMesh.position.distanceTo(this.player.camera.position) < 2.5) {
                this.levelData.switchActivated = true;
                const button = this.levelData.switchMesh.getObjectByName('switchButton');
                if (button) (button as THREE.Mesh).material = this.materials.clutter.switchButtonActive;
                playSwitchActivate();
                this.setObjective('Switch activated! Find the exit.');
            }
        }

        // Exit interaction
        if (this.keys['Space'] && this.levelData.exitMesh) {
            if (this.levelData.exitMesh.position.distanceTo(this.player.camera.position) < 3.0) {
                if (this.levelData.switchActivated) {
                    this.setState('won', { subtitle: 'You found the exit! Generate a new level to play again.' });
                    this.controls.unlock();
                } else {
                    this.setObjective('Exit is locked. You must activate the main switch first.');
                    playDoorLocked();
                }
            }
        }
    }
    
    private updateMap() {
        if (!this.mapCanvasRef.current) return;
        const mapCtx = this.mapCanvasRef.current.getContext('2d');
        if (!mapCtx) return;

        const canvas = mapCtx.canvas;
        mapCtx.fillStyle = '#222';
        mapCtx.fillRect(0, 0, canvas.width, canvas.height);

        const mapTileSize = canvas.width / MAP_WIDTH;
        mapCtx.fillStyle = '#555';
        for(let i = 0; i < MAP_WIDTH; i++) {
            for(let j = 0; j < MAP_HEIGHT; j++) {
                if(this.levelData.grid[i][j] === 1) {
                    mapCtx.fillRect(i * mapTileSize, j * mapTileSize, mapTileSize, mapTileSize);
                }
            }
        }
        
        // Draw Exit & Switch
        if (this.levelData.exitMesh) {
            const exit = this.levelData.exitMesh;
            const mapX = (exit.position.x / TILE_SIZE + MAP_WIDTH / 2) * mapTileSize;
            const mapZ = (exit.position.z / TILE_SIZE + MAP_HEIGHT / 2) * mapTileSize;
            mapCtx.fillStyle = '#4caf50'; // Green for exit
            mapCtx.fillRect(mapX - 3, mapZ - 3, 6, 6);
            mapCtx.strokeStyle = 'white';
            mapCtx.lineWidth = 1;
            mapCtx.strokeRect(mapX - 3, mapZ - 3, 6, 6);
        }
        if (this.levelData.switchMesh && !this.levelData.switchActivated) {
            const sw = this.levelData.switchMesh;
            const mapX = (sw.position.x / TILE_SIZE + MAP_WIDTH / 2) * mapTileSize;
            const mapZ = (sw.position.z / TILE_SIZE + MAP_HEIGHT / 2) * mapTileSize;
            mapCtx.fillStyle = '#f57c00'; // Orange for switch
            mapCtx.beginPath();
            mapCtx.moveTo(mapX, mapZ - 4);
            mapCtx.lineTo(mapX + 4, mapZ + 4);
            mapCtx.lineTo(mapX - 4, mapZ + 4);
            mapCtx.closePath();
            mapCtx.fill();
        }


        // Draw Doors
        this.levelData.doors.forEach((door: THREE.Mesh) => {
            if (door.userData.state === 'closed' || door.userData.state === 'closing') {
                const color = door.userData.color;
                const colorHex = { red: '#d32f2f', green: '#388e3c', blue: '#1976d2', yellow: '#fbc02d' }[color] || '#888';
                mapCtx.fillStyle = colorHex;
                const mapX = (door.position.x / TILE_SIZE + MAP_WIDTH / 2) * mapTileSize;
                const mapZ = (door.position.z / TILE_SIZE + MAP_HEIGHT / 2) * mapTileSize;
                const doorWidthOnMap = 2;
                if (door.rotation.y !== 0) { // Vertical door on map
                     mapCtx.fillRect(mapX - (doorWidthOnMap/2), mapZ - (mapTileSize / 2), doorWidthOnMap, mapTileSize);
                } else { // Horizontal door on map
                     mapCtx.fillRect(mapX - (mapTileSize / 2), mapZ - (doorWidthOnMap/2), mapTileSize, doorWidthOnMap);
                }
            }
        });
        
        // Draw keys
        const keyColorMap = {
            red: '#ff4d4d',
            green: '#4dff4d',
            blue: '#4d4dff',
            yellow: '#ffff4d'
        };
        this.levelData.keys.forEach((key: THREE.Group) => {
            const color = key.userData.color;
            mapCtx.fillStyle = keyColorMap[color] || '#ffffff';
            const mapX = (key.position.x / TILE_SIZE + MAP_WIDTH / 2) * mapTileSize;
            const mapZ = (key.position.z / TILE_SIZE + MAP_HEIGHT / 2) * mapTileSize;
            mapCtx.beginPath();
            mapCtx.arc(mapX, mapZ, 3, 0, Math.PI * 2);
            mapCtx.fill();
            mapCtx.strokeStyle = 'black';
            mapCtx.lineWidth = 1;
            mapCtx.stroke();
        });
        
        mapCtx.fillStyle = '#f44';
        this.enemyManager.enemies.forEach((enemy: THREE.Group) => {
            const mapX = (enemy.position.x / TILE_SIZE + MAP_WIDTH / 2) * mapTileSize;
            const mapZ = (enemy.position.z / TILE_SIZE + MAP_HEIGHT / 2) * mapTileSize;
            mapCtx.beginPath();
            mapCtx.arc(mapX, mapZ, 2, 0, Math.PI * 2);
            mapCtx.fill();
        });

        const playerMapX = (this.perspectiveCamera.position.x / TILE_SIZE + MAP_WIDTH / 2) * mapTileSize;
        const playerMapZ = (this.perspectiveCamera.position.z / TILE_SIZE + MAP_HEIGHT / 2) * mapTileSize;
        const forward = new THREE.Vector3();
        this.perspectiveCamera.getWorldDirection(forward);
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
    }


    private animate = () => {
        this.animationFrameId = requestAnimationFrame(this.animate);
        const time = performance.now();
        const delta = (this.lastTime ? (time - this.lastTime) : 0) / 1000;
        
        if (this.state === 'playing') {
            if (this.player.isDead) {
                this.controls.unlock();
                return;
            }

            this.player.update(delta, this.keys, this.isCollision, this.levelData.doors);
            this.updateDoorState(delta, time);
            if (this.levelContainer) {
              this.enemyManager.update(delta, this.player, this.isCollision, time, this.levelContainer);
            }
            const enemyBulletHits = this.enemyManager.updateEnemyBullets(delta, this.player, this.isCollision);
            enemyBulletHits.forEach(hit => this.createBulletDecal(hit.position, hit.velocity));
            this.updateBullets(delta);
            this.updateDeadParts(delta);
            this.updateDecals(delta);
            this.updateInteractables(delta);

            if(this.isMapVisible) this.updateMap();
            
            const isMoving = this.keys['KeyW'] || this.keys['KeyS'] || this.keys['KeyA'] || this.keys['KeyD'];
            this.stateChangeCallback('playing', { 
                isMoving,
                playerHealth: this.player.health,
                playerMaxHealth: this.player.maxHealth,
                playerKeys: this.player.collectedKeys,
            });
            
            this.renderer.render(this.scene, this.perspectiveCamera);
        } else {
             if(this.scene && this.orthographicCamera)
                this.renderer.render(this.scene, this.orthographicCamera);
        }

        this.lastTime = time;
    }
    
    private onLock = () => this.setState('playing');
    private onUnlock = () => {
        if(this.state === 'won') return;
        const subtitle = this.player.isDead 
            ? 'You died! Generate a new level to try again.'
            : 'Paused. Click to resume.';
        this.setState('menu', { subtitle, isMapVisible: false, objectiveText: '' });
    };

    public handleKeyDown = (event: KeyboardEvent) => {
        this.keys[event.code] = true;

        if (event.code === 'ShiftLeft' && this.state === 'playing') {
            this.isSprinting = true;
            this.player.setSprinting(true);
        }
        if (event.code.startsWith('Digit')) {
            let index = parseInt(event.code.slice(5), 10) - 1;
            if (index === -1) index = 9;
            if (index >= 0 && index < 10) {
              this.currentGunIndex = index;
              this.stateChangeCallback(this.state, { 
                currentGunIndex: index,
                guns: this.playerGuns
              });
            }
        }
        if (event.code === 'Tab') {
            event.preventDefault();
            if (this.state === 'playing') {
                this.isMapVisible = !this.isMapVisible;
                this.stateChangeCallback(this.state, { isMapVisible: this.isMapVisible });
            }
        }
    };
    public handleKeyUp = (event: KeyboardEvent) => {
        this.keys[event.code] = false;
        if (event.code === 'ShiftLeft' && this.state === 'playing') {
            this.isSprinting = false;
            this.player.setSprinting(false);
        }
    };
    
    public handleMouseDown = (event: MouseEvent) => {
        if (this.state !== 'playing' || event.button !== 0 || this.playerGuns.length === 0) return;

        const time = performance.now();
        const currentGun = this.playerGuns[this.currentGunIndex];
        if (time - this.lastShotTime < currentGun.stats.fireRate) return;
        this.lastShotTime = time;

        playGunshot(currentGun.soundProfile);

        if (this.ui.gunSprite) {
            const { recoil, duration } = currentGun.animation;
            this.ui.gunSprite.style.transition = 'none';
            this.ui.gunSprite.style.transform = `translateX(${recoil.x}px) translateY(${recoil.y}px) rotate(${recoil.angle}deg)`;
            this.ui.gunSprite.src = currentGun.firingSprite;

            setTimeout(() => {
                if (!this.ui.gunSprite) return;
                this.ui.gunSprite.style.transition = `transform ${duration / 1000}s ease-out`;
                this.ui.gunSprite.style.transform = '';
            }, 16);

            setTimeout(() => {
                if (!this.ui.gunSprite) return;
                this.ui.gunSprite.src = currentGun.sprite;
            }, 50);
        }
        
        const bullet = this.player.shoot(currentGun);
        if (bullet) {
            this.bullets.push(bullet);
        }
    }

    public handleResize = () => {
        const aspect = this.mount.clientWidth / this.mount.clientHeight;
        this.perspectiveCamera.aspect = aspect;
        this.perspectiveCamera.updateProjectionMatrix();

        const width = MAP_WIDTH * TILE_SIZE;
        const height = MAP_HEIGHT * TILE_SIZE;
        this.orthographicCamera.left = width / -2;
        this.orthographicCamera.right = width / 2;
        this.orthographicCamera.top = height / (2 * aspect);
        this.orthographicCamera.bottom = height / (-2 * aspect);
        this.orthographicCamera.updateProjectionMatrix();

        this.renderer.setSize(this.mount.clientWidth, this.mount.clientHeight);
    };

    public destroy() {
        cancelAnimationFrame(this.animationFrameId);
        this.controls.removeEventListener('lock', this.onLock);
        this.controls.removeEventListener('unlock', this.onUnlock);
        this.renderer.dispose();
        if (this.mount && this.renderer.domElement) {
            this.mount.removeChild(this.renderer.domElement);
        }
    }
}