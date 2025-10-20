import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { TILE_SIZE } from './constants';
import { playFootstep } from './sfx';

export default class Player {
    public camera: THREE.PerspectiveCamera;
    private controls: PointerLockControls;
    private scene: THREE.Scene;
    private doorInteractionCooldown = 0;

    public health = 100;
    public maxHealth = 100;
    public isDead = false;

    constructor(camera: THREE.PerspectiveCamera, controls: PointerLockControls, scene: THREE.Scene, playerLight: THREE.SpotLight) {
        this.camera = camera;
        this.controls = controls;
        this.scene = scene;
        
        this.camera.add(playerLight);
        this.camera.add(playerLight.target);
        playerLight.position.set(0, 0, 0.2);
        playerLight.target.position.set(0, 0, -1);
    }

    public takeDamage(amount: number) {
        if (this.isDead) return;
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.isDead = true;
        }
    }

    spawn(position: THREE.Vector3) {
        this.camera.position.copy(position);
        this.health = this.maxHealth;
        this.isDead = false;
    }

    update(delta: number, keys: { [key: string]: boolean }, isCollision: (x: number, z: number) => boolean, doors: THREE.Mesh[]) {
        // Movement
        const speed = 5.0;
        let moveX = 0;
        let moveZ = 0;
        if (keys['KeyW'] || keys['ArrowUp']) moveZ = -1;
        if (keys['KeyS'] || keys['ArrowDown']) moveZ = 1;
        if (keys['KeyA'] || keys['ArrowLeft']) moveX = -1;
        if (keys['KeyD'] || keys['ArrowRight']) moveX = 1;

        if (moveX !== 0 || moveZ !== 0) {
            playFootstep();
            const cameraDirection = new THREE.Vector3();
            this.camera.getWorldDirection(cameraDirection);
            cameraDirection.y = 0;
            cameraDirection.normalize();

            const rightDirection = new THREE.Vector3().crossVectors(cameraDirection, this.camera.up).normalize();
            
            const moveDirection = new THREE.Vector3()
                .add(cameraDirection.multiplyScalar(-moveZ))
                .add(rightDirection.multiplyScalar(moveX))
                .normalize();

            const totalMove = moveDirection.multiplyScalar(speed * delta);
            const oldPosition = this.camera.position.clone();
            
            // Move on X and check collision
            this.camera.position.x += totalMove.x;
            if (isCollision(this.camera.position.x, this.camera.position.z)) {
                this.camera.position.x = oldPosition.x;
            }
            // Move on Z and check collision
            this.camera.position.z += totalMove.z;
            if (isCollision(this.camera.position.x, this.camera.position.z)) {
                this.camera.position.z = oldPosition.z;
            }
        }

        // Door Interaction
        if (this.doorInteractionCooldown > 0) {
            this.doorInteractionCooldown -= delta;
        }
        if (keys['Space'] && this.doorInteractionCooldown <= 0) {
            const interactionRange = TILE_SIZE * 1.5;
            let triggeredDoor = false;
            for (const door of doors) {
                if (door.position.distanceTo(this.camera.position) < interactionRange) {
                    if (door.userData.state === 'closed') { door.userData.state = 'opening'; triggeredDoor = true; break; }
                    if (door.userData.state === 'open') { door.userData.state = 'closing'; triggeredDoor = true; break; }
                }
            }
            if (triggeredDoor) this.doorInteractionCooldown = 0.5;
        }
    }

    shoot(currentGun: any): THREE.Mesh | null {
        const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        const bulletGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
        
        bullet.userData.velocity = new THREE.Vector3();
        this.camera.getWorldDirection(bullet.userData.velocity);
        bullet.userData.velocity.multiplyScalar(currentGun.stats.bulletSpeed);
  
        const spawnOffset = new THREE.Vector3(0.3, -0.3, -0.5);
        spawnOffset.applyQuaternion(this.camera.quaternion);
        bullet.position.copy(this.camera.position).add(spawnOffset);
        
        this.scene.add(bullet);
        return bullet;
    }
}