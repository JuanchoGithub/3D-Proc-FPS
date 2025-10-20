import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE, WALL_HEIGHT } from './constants';
import { generateLevel } from './levelGenerator';
import { createMaterials } from './materials';
import { buildLevel } from './LevelBuilder';
import Player from './Player';
import EnemyManager from './EnemyManager';
import { generateProceduralGun } from './assets/procedural-gun';
import { playGunshot } from './sfx';

export type GameState = 'menu' | 'generating' | 'preview' | 'playing';

export default class Game {
    private mount: HTMLDivElement;
    private stateChangeCallback: (newState: GameState, data?: any) => void;
    private mapCanvasRef: React.RefObject<HTMLCanvasElement>;

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
    private lastTime = 0;
    private animationFrameId!: number;

    private state: GameState = 'menu';
    private playerGuns: any[] = [];
    private currentGunIndex = 0;
    private lastShotTime = 0;
    
    public ui: { gunSprite: HTMLImageElement | null } = { gunSprite: null };

    constructor(mount: HTMLDivElement, stateChangeCallback: (newState: GameState, data?: any) => void, mapCanvasRef: React.RefObject<HTMLCanvasElement>) {
        this.mount = mount;
        this.stateChangeCallback = stateChangeCallback;
        this.mapCanvasRef = mapCanvasRef;
    }

    public init() {
        // Scene & Renderer
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x101010);
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.mount.clientWidth, this.mount.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.mount.appendChild(this.renderer.domElement);

        // Cameras
        this.perspectiveCamera = new THREE.PerspectiveCamera(75, this.mount.clientWidth / this.mount.clientHeight, 0.1, 1000);
        
        const aspect = this.mount.clientWidth / this.mount.clientHeight;
        const width = MAP_WIDTH * TILE_SIZE;
        const height = MAP_HEIGHT * TILE_SIZE;
        this.orthographicCamera = new THREE.OrthographicCamera(width / -2, width / 2, height / (2 * aspect), height / (-2 * aspect), 1, 1000);
        this.orthographicCamera.position.y = 50;
        this.orthographicCamera.lookAt(0, 0, 0);

        // Controls
        this.controls = new PointerLockControls(this.perspectiveCamera, this.renderer.domElement);
        this.scene.add(this.controls.getObject());
        this.controls.addEventListener('lock', this.onLock);
        this.controls.addEventListener('unlock', this.onUnlock);

        // Materials & Player/Enemy Managers
        this.materials = createMaterials();
        this.player = new Player(this.perspectiveCamera, this.controls, this.scene, this.materials.playerLight);
        this.enemyManager = new EnemyManager(this.scene, this.materials);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.03);
        this.scene.add(ambientLight);

        this.animate();
    }
    
    private setState(newState: GameState, data?: any) {
        this.state = newState;
        this.stateChangeCallback(newState, data);
    }
    
    public async generateNewLevel() {
        if (this.state === 'generating') return;
        this.setState('generating', { subtitle: 'Generating level...' });

        if (this.levelContainer) {
            this.scene.remove(this.levelContainer);
        }

        const { grid, rooms, doorLocations } = generateLevel();
        this.levelData.grid = grid;
        this.levelData.doorLocations = doorLocations;
        this.levelData.rooms = rooms; // Store rooms data
        
        this.levelContainer = new THREE.Group();
        this.scene.add(this.levelContainer);

        // Allow UI to update before blocking thread
        await new Promise(resolve => setTimeout(resolve, 10));

        const { floorTiles, doors } = buildLevel(this.levelContainer, { grid, rooms, doorLocations }, this.materials);
        this.levelData.floorTiles = floorTiles;
        this.levelData.doors = doors;

        this.playerGuns = Array.from({ length: 10 }, () => generateProceduralGun());
        
        this.setState('preview', { 
            subtitle: 'Level generated. Press Play!',
            guns: this.playerGuns,
        });
    }

    public startGame() {
        if (this.state !== 'preview') return;
        this.enemyManager.clearEnemies();

        let spawnTile: { x: number; z: number; };
        if (this.levelData.rooms && this.levelData.rooms.length > 0) {
            const spawnRoom = this.levelData.rooms[0];
            // Use center of the first room as the spawn tile. Note: level generator uses y for z.
            spawnTile = {
                x: Math.floor(spawnRoom.x + spawnRoom.width / 2),
                z: Math.floor(spawnRoom.y + spawnRoom.height / 2)
            };
        } else {
            // Fallback to old logic if there are no rooms
            spawnTile = this.levelData.floorTiles[Math.floor(Math.random() * this.levelData.floorTiles.length)];
        }
        
        const spawnPos = new THREE.Vector3(
            (spawnTile.x - MAP_WIDTH / 2) * TILE_SIZE + TILE_SIZE / 2,
            WALL_HEIGHT / 2,
            (spawnTile.z - MAP_HEIGHT / 2) * TILE_SIZE + TILE_SIZE / 2
        );
        this.player.spawn(spawnPos);
        
        this.enemyManager.spawnEnemies(this.levelData.floorTiles, spawnTile, this.levelData.grid);
        
        this.bullets.forEach(b => this.scene.remove(b));
        this.bullets = [];

        this.deadParts.forEach(p => this.scene.remove(p.mesh));
        this.deadParts = [];

        this.decals.forEach(d => this.scene.remove(d.mesh));
        this.decals = [];

        this.lastShotTime = 0;

        this.controls.lock();
    }
    
    private getCollision = (posX: number, posZ: number): { type: 'wall' | 'door', gridX: number, gridZ: number } | null => {
        const gridX = Math.floor((posX / TILE_SIZE) + MAP_WIDTH / 2);
        const gridZ = Math.floor((posZ / TILE_SIZE) + MAP_HEIGHT / 2);

        if (gridX < 0 || gridX >= MAP_WIDTH || gridZ < 0 || gridZ >= MAP_HEIGHT) {
            const clampedX = THREE.MathUtils.clamp(gridX, 0, MAP_WIDTH - 1);
            const clampedZ = THREE.MathUtils.clamp(gridZ, 0, MAP_HEIGHT - 1);
            return { type: 'wall', gridX: clampedX, gridZ: clampedZ };
        }

        if (this.levelData.grid[gridX]?.[gridZ] === 0) {
            return { type: 'wall', gridX, gridZ };
        }
        
        const door = this.levelData.doors.find((d: THREE.Mesh) => d.userData.gridX === gridX && d.userData.gridZ === gridZ);
        if (door && (door.userData.state === 'closed' || door.userData.state === 'closing')) {
            return { type: 'door', gridX, gridZ };
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
            } else if (door.userData.state === 'open' && door.userData.openTime && time > door.userData.openTime + 5000) {
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

        // Fix decal orientation
        const defaultPlaneNormal = new THREE.Vector3(0, 0, 1);
        decal.quaternion.setFromUnitVectors(defaultPlaneNormal, normal);
        decal.rotateZ(Math.random() * Math.PI * 2); // Add random spin
        
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

            if (collision) {
                let hitPosition = bullet.position.clone();

                if (collision.type === 'wall') {
                    const { gridX, gridZ } = collision;
                    const wallMinX = (gridX - MAP_WIDTH / 2) * TILE_SIZE;
                    const wallMaxX = wallMinX + TILE_SIZE;
                    const wallMinZ = (gridZ - MAP_HEIGHT / 2) * TILE_SIZE;
                    const wallMaxZ = wallMinZ + TILE_SIZE;

                    const ray = new THREE.Ray(prevPos, bullet.userData.velocity.clone().normalize());
                    const box = new THREE.Box3(
                        new THREE.Vector3(wallMinX, 0, wallMinZ),
                        new THREE.Vector3(wallMaxX, WALL_HEIGHT, wallMaxZ)
                    );
                    
                    const intersectionPoint = new THREE.Vector3();
                    if (ray.intersectBox(box, intersectionPoint)) {
                        hitPosition.copy(intersectionPoint);
                    }
                }
                
                this.createBulletDecal(hitPosition, bullet.userData.velocity);
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
        
        mapCtx.fillStyle = '#fff';
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

            if(this.isMapVisible) this.updateMap();
            
            const isMoving = this.keys['KeyW'] || this.keys['KeyS'] || this.keys['KeyA'] || this.keys['KeyD'];
            this.stateChangeCallback('playing', { 
                isMoving,
                playerHealth: this.player.health,
                playerMaxHealth: this.player.maxHealth
            });
            
            this.renderer.render(this.scene, this.perspectiveCamera);
        } else {
             if(this.scene && this.orthographicCamera)
                this.renderer.render(this.scene, this.orthographicCamera);
        }

        this.lastTime = time;
    }
    
    // --- Event Handlers ---
    private onLock = () => this.setState('playing');
    private onUnlock = () => {
        const subtitle = this.player.isDead 
            ? 'You died! Generate a new level to try again.'
            : 'Paused. Click to resume.';
        this.setState('menu', { subtitle, isMapVisible: false });
    };

    public handleKeyDown = (event: KeyboardEvent) => {
        this.keys[event.code] = true;
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
        this.mount.removeChild(this.renderer.domElement);
    }
}