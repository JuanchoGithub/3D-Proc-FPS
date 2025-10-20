import * as THREE from 'three';
import { createSkeleton } from './assets/createSkeleton';
import { createScuttler } from './assets/createScuttler';
import { createSentinel } from './assets/createSentinel';
import { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE } from './constants';
import * as Textures from './textures';
import Player from './Player';
import { playEnemyDeath, playGunshot } from './sfx';

export default class EnemyManager {
    public enemies: THREE.Group[] = [];
    private enemyBullets: THREE.Mesh[] = [];
    private scene: THREE.Scene;
    private materials: any;
    private raycaster = new THREE.Raycaster();

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
    
    private spawnSkeleton(tile: { x: number, z: number }): THREE.Group {
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
                type: 'skeleton-ranged',
                shotsFired: 0,
                shotCooldown: 2000,
                lastShotTime: 0,
                idealRangeMin: 10,
                idealRangeMax: 20,
                soundProfile: {
                    baseFrequency: 700 + Math.random() * 500,
                    pitchDrop: 70 + Math.random() * 80,
                    noiseDuration: 0.1 + Math.random() * 0.1,
                    gain: 0.1 + Math.random() * 0.05,
                },
            };
        } else {
             enemy.userData = {
                animationOffset: Math.random() * Math.PI * 2,
                type: 'skeleton-melee',
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

        return enemy;
    }
    
    private spawnScuttler(tile: { x: number, z: number }): THREE.Group {
        const enemy = createScuttler(this.materials.enemy.scuttlerBody, this.materials.enemy.scuttlerLegs);
        enemy.userData = {
            type: 'scuttler',
            state: 'chasing',
            attackRange: 2.0,
            attackDamage: 15,
            lastAttackTime: 0,
            attackCooldown: 1000, // 1 second
            animationOffset: Math.random() * Math.PI * 2,
            strafeDirection: (Math.random() < 0.5 ? 1 : -1),
            strafeTimer: Math.random() * 2,
        };
        enemy.position.set(
            (tile.x - MAP_WIDTH / 2) * TILE_SIZE + TILE_SIZE / 2,
            0,
            (tile.z - MAP_HEIGHT / 2) * TILE_SIZE + TILE_SIZE / 2
        );
        return enemy;
    }
    
    private spawnSentinel(tile: { x: number, z: number }): THREE.Group {
        const enemy = createSentinel(this.materials.enemy.sentinelBody, this.materials.enemy.sentinelEye);
        enemy.userData = {
            type: 'sentinel',
            state: 'attacking',
            lastShotTime: 0,
            shotCooldown: 200, // Time between shots in a burst
            shotsInBurst: 3,
            shotsFiredInBurst: 0,
            burstCooldown: 4000,
            lastBurstTime: performance.now(),
            soundProfile: {
                baseFrequency: 300,
                pitchDrop: 250,
                noiseDuration: 0.1,
                gain: 0.2,
            },
            animationOffset: Math.random() * Math.PI * 2,
        };
        enemy.position.set(
            (tile.x - MAP_WIDTH / 2) * TILE_SIZE + TILE_SIZE / 2,
            2.5, // Fly
            (tile.z - MAP_HEIGHT / 2) * TILE_SIZE + TILE_SIZE / 2
        );
        return enemy;
    }


    spawnEnemies(floorTiles: { x: number, z: number }[], playerSpawnTile: { x: number, z: number }, grid: number[][]) {
        const isSafe = (tile: { x: number, z: number }) => {
            const { x, z } = tile;
            if (grid[x]?.[z] !== 1) return false;
            if (grid[x + 1]?.[z] !== 1) return false;
            if (grid[x - 1]?.[z] !== 1) return false;
            if (grid[x]?.[z + 1] !== 1) return false;
            if (grid[x]?.[z - 1] !== 1) return false;
            return true;
        };
        const safeSpawnTiles = floorTiles.filter(isSafe);
        // Fallback to all floor tiles if there are not enough "safe" spots
        const spawnableTiles = safeSpawnTiles.length > 5 ? safeSpawnTiles : floorTiles;

        const numEnemies = Math.floor(spawnableTiles.length / 15);
        for (let i = 0; i < numEnemies; i++) {
            const tile = spawnableTiles[Math.floor(Math.random() * spawnableTiles.length)];
            if (tile === playerSpawnTile) continue;

            const enemyTypeRoll = Math.random();
            let enemy;
            
            if (enemyTypeRoll < 0.5) { // 50% Skeleton
                enemy = this.spawnSkeleton(tile);
            } else if (enemyTypeRoll < 0.8) { // 30% Scuttler
                enemy = this.spawnScuttler(tile);
            } else { // 20% Sentinel
                enemy = this.spawnSentinel(tile);
            }

            this.scene.add(enemy);
            this.enemies.push(enemy);
        }
    }

    private shootAtPlayer(enemy: THREE.Group, playerPosition: THREE.Vector3) {
        const muzzle = enemy.getObjectByName('muzzle');
        if (!muzzle) return;
        
        playGunshot(enemy.userData.soundProfile);
        
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
    
    private sentinelShoot(enemy: THREE.Group, playerPosition: THREE.Vector3) {
        const eye = enemy.getObjectByName('eye');
        if (!eye) return;
        
        playGunshot(enemy.userData.soundProfile);

        const bulletMaterial = new THREE.MeshStandardMaterial({
            color: 0xff4444,
            emissive: 0xff0000,
            emissiveIntensity: 1,
            roughness: 0.3,
        });
        const bulletGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
        
        const startPosition = new THREE.Vector3();
        eye.getWorldPosition(startPosition);
        bullet.position.copy(startPosition);
        
        const direction = playerPosition.clone().sub(startPosition).normalize();
        
        bullet.userData.velocity = direction.multiplyScalar(20); // Slower projectiles
        bullet.userData.type = 'sentinel';
        
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
                player.takeDamage(bullet.userData.type === 'sentinel' ? 15 : 5);
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

    private hasLineOfSight(enemy: THREE.Group, playerPosition: THREE.Vector3, levelContainer: THREE.Group): boolean {
        const eyePosition = new THREE.Vector3();
        
        const eyeObject = enemy.getObjectByName('eye');
        if (eyeObject) {
            eyeObject.getWorldPosition(eyePosition);
        } else {
            // Approximate eye position for skeletons
            eyePosition.copy(enemy.position).y += 1.6;
        }

        const direction = playerPosition.clone().sub(eyePosition).normalize();
        this.raycaster.set(eyePosition, direction);
        
        const intersects = this.raycaster.intersectObject(levelContainer, true);
        
        const distanceToPlayer = eyePosition.distanceTo(playerPosition);
        
        // If there's an intersection and it's closer than the player, vision is blocked.
        if (intersects.length > 0 && intersects[0].distance < distanceToPlayer) {
            return false;
        }
        
        return true;
    }

    private updateSkeleton(enemy: THREE.Group, delta: number, player: Player, isCollision: (x: number, z: number) => boolean, time: number, levelContainer: THREE.Group) {
        const walkCycleSpeed = 4;
        const bobAmount = 0.05;
        const limbSwingAmount = Math.PI / 4;
        const playerPosition = player.camera.position;
        const distanceToPlayer = enemy.position.distanceTo(playerPosition);
        const enemyType = enemy.userData.type;
        
        const leftArm = enemy.getObjectByName('leftArm') as THREE.Mesh;
        const rightArm = enemy.getObjectByName('rightArm') as THREE.Mesh;
        const leftLeg = enemy.getObjectByName('leftLeg') as THREE.Mesh;
        const rightLeg = enemy.getObjectByName('rightLeg') as THREE.Mesh;

        if (enemyType === 'skeleton-ranged') {
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
            
            const canSeePlayer = this.hasLineOfSight(enemy, playerPosition, levelContainer);
            if (canSeePlayer && time > enemy.userData.lastShotTime + enemy.userData.shotCooldown) {
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
    }

    private updateScuttler(enemy: THREE.Group, delta: number, player: Player, isCollision: (x: number, z: number) => boolean, time: number) {
        const playerPosition = player.camera.position;
        const distanceToPlayer = enemy.position.distanceTo(playerPosition);
        const lookAtPosition = new THREE.Vector3().copy(playerPosition);
        lookAtPosition.y = enemy.position.y;
        enemy.lookAt(lookAtPosition);
        
        // Attack logic
        if (distanceToPlayer < enemy.userData.attackRange && time > enemy.userData.lastAttackTime + enemy.userData.attackCooldown) {
            enemy.userData.lastAttackTime = time;
            player.takeDamage(enemy.userData.attackDamage);
            // TODO: Lunge animation
        }
        
        // Movement logic
        if (distanceToPlayer > 1.5) {
            const speed = 4.0;
            const moveStep = speed * delta;
            
            const forward = new THREE.Vector3(0,0,1).applyQuaternion(enemy.quaternion);
            const right = new THREE.Vector3(1,0,0).applyQuaternion(enemy.quaternion);

            // Strafe timer
            enemy.userData.strafeTimer -= delta;
            if (enemy.userData.strafeTimer <= 0) {
                enemy.userData.strafeDirection *= -1;
                enemy.userData.strafeTimer = 1 + Math.random() * 2;
            }

            // Combine forward and strafe movement
            const moveDirection = forward.add(right.multiplyScalar(enemy.userData.strafeDirection * 0.5)).normalize();
            
            const nextX = enemy.position.x + moveDirection.x * moveStep;
            const nextZ = enemy.position.z + moveDirection.z * moveStep;

            if (!isCollision(nextX, enemy.position.z)) enemy.position.x = nextX;
            if (!isCollision(enemy.position.x, nextZ)) enemy.position.z = nextZ;
        }

        // Animation
        const phase = time / 1000 * 15 + enemy.userData.animationOffset;
        for(let i=0; i<6; ++i) {
            const leg = enemy.getObjectByName(`leg${i}`);
            if(leg) {
                const legPhase = phase + (i % 2 === 0 ? Math.PI : 0);
                (leg.children[0] as THREE.Mesh).rotation.x = Math.sin(legPhase) * Math.PI / 6;
            }
        }
    }
    
    private updateSentinel(enemy: THREE.Group, delta: number, player: Player, isCollision: (x: number, z: number) => boolean, time: number, levelContainer: THREE.Group) {
        const playerPosition = player.camera.position;
        const eye = enemy.getObjectByName('eye');
        if (eye) {
            eye.lookAt(playerPosition);
        }
        
        // Bobbing animation
        const phase = time / 1000 * 0.8 + enemy.userData.animationOffset;
        enemy.position.y = 2.5 + Math.sin(phase) * 0.2;
        enemy.rotation.y += delta * 0.1;
        
        // Shooting logic
        const canSeePlayer = this.hasLineOfSight(enemy, playerPosition, levelContainer);
        if (canSeePlayer && time > enemy.userData.lastBurstTime + enemy.userData.burstCooldown) {
            if (time > enemy.userData.lastShotTime + enemy.userData.shotCooldown) {
                this.sentinelShoot(enemy, playerPosition);
                enemy.userData.lastShotTime = time;
                enemy.userData.shotsFiredInBurst++;
                if (enemy.userData.shotsFiredInBurst >= enemy.userData.shotsInBurst) {
                    enemy.userData.lastBurstTime = time;
                    enemy.userData.shotsFiredInBurst = 0;
                }
            }
        }
    }

    update(delta: number, player: Player, isCollision: (x: number, z: number) => boolean, time: number, levelContainer: THREE.Group) {
        // --- Enemy-to-Enemy Separation ---
        const enemyRadius = 1.0; // Give them personal space
        for (let i = 0; i < this.enemies.length; i++) {
            for (let j = i + 1; j < this.enemies.length; j++) {
                const enemyA = this.enemies[i];
                const enemyB = this.enemies[j];
                
                const distance = enemyA.position.distanceTo(enemyB.position);
                
                if (distance < enemyRadius * 2) {
                    const separationVector = new THREE.Vector3().subVectors(enemyA.position, enemyB.position).normalize();
                    const separationAmount = (enemyRadius * 2 - distance) * 0.5;
                    
                    const nextAPosX = enemyA.position.x + separationVector.x * separationAmount;
                    const nextAPosZ = enemyA.position.z + separationVector.z * separationAmount;
                    if (!isCollision(nextAPosX, nextAPosZ)) {
                       enemyA.position.x = nextAPosX;
                       enemyA.position.z = nextAPosZ;
                    }
                    
                    const nextBPosX = enemyB.position.x - separationVector.x * separationAmount;
                    const nextBPosZ = enemyB.position.z - separationVector.z * separationAmount;
                     if (!isCollision(nextBPosX, nextBPosZ)) {
                       enemyB.position.x = nextBPosX;
                       enemyB.position.z = nextBPosZ;
                    }
                }
            }
        }

        // --- Individual Enemy Updates ---
        this.enemies.forEach((enemy: THREE.Group) => {
            const type = enemy.userData.type;
            if (type.startsWith('skeleton')) {
                this.updateSkeleton(enemy, delta, player, isCollision, time, levelContainer);
            } else if (type === 'scuttler') {
                this.updateScuttler(enemy, delta, player, isCollision, time);
            } else if (type === 'sentinel') {
                this.updateSentinel(enemy, delta, player, isCollision, time, levelContainer);
            }
        });
    }

    checkHit(bulletPosition: THREE.Vector3): THREE.Group | null {
        for (const enemy of this.enemies) {
            const hitBody = enemy.getObjectByName('torso') || enemy.getObjectByName('body');
            if (hitBody) {
                const torsoPosition = hitBody.getWorldPosition(new THREE.Vector3());
                const hitRadius = enemy.userData.type === 'sentinel' ? 1.2 : 1.0;
                if (bulletPosition.distanceTo(torsoPosition) < hitRadius) {
                    return enemy;
                }
            }
        }
        return null;
    }

    killEnemy(enemy: THREE.Group, bulletVelocity: THREE.Vector3) {
        playEnemyDeath();
        const deadParts: any[] = [];
        
        const objectsToDisassemble: THREE.Mesh[] = [];
        enemy.traverse(child => {
            if(child instanceof THREE.Mesh) {
                objectsToDisassemble.push(child);
            }
        });

        objectsToDisassemble.forEach(mesh => {
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