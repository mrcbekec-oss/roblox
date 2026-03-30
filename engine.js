import * as THREE from 'three';

export class Engine {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
        this.scene.fog = new THREE.FogExp2(0x87CEEB, 0.015);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        this.entities = [];
        this.colliders = [];
        this.lastTime = 0;

        this.initLights();
        window.addEventListener('resize', () => this.onResize());
    }

    initLights() {
        const ambient = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambient);

        const sun = new THREE.DirectionalLight(0xffffff, 1.2);
        sun.position.set(50, 100, 50);
        sun.castShadow = true;
        sun.shadow.mapSize.width = 2048;
        sun.shadow.mapSize.height = 2048;
        sun.shadow.camera.left = -100;
        sun.shadow.camera.right = 100;
        sun.shadow.camera.top = 100;
        sun.shadow.camera.bottom = -100;
        this.scene.add(sun);
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    addEntity(entity) {
        this.entities.push(entity);
        if (entity.mesh) this.scene.add(entity.mesh);
        if (entity.isStatic) this.colliders.push(entity);
        return entity;
    }

    removeEntity(entity) {
        const idx = this.entities.indexOf(entity);
        if (idx > -1) {
            this.entities.splice(idx, 1);
            if (entity.mesh) this.scene.remove(entity.mesh);
        }
        const cidx = this.colliders.indexOf(entity);
        if (cidx > -1) this.colliders.splice(cidx, 1);
    }

    clearScene(exclude = []) {
        this.entities.forEach(e => {
            if (!exclude.includes(e)) {
                if (e.mesh) this.scene.remove(e.mesh);
            }
        });
        this.entities = this.entities.filter(e => exclude.includes(e));
        this.colliders = [];
    }

    update(time) {
        const delta = Math.min((time - this.lastTime) / 1000, 0.1);
        this.lastTime = time;

        for (const entity of this.entities) {
            if (entity.update) entity.update(delta, this.colliders);
        }

        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame((t) => this.update(t));
    }

    start() {
        requestAnimationFrame((t) => this.update(t));
    }
}

export class Entity {
    constructor(options = {}) {
        this.position = options.position || new THREE.Vector3();
        this.rotation = options.rotation || new THREE.Euler();
        this.scale = options.scale || new THREE.Vector3(1, 1, 1);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.isStatic = options.isStatic || false;
        this.mesh = options.mesh || null;
        this.size = options.size || new THREE.Vector3(1, 1, 1); // Used for AABB
        
        if (this.mesh) {
            this.mesh.position.copy(this.position);
            this.mesh.rotation.copy(this.rotation);
            this.mesh.scale.copy(this.scale);
        }
    }

    getBounds() {
        return {
            min: new THREE.Vector3(
                this.position.x - this.size.x / 2,
                this.position.y,
                this.position.z - this.size.z / 2
            ),
            max: new THREE.Vector3(
                this.position.x + this.size.x / 2,
                this.position.y + this.size.y,
                this.position.z + this.size.z / 2
            )
        };
    }
}

// Simple AABB Collision Function
export function checkCollision(bounds1, bounds2) {
    return (
        bounds1.min.x <= bounds2.max.x &&
        bounds1.max.x >= bounds2.min.x &&
        bounds1.min.y <= bounds2.max.y &&
        bounds1.max.y >= bounds2.min.y &&
        bounds1.min.z <= bounds2.max.z &&
        bounds1.max.z >= bounds2.min.z
    );
}
