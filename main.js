import { Engine } from './engine.js';
import { Player } from './player.js';
import { LevelManager } from './levels.js';

class GameApp {
    constructor() {
        this.engine = new Engine('game-container');
        this.player = new Player(this.engine);
        this.engine.player = this.player; // Reference for entities
        this.engine.addEntity(this.player);

        this.levelManager = new LevelManager(this.engine);
        this.levelManager.loadLobby();

        this.initUI();
        this.initJoystick();
        this.initSimulatedChat();
        
        // Start engine
        this.engine.start();

        // Hide loading screen after a short delay
        setTimeout(() => {
            const progress = document.getElementById('progress');
            progress.style.width = '100%';
            setTimeout(() => {
                document.getElementById('loading-screen').style.opacity = '0';
                setTimeout(() => {
                    document.getElementById('loading-screen').style.display = 'none';
                }, 500);
            }, 500);
        }, 1000);
    }

    initUI() {
        // Main Menu - Tabs
        const navBtns = document.querySelectorAll('.nav-btn');
        const tabPanes = document.querySelectorAll('.tab-pane');
        
        navBtns.forEach(btn => {
            btn.onclick = () => {
                navBtns.forEach(b => b.classList.remove('active'));
                tabPanes.forEach(p => p.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
                
                if (btn.dataset.tab === 'discover') this.populateMenuGrid();
            };
        });

        // Main Menu - Play Button
        document.getElementById('btn-play-now').onclick = () => {
            document.getElementById('main-menu').classList.add('hidden-menu');
            this.levelManager.loadLobby();
        };

        // Avatar - Color Pickers
        const swatches = document.querySelectorAll('.swatch');
        swatches.forEach(s => {
            s.onclick = () => {
                swatches.forEach(sw => sw.classList.remove('selected'));
                s.classList.add('selected');
                const color = s.dataset.color;
                // Update player avatar color
                this.player.mesh.children[0].material.color.set(color); // Body
                this.player.mesh.children[2].material.color.set(color); // Larm
                this.player.mesh.children[3].material.color.set(color); // Rarm
            };
        });

        // Respawn / Reset
        document.getElementById('btn-respawn').onclick = () => {
             document.getElementById('overlay-screen').classList.add('hidden');
             this.levelManager.loadLobby();
        };

        // HUD - Open Menu (Back to Menu)
        document.getElementById('btn-menu').onclick = () => {
            document.getElementById('main-menu').classList.remove('hidden-menu');
        };

        // Shop button
        document.getElementById('btn-shop').onclick = () => {
             const coins = parseInt(document.getElementById('player-coins').innerText);
             if (coins >= 100) {
                 alert("You bought a Gold Skin!");
                 this.player.mesh.children[0].material.color.set(0xDAA520);
             } else {
                 alert("You need 100 coins for a Gold Skin!");
             }
        };

        this.populateFeatured();
    }

    populateFeatured() {
        const grid = document.getElementById('featured-grid');
        grid.innerHTML = '';
        const featured = this.levelManager.levels.slice(0, 10);
        featured.forEach(level => {
            const item = document.createElement('div');
            item.className = 'game-thumb';
            item.innerHTML = `<span>🎮</span><b>${level.name}</b>`;
            item.onclick = () => {
                document.getElementById('main-menu').classList.add('hidden-menu');
                this.levelManager.loadLevel(level.id);
            };
            grid.appendChild(item);
        });
    }

    populateMenuGrid() {
        const grid = document.getElementById('menu-game-grid');
        grid.innerHTML = '';
        this.levelManager.levels.forEach(level => {
            const item = document.createElement('div');
            item.className = 'game-thumb';
            item.innerHTML = `<span>🎮</span><b>${level.name}</b><br><small>${level.type.toUpperCase()}</small>`;
            item.onclick = () => {
                document.getElementById('main-menu').classList.add('hidden-menu');
                this.levelManager.loadLevel(level.id);
            };
            grid.appendChild(item);
        });
    }

    initJoystick() {
        const base = document.getElementById('joystick-base');
        const thumb = document.getElementById('joystick-thumb');
        let active = false;
        let startPos = { x: 0, y: 0 };

        const handleMove = (e) => {
            if (!active) return;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            const dx = clientX - startPos.x;
            const dy = clientY - startPos.y;
            const dist = Math.min(60, Math.sqrt(dx*dx + dy*dy));
            const angle = Math.atan2(dy, dx);

            thumb.style.transform = `translate(calc(-50% + ${Math.cos(angle) * dist}px), calc(-50% + ${Math.sin(angle) * dist}px))`;
            
            // Map to player keys (Simulated)
            this.player.keys['KeyW'] = dy < -20;
            this.player.keys['KeyS'] = dy > 20;
            this.player.keys['KeyA'] = dx < -20;
            this.player.keys['KeyD'] = dx > 20;
        };

        base.addEventListener('pointerdown', (e) => {
            active = true;
            startPos = { x: e.clientX, y: e.clientY };
        });

        window.addEventListener('pointermove', handleMove);
        window.addEventListener('pointerup', () => {
            active = false;
            thumb.style.transform = 'translate(-50%, -50%)';
            this.player.keys['KeyW'] = false;
            this.player.keys['KeyS'] = false;
            this.player.keys['KeyA'] = false;
            this.player.keys['KeyD'] = false;
        });
    }

    initSimulatedChat() {
        const messages = document.getElementById('chat-messages');
        const input = document.getElementById('chat-input');
        const sendBtn = document.getElementById('btn-chat-send');

        const addMsg = (name, text) => {
            const div = document.createElement('div');
            div.className = 'chat-msg';
            div.innerHTML = `<span class="name">${name}:</span> ${text}`;
            messages.appendChild(div);
            messages.scrollTop = messages.scrollHeight;
        };

        const playerNames = ['GamerPro123', 'RobloxMaster', 'NoobKing', 'Ninja07', 'CoolCat'];
        const randomTexts = [
            'How do I play Obby 5?',
            'This game is awesome!',
            'Trade me coins!',
            'Who wants to join my combat arena?',
            'I just finished all speed runs!',
            'LAGGGGG',
            'Anyone know where the secret portal is?',
            'GG WP',
            'Hello everyone!'
        ];

        // Periodic bot chat
        setInterval(() => {
            if (Math.random() > 0.7) {
                const name = playerNames[Math.floor(Math.random() * playerNames.length)];
                const text = randomTexts[Math.floor(Math.random() * randomTexts.length)];
                addMsg(name, text);
            }
        }, 5000);

        const handleSend = () => {
            if (input.value.trim()) {
                addMsg('YOU', input.value.trim());
                input.value = '';
            }
        };

        sendBtn.onclick = handleSend;
        input.onkeypress = (e) => { if (e.key === 'Enter') handleSend(); };
        
        addMsg('System', 'Welcome to Mega Roblox Hub! Explore 50 epic games.');
    }
}

// Global reference for debugging
window.game = new GameApp();
