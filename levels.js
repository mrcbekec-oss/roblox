import * as THREE from 'three';
import { Entity } from './engine.js';

export class LevelManager {
    constructor(engine) {
        this.engine = engine;
        this.currentLevel = null;
        this.levels = [];
        this.generateLevels();
    }

    generateLevels() {
        // Create 20 Obby Levels
        for (let i = 1; i <= 20; i++) {
            this.levels.push({
                id: `obby-${i}`,
                name: `Obby Challenge ${i}`,
                type: 'obby',
                difficulty: i,
                color: 0xFF4D4D
            });
        }
        // Create 10 Speed Run Levels
        for (let i = 1; i <= 10; i++) {
            this.levels.push({
                id: `speed-${i}`,
                name: `Sonic Speed ${i}`,
                type: 'speed',
                difficulty: i,
                color: 0x4D96FF
            });
        }
        // Create 10 Combat Arenas
        for (let i = 1; i <= 10; i++) {
            this.levels.push({
                id: `combat-${i}`,
                name: `Arena Strike ${i}`,
                type: 'combat',
                difficulty: i,
                color: 0x333333
            });
        }
        // Create 10 Tycoon/Clicker Levels
        for (let i = 1; i <= 10; i++) {
            this.levels.push({
                id: `tycoon-${i}`,
                name: `Rich Tycoon ${i}`,
                type: 'tycoon',
                difficulty: i,
                color: 0xFFD930
            });
        }
    }

    loadLobby() {
        this.engine.clearScene();
        
        // Ground
        const floorGeo = new THREE.PlaneGeometry(100, 100);
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x228B22 }); // Grass Green
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.engine.addEntity(new Entity({ mesh: floor, isStatic: true, size: new THREE.Vector3(100, 0, 100) }));

        // Decoration: Some trees
        for (let i = 0; i < 20; i++) {
            this.createTree(
                (Math.random() - 0.5) * 80,
                (Math.random() - 0.5) * 80
            );
        }

        // Portals to categories
        this.createPortal(new THREE.Vector3(-15, 0, -10), 'Obbies', 0xFF4D4D, 'obby-1');
        this.createPortal(new THREE.Vector3(15, 0, -10), 'Speed Runs', 0x4D96FF, 'speed-1');
        this.createPortal(new THREE.Vector3(0, 0, -20), 'Combat', 0x333333, 'combat-1');
        this.createPortal(new THREE.Vector3(-15, 0, 10), 'Tycoons', 0xFFD930, 'tycoon-1');

        document.getElementById('current-zone').innerText = "Main Lobby";
    }

    createTree(x, z) {
        const trunkGeo = new THREE.BoxGeometry(1, 4, 1);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.set(x, 2, z);
        trunk.castShadow = true;
        this.engine.addEntity(new Entity({ mesh: trunk, isStatic: true, size: new THREE.Vector3(1, 4, 1) }));

        const leavesGeo = new THREE.BoxGeometry(4, 4, 4);
        const leavesMat = new THREE.MeshStandardMaterial({ color: 0x006400 });
        const leaves = new THREE.Mesh(leavesGeo, leavesMat);
        leaves.position.set(x, 6, z);
        leaves.castShadow = true;
        this.engine.addEntity(new Entity({ mesh: leaves }));
    }

    createPortal(pos, label, color, firstLevelId) {
        const geo = new THREE.TorusGeometry(3, 0.5, 16, 32);
        const mat = new THREE.MeshStandardMaterial({ 
            color: color, 
            emissive: color, 
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.8
        });
        const portal = new THREE.Mesh(geo, mat);
        portal.position.copy(pos).add(new THREE.Vector3(0, 4, 0));
        
        const gate = new Entity({ mesh: portal, isStatic: false, size: new THREE.Vector3(6, 6, 1) });
        gate.update = (delta) => {
            portal.rotation.y += delta;
            portal.rotation.z += delta * 0.5;
            
            // Check interaction with player
            const dist = this.engine.player.position.clone().add(new THREE.Vector3(0, 1, 0)).distanceTo(portal.position);
            if (dist < 3) {
                // Open Game List for this category
                this.showGameList(label.toLowerCase());
            }
        };
        this.engine.addEntity(gate);
    }

    showGameList(category) {
        const modal = document.getElementById('game-list-modal');
        const grid = document.getElementById('game-grid');
        grid.innerHTML = '';
        
        const filtered = this.levels.filter(l => category.includes(l.type));
        filtered.forEach(level => {
            const card = document.createElement('div');
            card.className = 'game-card';
            card.innerHTML = `<span>🎮</span><b>${level.name}</b><br><small>Level ${level.difficulty}</small>`;
            card.onclick = () => {
                modal.classList.add('hidden');
                this.loadLevel(level.id);
            };
            grid.appendChild(card);
        });
        
        modal.classList.remove('hidden');
    }

    loadLevel(id) {
        const level = this.levels.find(l => l.id === id);
        if (!level) return;

        this.engine.clearScene();
        this.currentLevel = level;
        document.getElementById('current-zone').innerText = level.name;

        // Ground for level
        const floorGeo = new THREE.BoxGeometry(20, 1, 20);
        const floorMat = new THREE.MeshStandardMaterial({ color: level.color });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.position.y = -0.5;
        this.engine.addEntity(new Entity({ mesh: floor, isStatic: true, size: new THREE.Vector3(20, 1, 20) }));

        // Procedural Content based on type
        if (level.type === 'obby') this.buildObby(level);
        if (level.type === 'speed') this.buildSpeedRun(level);
        if (level.type === 'combat') this.buildCombatArena(level);
        if (level.type === 'tycoon') this.buildTycoon(level);

        // Respawn player
        this.engine.player.position.set(0, 5, 0);
        this.engine.player.velocity.set(0, 0, 0);
        
        // Add "Return to Lobby" button/portal
        this.createReturnPortal();
    }

    buildObby(level) {
        const count = 5 + level.difficulty * 2;
        for (let i = 1; i < count; i++) {
            const dist = i * 8;
            const x = (Math.random() - 0.5) * 10;
            const size = 3 - (level.difficulty * 0.1);
            
            const platGeo = new THREE.BoxGeometry(size, 0.5, size);
            const platMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
            const plat = new THREE.Mesh(platGeo, platMat);
            plat.position.set(x, i * 2, -dist);
            
            this.engine.addEntity(new Entity({ mesh: plat, isStatic: true, size: new THREE.Vector3(size, 0.5, size), position: plat.position }));
        }
        
        // Goal at the end
        this.createGoal(new THREE.Vector3(0, count * 2, -count * 8));
    }

    buildSpeedRun(level) {
        const length = 50 + level.difficulty * 20;
        const trackGeo = new THREE.BoxGeometry(10, 0.5, length);
        const trackMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const track = new THREE.Mesh(trackGeo, trackMat);
        track.position.z = -length / 2;
        this.engine.addEntity(new Entity({ mesh: track, isStatic: true, size: new THREE.Vector3(10, 0.5, length), position: track.position }));

        // Add boosters
        for (let i = 0; i < level.difficulty * 2; i++) {
            const z = -Math.random() * length;
            this.createBooster(new THREE.Vector3(0, 0.5, z));
        }
        
        this.createGoal(new THREE.Vector3(0, 1, -length));
    }

    buildCombatArena(level) {
        // Enclose arena
        const wallGeo = new THREE.BoxGeometry(40, 10, 1);
        const wallMat = new THREE.MeshStandardMaterial({ color: 0x444444, transparent: true, opacity: 0.5 });
        
        const walls = [
            { pos: [0, 5, 20], rot: [0, 0, 0] },
            { pos: [0, 5, -20], rot: [0, 0, 0] },
            { pos: [20, 5, 0], rot: [0, Math.PI/2, 0] },
            { pos: [-20, 5, 0], rot: [0, Math.PI/2, 0] }
        ];

        walls.forEach(w => {
            const m = new THREE.Mesh(wallGeo, wallMat);
            m.position.set(...w.pos);
            m.rotation.set(...w.rot);
            this.engine.addEntity(new Entity({ mesh: m, isStatic: true, size: new THREE.Vector3(40, 10, 40) })); // Oversimplified AABB
        });

        // Add Bots (Simulated)
        for(let i=0; i<level.difficulty; i++) {
            this.createBot(new THREE.Vector3((Math.random()-0.5)*30, 1, (Math.random()-0.5)*30));
        }
    }

    buildTycoon(level) {
        // Drop points and machines
        for (let i = 0; i < 4; i++) {
            const x = (i % 2 === 0 ? 5 : -5);
            const z = (i < 2 ? 5 : -5);
            this.createClickerNode(new THREE.Vector3(x, 1, z), level.difficulty);
        }
    }

    createGoal(pos) {
        const geo = new THREE.BoxGeometry(4, 8, 1);
        const mat = new THREE.MeshStandardMaterial({ color: 0x00FF00, emissive: 0x00FF00 });
        const goal = new THREE.Mesh(geo, mat);
        goal.position.copy(pos);
        
        const ent = new Entity({ mesh: goal, isStatic: false, size: new THREE.Vector3(4, 8, 1) });
        ent.update = () => {
            if (this.engine.player.position.distanceTo(pos) < 3) {
                this.winLevel();
            }
        };
        this.engine.addEntity(ent);
    }

    createReturnPortal() {
        const btn = document.createElement('button');
        btn.innerText = "Lobby";
        btn.style.position = 'fixed';
        btn.style.top = '100px';
        btn.style.right = '20px';
        btn.className = 'btn-primary';
        btn.id = 'temp-lobby-btn';
        btn.onclick = () => {
            btn.remove();
            this.loadLobby();
        };
        document.body.appendChild(btn);
    }

    winLevel() {
        const overlay = document.getElementById('overlay-screen');
        document.getElementById('overlay-title').innerText = "VICTORY!";
        document.getElementById('overlay-msg').innerText = `You completed: ${this.currentLevel.name}`;
        overlay.classList.remove('hidden');
        
        const wins = parseInt(document.getElementById('player-wins').innerText.split('/')[0]) + 1;
        document.getElementById('player-wins').innerText = `${wins}/50`;
        
        document.getElementById('btn-respawn').onclick = () => {
            overlay.classList.add('hidden');
            const btn = document.getElementById('temp-lobby-btn');
            if(btn) btn.remove();
            this.loadLobby();
        };
    }

    createBooster(pos) {
        const geo = new THREE.BoxGeometry(4, 0.2, 4);
        const mat = new THREE.MeshStandardMaterial({ color: 0x00FFFF, emissive: 0x00FFFF });
        const booster = new THREE.Mesh(geo, mat);
        booster.position.copy(pos);
        const ent = new Entity({ mesh: booster, isStatic: false, size: new THREE.Vector3(4, 0.5, 4) });
        ent.update = () => {
            if (this.engine.player.position.clone().add(new THREE.Vector3(0,1,0)).distanceTo(pos) < 3) {
                this.engine.player.velocity.z -= 2; // Speed boost
            }
        };
        this.engine.addEntity(ent);
    }

    createBot(pos) {
        const geo = new THREE.BoxGeometry(1, 2, 1);
        const mat = new THREE.MeshStandardMaterial({ color: 0xFF0000 });
        const bot = new THREE.Mesh(geo, mat);
        bot.position.copy(pos);
        const ent = new Entity({ mesh: bot, isStatic: false, size: new THREE.Vector3(1, 2, 1) });
        ent.update = (delta) => {
            // Simple logic: chase player
            const dir = this.engine.player.position.clone().sub(bot.position).normalize();
            bot.position.add(dir.multiplyScalar(delta * 4));
            if (bot.position.distanceTo(this.engine.player.position) < 1.5) {
                this.engine.player.position.set(0, 10, 0); // Reset player
            }
        };
        this.engine.addEntity(ent);
    }

    createClickerNode(pos, diff) {
        const geo = new THREE.CylinderGeometry(2, 2, 1, 16);
        const mat = new THREE.MeshStandardMaterial({ color: 0xDAA520 });
        const node = new THREE.Mesh(geo, mat);
        node.position.copy(pos);
        const ent = new Entity({ mesh: node, isStatic: true, size: new THREE.Vector3(4, 1, 4) });
        ent.update = () => {
            if (this.engine.player.position.distanceTo(pos) < 3) {
                const coins = parseInt(document.getElementById('player-coins').innerText) + 1;
                document.getElementById('player-coins').innerText = coins;
            }
        };
        this.engine.addEntity(ent);
    }
}
