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
        // Respawn / Reset
        document.getElementById('btn-respawn').onclick = () => {
             document.getElementById('overlay-screen').classList.add('hidden');
             this.levelManager.loadLobby();
        };

        // Open Game Library directly
        document.getElementById('btn-menu').onclick = () => {
            this.levelManager.showGameList('obby speed combat tycoon');
        };

        // Shop button (Simple cosmetic change for now)
        document.getElementById('btn-shop').onclick = () => {
             const coins = parseInt(document.getElementById('player-coins').innerText);
             if (coins >= 100) {
                 alert("You bought a Gold Skin! (Visual only for now)");
             } else {
                 alert("You need 100 coins for a Gold Skin!");
             }
        };
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
