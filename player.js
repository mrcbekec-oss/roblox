import * as THREE from 'three';
import { Entity, checkCollision } from './engine.js';

export class Player extends Entity {
    constructor(engine) {
        // Create an avatar (blocky Roblox-style)
        const group = new THREE.Group();
        const bodyGeo = new THREE.BoxGeometry(0.8, 1, 0.4);
        const bodyMat = new THREE.MeshToonMaterial({ color: 0x4D96FF });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.5;
        body.castShadow = true;
        group.add(body);

        const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const headMat = new THREE.MeshToonMaterial({ color: 0xFFD930 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 1.15;
        head.castShadow = true;
        group.add(head);

        const limbGeo = new THREE.BoxGeometry(0.35, 0.8, 0.35);
        const Larm = new THREE.Mesh(limbGeo, bodyMat);
        Larm.position.set(-0.55, 0.5, 0);
        group.add(Larm);

        const Rarm = new THREE.Mesh(limbGeo, bodyMat);
        Rarm.position.set(0.55, 0.5, 0);
        group.add(Rarm);

        const Lleg = new THREE.Mesh(limbGeo, new THREE.MeshToonMaterial({ color: 0x333333 }));
        Lleg.position.set(-0.2, -0.2, 0);
        group.add(Lleg);

        const Rleg = new THREE.Mesh(limbGeo, new THREE.MeshToonMaterial({ color: 0x333333 }));
        Rleg.position.set(0.2, -0.2, 0);
        group.add(Rleg);

        super({ mesh: group, size: new THREE.Vector3(1, 1.8, 0.6), position: new THREE.Vector3(0, 5, 0) });
        this.engine = engine;
        this.keys = {};
        this.isJumping = false;
        this.speed = 12;
        this.jumpForce = 15;
        this.gravity = 40;
        this.onGround = false;

        this.initControls();
        this.cameraOffset = new THREE.Vector3(0, 5, 10);
    }

    initControls() {
        window.addEventListener('keydown', (e) => this.keys[e.code] = true);
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);
        
        // Mobile Jump
        document.getElementById('btn-jump').addEventListener('pointerdown', () => {
            if (this.onGround) {
                this.velocity.y = this.jumpForce;
                this.onGround = false;
            }
        });
    }

    update(delta, colliders) {
        // Friction and Gravity
        this.velocity.x *= 0.8;
        this.velocity.z *= 0.8;
        this.velocity.y -= this.gravity * delta;

        // Move Input
        let moveX = 0;
        let moveZ = 0;
        if (this.keys['KeyW'] || this.keys['ArrowUp']) moveZ -= 1;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) moveZ += 1;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX -= 1;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX += 1;

        if (moveX !== 0 || moveZ !== 0) {
            const dir = new THREE.Vector2(moveX, moveZ).normalize();
            this.velocity.x += dir.x * this.speed * delta * 50;
            this.velocity.z += dir.y * this.speed * delta * 50;
            
            // Rotate player to face move direction
            const angle = Math.atan2(moveX, moveZ);
            this.mesh.rotation.y = THREE.MathUtils.lerp(this.mesh.rotation.y, angle, 0.1);
        }

        if (this.keys['Space'] && this.onGround) {
            this.velocity.y = this.jumpForce;
            this.onGround = false;
        }

        // Apply Velocity with Simple Axis-Wise Collision
        const nextPos = this.position.clone().add(this.velocity.clone().multiplyScalar(delta));

        // Y Collision
        this.position.y = nextPos.y;
        this.onGround = false;
        if (this.position.y < 0) {
            this.position.y = 0;
            this.velocity.y = 0;
            this.onGround = true;
        }

        for (const wall of colliders) {
            const playerBounds = this.getBounds();
            const wallBounds = wall.getBounds();
            if (checkCollision(playerBounds, wallBounds)) {
                // Vertical collision handling
                if (this.velocity.y < 0) {
                    this.position.y = wallBounds.max.y;
                    this.velocity.y = 0;
                    this.onGround = true;
                } else if (this.velocity.y > 0) {
                    this.position.y = wallBounds.min.y - this.size.y;
                    this.velocity.y = 0;
                }
            }
        }

        // X Collision
        this.position.x = nextPos.x;
        for (const wall of colliders) {
            if (checkCollision(this.getBounds(), wall.getBounds())) {
                this.position.x -= this.velocity.x * delta;
                this.velocity.x = 0;
            }
        }

        // Z Collision
        this.position.z = nextPos.z;
        for (const wall of colliders) {
            if (checkCollision(this.getBounds(), wall.getBounds())) {
                this.position.z -= this.velocity.z * delta;
                this.velocity.z = 0;
            }
        }

        // Sync Mesh
        this.mesh.position.copy(this.position);

        // Update Camera
        const targetCamPos = this.position.clone().add(this.cameraOffset);
        this.engine.camera.position.lerp(targetCamPos, 0.1);
        this.engine.camera.lookAt(this.position.clone().add(new THREE.Vector3(0, 1, 0)));
    }
}
