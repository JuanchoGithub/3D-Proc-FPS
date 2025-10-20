import * as THREE from 'three';
import { createSkeleton } from './assets/createSkeleton';
import { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE } from './constants';
import * as Textures from './textures';
import Player from './Player';
import { playEnemyDeath } from './sfx';

export default class EnemyManager {
    public enemies: THREE.Group[] = [];
    private enemyBullets: THREE.Mesh[] = [];
    private scene: THREE.Scene;
    private materials: any;

    constructor(scene: THREE.Scene, materials: any) {
        this.scene = scene;
        this.materials = materials;
    }

    private createEnemyGun(): THREE.Group {
        const gunGroup = new THREE.Group();
        const gunMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.6 });
        
        const bodyGeom = new THREE.BoxGeometry(0.1, 0.1, 0.5);
        const body = new THREE.Mesh(bodyGeom, gunMaterial);
        
        const barrelGeom = new THREE.BoxGeometry(0.05, 0.05, 0.4);
        const barrel = new THREE.Mesh(barrelGeom, gunMaterial);
        barrel.position.z = -0.45;
        
        const muzzle = new THREE.Object3D();
        muzzle.position.z = -0.65;
        muzzle.name = 'muzzle';
        
        gunGroup.add(body, barrel, muzzle);
        
        return gunGroup;
    }

    spawnEnemies(floorTiles: { x: number, z: number }[], playerSpawnTile: { x: number, z: number }) {
        const numEnemies = Math.floor(floorTiles.length / 15);
        for (let i = 0; i < numEnemies; i++) {
            const tile = floorTiles[Math.floor(Math.random() * floorTiles.length)];
            if (tile === playerSpawnTile) continue;

            const shirtTextures = Textures.generateShirtTexture();
            const pantsTextures = Textures.generatePantsTexture();
            const shoeTextures = Textures.generateShoeTexture();

            const shirtMaterial = new THREE.MeshStandardMaterial({ 
                map: shirtTextures.map, 
                normalMap: shirtTextures.normalMap,
                normalScale: new THREE.Vector2(0.5, 0.5),
                roughness: 0.9 
            });
            const pantsMaterial = new THREE.MeshStandardMaterial({ 
                map: pantsTextures.map, 
                normalMap: pantsTextures.normalMap,
                normalScale: new THREE.Vector2(0.6, 0.6),
                roughness: 0.8 
            });
            const shoeMaterial = new THREE.MeshStandardMaterial({ 
                map: shoeTextures.map, 
                normalMap: shoeTextures.normalMap,
                normalScale: new THREE.Vector2(0.7, 0.7),
                roughness: 0.8 
            });

            const enemy = createSkeleton(this.materials.bone, shirtMaterial, pantsMaterial, shoeMaterial);
            const isRanged = Math.random() < 0.4;
            
            if (isRanged) {
                const gun = this.createEnemyGun();
                const rightArm = enemy.getObjectByName('rightArm') as THREE.Mesh;
                if (rightArm) {
                    gun.position.set(0, -0.6, 0.1); 
                    gun.rotation.x = Math.PI / 2;
                    rightArm.add(gun);
                }
                enemy.userData = {
                    animationOffset: Math.random() * Math.PI * 2,
                    type: 'ranged',
                    shotsFired: 0,
                    shotCooldown: 2000,
                    lastShotTime: 0,
                    idealRangeMin: 10,
                    idealRangeMax: 20
                };
            } else {
                 enemy.userData = {
                    animationOffset: Math.random() * Math.PI * 2,
                    type: 'melee',
                    state: 'chasing',
                    attackRange: 2.5,
                    attackDamage: 10,
                    attackSpeed: 1.5, // seconds
                    lastAttackTime: 0,
                    attackAnimTimer: 0,
                };
            }

            enemy.position.set(
                (tile.x - MAP_WIDTH / 2) * TILE_SIZE + TILE_SIZE / 2,
                0,
                (tile.z - MAP_HEIGHT / 2) * TILE_SIZE + TILE_SIZE / 2
            );
            this.scene.add(enemy);
            this.enemies.push(enemy);
        }
    }

    private shootAtPlayer(enemy: THREE.Group, playerPosition: THREE.Vector3) {
        const muzzle = enemy.getObjectByName('muzzle');
        if (!muzzle) return;
        
        const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const bulletGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);

        const startPosition = new THREE.Vector3();
        muzzle.getWorldPosition(startPosition);
        bullet.position.copy(startPosition);

        const direction = playerPosition.clone().sub(startPosition).normalize();
        
        const shouldMiss = enemy.userData.shotsFired < 2 || Math.random() > 0.7;
        if (shouldMiss) {
            const inaccuracy = 0.3;
            const randomAngleX = (Math.random() - 0.5) * inaccuracy;
            const randomAngleY = (Math.random() - 0.5) * inaccuracy;
            direction.applyAxisAngle(new THREE.Vector3(1,0,0), randomAngleX);
            direction.applyAxisAngle(new THREE.Vector3(0,1,0), randomAngleY);
        }
        
        enemy.userData.shotsFired++;
        bullet.userData.velocity = direction.multiplyScalar(40);
        
        this.scene.add(bullet);
        this.enemyBullets.push(bullet);
    }
    
    public updateEnemyBullets(delta: number, player: Player, isCollision: (x: number, z: number) => boolean) {
        const hitPoints: {position: THREE.Vector3, velocity: THREE.Vector3}[] = [];
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const bullet = this.enemyBullets[i];
            bullet.position.addScaledVector(bullet.userData.velocity, delta);
            
            let hit = false;
            
            if (bullet.position.distanceTo(player.camera.position) < 1.0) {
                player.takeDamage(5);
                hit = true;
            }
            
            if (!hit && (isCollision(bullet.position.x, bullet.position.z) || bullet.position.y < 0)) {
                hit = true;
                 if (bullet.position.y > 0) { // Don't decal the floor
                    hitPoints.push({ position: bullet.position.clone(), velocity: bullet.userData.velocity.clone() });
                }
            }
            
            if (!hit && bullet.position.distanceTo(player.camera.position) > 150) {
                hit = true;
            }

            if (hit) {
                this.scene.remove(bullet);
                this.enemyBullets.splice(i, 1);
            }
        }
        return hitPoints;
    }

    update(delta: number, player: Player, isCollision: (x: number, z: number) => boolean, time: number) {
        const walkCycleSpeed = 4;
        const bobAmount = 0.05;
        const limbSwingAmount = Math.PI / 4;
        const playerPosition = player.camera.position;

        this.enemies.forEach((enemy: THREE.Group) => {
            const distanceToPlayer = enemy.position.distanceTo(playerPosition);
            const enemyType = enemy.userData.type || 'melee';
            
            const leftArm = enemy.getObjectByName('leftArm') as THREE.Mesh;
            const rightArm = enemy.getObjectByName('rightArm') as THREE.Mesh;
            const leftLeg = enemy.getObjectByName('leftLeg') as THREE.Mesh;
            const rightLeg = enemy.getObjectByName('rightLeg') as THREE.Mesh;

            if (enemyType === 'ranged') {
                const lookAtPosition = new THREE.Vector3().copy(playerPosition);
                lookAtPosition.y = enemy.position.y + 1.5;
                enemy.lookAt(lookAtPosition);

                const skeletonSpeed = 1.0;
                const moveStep = skeletonSpeed * delta;
                let shouldMove = false;
                let moveDirection = 1;

                if (distanceToPlayer > enemy.userData.idealRangeMax) {
                    shouldMove = true;
                    moveDirection = 1;
                } else if (distanceToPlayer < enemy.userData.idealRangeMin) {
                    shouldMove = true;
                    moveDirection = -1;
                }

                if (shouldMove) {
                    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(enemy.quaternion);
                    
                    const nextX = enemy.position.x + forward.x * moveStep * moveDirection;
                    const nextZ = enemy.position.z + forward.z * moveStep * moveDirection;

                    if (!isCollision(nextX, enemy.position.z)) enemy.position.x = nextX;
                    if (!isCollision(enemy.position.x, nextZ)) enemy.position.z = nextZ;

                    const phase = time / 1000 * walkCycleSpeed + enemy.userData.animationOffset;
                    if(leftLeg) leftLeg.rotation.x = -Math.sin(phase) * limbSwingAmount;
                    if(rightLeg) rightLeg.rotation.x = Math.sin(phase) * limbSwingAmount;
                    enemy.position.y = Math.sin(phase * 2) * bobAmount;
                }
                
                if (time > enemy.userData.lastShotTime + enemy.userData.shotCooldown) {
                    enemy.userData.lastShotTime = time;
                    this.shootAtPlayer(enemy, playerPosition);
                }
            } else { // Melee Logic
                if (enemy.userData.state === 'chasing' && distanceToPlayer <= enemy.userData.attackRange && time > enemy.userData.lastAttackTime + (enemy.userData.attackSpeed * 1000)) {
                    enemy.userData.state = 'attacking';
                    enemy.userData.lastAttackTime = time;
                    enemy.userData.attackAnimTimer = 0.3;
                }

                if (enemy.userData.state === 'attacking') {
                    const attackDuration = 500;
                    const timeSinceAttack = time - enemy.userData.lastAttackTime;

                    if (timeSinceAttack < attackDuration) {
                        const attackProgress = timeSinceAttack / attackDuration;
                        const swingAngle = Math.sin(attackProgress * Math.PI) * -Math.PI / 1.5;
                        if (leftArm) leftArm.rotation.x = swingAngle;
                        if (rightArm) rightArm.rotation.x = swingAngle;
                    } else {
                        enemy.userData.state = 'chasing';
                    }

                    if (enemy.userData.attackAnimTimer > 0) {
                        enemy.userData.attackAnimTimer -= delta;
                        if (enemy.userData.attackAnimTimer <= 0) {
                            if (enemy.position.distanceTo(playerPosition) <= enemy.userData.attackRange) {
                                player.takeDamage(enemy.userData.attackDamage);
                            }
                        }
                    }
                    
                    const lookAtPosition = new THREE.Vector3().copy(playerPosition);
                    lookAtPosition.y = enemy.position.y + 1.5;
                    enemy.lookAt(lookAtPosition);
                } else { // Chasing state
                    const phase = time / 1000 * walkCycleSpeed + enemy.userData.animationOffset;
                    if(leftArm) leftArm.rotation.x = Math.sin(phase) * limbSwingAmount;
                    if(rightArm) rightArm.rotation.x = -Math.sin(phase) * limbSwingAmount;
                    if(leftLeg) leftLeg.rotation.x = -Math.sin(phase) * limbSwingAmount;
                    if(rightLeg) rightLeg.rotation.x = Math.sin(phase) * limbSwingAmount;
                    enemy.position.y = Math.sin(phase * 2) * bobAmount;

                    const lookAtPosition = new THREE.Vector3().copy(playerPosition);
                    lookAtPosition.y = enemy.position.y + 1.5;
                    enemy.lookAt(lookAtPosition);
                    
                    if (distanceToPlayer > 2) {
                        const skeletonSpeed = 1.2;
                        const moveStep = skeletonSpeed * delta;
                        const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(enemy.quaternion);
                        
                        const nextX = enemy.position.x + forward.x * moveStep;
                        const nextZ = enemy.position.z + forward.z * moveStep;

                        if (!isCollision(nextX, enemy.position.z)) enemy.position.x = nextX;
                        if (!isCollision(enemy.position.x, nextZ)) enemy.position.z = nextZ;
                    }
                }
            }
        });
    }

    checkHit(bulletPosition: THREE.Vector3): THREE.Group | null {
        for (const enemy of this.enemies) {
            const torso = enemy.getObjectByName('torso');
            if (torso) {
                const torsoPosition = torso.getWorldPosition(new THREE.Vector3());
                if (bulletPosition.distanceTo(torsoPosition) < 1.0) {
                    return enemy;
                }
            }
        }
        return null;
    }

    killEnemy(enemy: THREE.Group, bulletVelocity: THREE.Vector3) {
        playEnemyDeath();
        const deadParts: any[] = [];
        [...enemy.children].forEach(child => {
            const mesh = child as THREE.Mesh;
            mesh.material = (mesh.material as THREE.Material).clone();
            this.scene.attach(mesh);
            const explosionDir = new THREE.Vector3(Math.random() - 0.5, Math.random() * 0.5 + 0.2, Math.random() - 0.5).normalize();
            const partVelocity = bulletVelocity.clone().multiplyScalar(0.05).add(explosionDir.multiplyScalar(Math.random() * 5 + 3));
            const angularVelocity = new THREE.Vector3((Math.random() - 0.5), (Math.random() - 0.5), (Math.random() - 0.5)).multiplyScalar(Math.PI * 2);
            deadParts.push({ mesh, velocity: partVelocity, angularVelocity, lifetime: 3.0 + Math.random() * 2 });
        });
        
        this.scene.remove(enemy);
        this.enemies = this.enemies.filter(e => e !== enemy);
        return deadParts;
    }

    clearEnemies() {
        this.enemyBullets.forEach(b => this.scene.remove(b));
        this.enemyBullets = [];
        this.enemies.forEach(enemy => {
            enemy.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    child.geometry.dispose();
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => {
                            if (m.map) m.map.dispose();
                            if ((m as any).normalMap) (m as any).normalMap.dispose();
                            m.dispose();
                        });
                    } else if (child.material) {
                        if (child.material.map) child.material.map.dispose();
                        if ((child.material as any).normalMap) (child.material as any).normalMap.dispose();
                        child.material.dispose();
                    }
                }
            });
            this.scene.remove(enemy);
        });
        this.enemies = [];
    }
}