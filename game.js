const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let score = 0;
let gameActive = false;
let controlMode = 'touch'; 
let keys = {}; 
let currentLevel = 1;
let particles = []; 
let powerUps = []; 
let scoreMultiplier = 1; 
let multiplierTimer = 0; 
let lastScorePlatformIndex = 0;
let bgParticles = [];
let shakeTime = 0; 
let lastTouchX = null;
let tiltSensitivity = 0.4;
let touchSensitivity = 1.2;

// --- FUNZIONI SETTINGS & UI ---
function toggleSettings() {
    const panel = document.getElementById('settings-panel');
    if (!panel) return;
    
    const isVisible = panel.classList.contains('active');
    
    if (!isVisible) {
        const nameInput = document.getElementById('edit-player-name');
        if (nameInput) {
            const savedName = localStorage.getItem('vibeJump_playerName') || "";
            nameInput.value = savedName; 
        }
        gameActive = false;
        updateStatsDisplay();
        panel.classList.add('active');
    } else {
        panel.classList.remove('active');
    }
}

window.onload = () => {
    const tiltInput = document.getElementById('tilt-sens');
    const touchInput = document.getElementById('touch-sens');
    const tiltVal = document.getElementById('tilt-val'); 
    const touchVal = document.getElementById('touch-val'); 

    const savedTilt = localStorage.getItem('vibeJump_tilt');
    const savedTouch = localStorage.getItem('vibeJump_touch');

    if(savedTilt) {
        tiltSensitivity = parseFloat(savedTilt);
        if(tiltInput) tiltInput.value = tiltSensitivity;
        if(tiltVal) tiltVal.innerText = tiltSensitivity;
    }
    if(savedTouch) {
        touchSensitivity = parseFloat(savedTouch);
        if(touchInput) touchInput.value = touchSensitivity;
        if(touchVal) touchVal.innerText = touchSensitivity;
    }

    if(tiltInput) {
        tiltInput.addEventListener('input', (e) => {
            tiltSensitivity = parseFloat(e.target.value);
            if(tiltVal) tiltVal.innerText = tiltSensitivity;
            localStorage.setItem('vibeJump_tilt', tiltSensitivity);
        });
    }

    if(touchInput) {
        touchInput.addEventListener('input', (e) => {
            touchSensitivity = parseFloat(e.target.value);
            if(touchVal) touchVal.innerText = touchSensitivity;
            localStorage.setItem('vibeJump_touch', touchSensitivity);
        });
    }
    refreshPlayerDisplay();
    loadLeaderboardFromGoogle();
    updateStatsDisplay();
};

function refreshPlayerDisplay() {
    const display = document.getElementById('player-display');
    const savedName = localStorage.getItem('vibeJump_playerName');
    if (display) {
        display.innerText = savedName ? `GIOCATORE: ${savedName}` : "BENVENUTO, JUMPER!";
    }
}

function changeName() {
    if(confirm("Vuoi resettare tutto? Perderai nome, record e punti totali.")) {
        localStorage.clear();
        location.reload();
    }
}

function updateName() {
    const nameInput = document.getElementById('edit-player-name');
    const newName = nameInput.value.trim(); 
    if (newName) {
        localStorage.setItem('vibeJump_playerName', newName);
        nameInput.style.borderColor = "#00ff00"; 
        setTimeout(() => { nameInput.style.borderColor = "#00ffcc"; }, 1000);
        refreshPlayerDisplay(); 
        nameInput.blur(); 
    } else {
        alert("Inserisci un nome valido.");
    }
}

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxfy0WfaSt_PWRr5TH84MJPyTulurfy3adZHLPeuEmtkjLS4yn_mWOXHKO0F9U49fpM/exec";

const themes = [
    { name: "Cyber City", ball: "#00ffcc", plat: "#ffffff", bg: "#0a0a0a", pColor: "#00ffcc", pSpeed: 1, pShape: "square" }, 
    { name: "Synth Wave", ball: "#ff00ff", plat: "#ff00ff", bg: "#1a001a", pColor: "#ff00ff", pSpeed: 1.5, pShape: "circle" }, 
    { name: "Nuclear Zone", ball: "#ccff00", plat: "#ccff00", bg: "#0d1a00", pColor: "#ccff00", pSpeed: 2, pShape: "square" }, 
    { name: "Deep Space", ball: "#0077ff", plat: "#ffffff", bg: "#00051a", pColor: "#ffffff", pSpeed: 0.5, pShape: "circle" }, 
    { name: "Mars Orbit", ball: "#ff3300", plat: "#ffcc00", bg: "#1a0500", pColor: "#ffcc00", pSpeed: 1.2, pShape: "circle" }
];

let ballColor = themes[0].ball;

let ball = {
    x: canvas.width / 2,
    y: canvas.height - 150,
    radius: 15,
    dy: 0,
    jumpForce: -14,
    gravity: 0.5,
    squash: 1 
};

let platforms = [];
let lastPlatformIndex = 0;

class PowerUp {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.w = 25; this.h = 25;
        this.active = true;
    }
    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        ctx.fillStyle = "#ffff00";
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#ffff00";
        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.restore();
    }
}

async function saveScoreToGoogle(name, score) {
    try {
        await fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ name: name, score: score }) });
        setTimeout(loadLeaderboardFromGoogle, 1000);
    } catch (e) { console.error(e); }
}

async function loadLeaderboardFromGoogle() {
    try {
        const response = await fetch(SCRIPT_URL);
        const data = await response.json();
        const list = document.getElementById('highscores-list');
        if(list) list.innerHTML = data.slice(0, 5).map(row => `<li><span class="name-val">${row[0]}</span> <span class="score-val">${row[1]}</span></li>`).join('');
    } catch (e) { console.error(e); }
}

function getPlayerName() {
    let savedName = localStorage.getItem('vibeJump_playerName');
    if (!savedName || savedName.trim() === "") {
        savedName = prompt("BENVENUTO! Inserisci il tuo nome:", "Player1") || "Player1";
        localStorage.setItem('vibeJump_playerName', savedName.substring(0, 15));
    }
    return savedName;
}

function setControl(mode) {
    controlMode = mode;
    const btnTouch = document.getElementById('btnTouch');
    const btnTilt = document.getElementById('btnTilt');
    if(btnTouch) btnTouch.classList.remove('active');
    if(btnTilt) btnTilt.classList.remove('active');
    const activeBtn = (mode === 'touch') ? btnTouch : btnTilt;
    if(activeBtn) activeBtn.classList.add('active');
}

// --- INPUT ---
window.addEventListener('keydown', (e) => { 
    if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        if(!gameActive) startGame();
    }
    keys[e.code] = true; 
});

window.addEventListener('keyup', (e) => { keys[e.code] = false; });

window.addEventListener('touchstart', (e) => { 
    if(controlMode === 'touch' && gameActive) lastTouchX = e.touches[0].clientX; 
}, { passive: false });

window.addEventListener('touchmove', (e) => { 
    if(controlMode === 'touch' && gameActive && lastTouchX !== null) {
        e.preventDefault(); 
        let touchX = e.touches[0].clientX;
        let deltaX = touchX - lastTouchX;
        ball.x += deltaX * touchSensitivity;
        lastTouchX = touchX;
    }
}, { passive: false });

window.addEventListener('touchend', () => { lastTouchX = null; });

window.addEventListener('deviceorientation', (e) => {
    if(controlMode === 'tilt' && gameActive && e.gamma !== null) {
        let tiltSpeed = e.gamma * tiltSensitivity; 
        if (Math.abs(e.gamma) < 2) tiltSpeed = 0;
        ball.x += Math.max(-10, Math.min(10, tiltSpeed));
    }
});

function createParticles(x, y, color) {
    for (let i = 0; i < 8; i++) {
        particles.push({
            x: x, y: y, radius: Math.random() * 3 + 1,
            vx: (Math.random() - 0.5) * 10, vy: (Math.random() * -5) - 2,
            life: 30, color: color
        });
    }
}
  
function createBgParticles() {
    bgParticles = [];
    for (let i = 0; i < 50; i++) {
        bgParticles.push({
            x: Math.random() * canvas.width, y: Math.random() * canvas.height,
            size: Math.random() * 3 + 1, speed: Math.random() * 1 + 0.5
        });
    }
}

function createPlatforms() {
    platforms = [];
    lastPlatformIndex = 0;
    let lastX = canvas.width / 2 - 50;
    platforms.push({ x: lastX, y: canvas.height - 50, w: 100, h: 15, index: 0, speed: 0, glow: 0 });
    for(let i=1; i<7; i++) {
        lastPlatformIndex++;
        let newX = Math.max(20, Math.min(canvas.width - 120, lastX + (Math.random() - 0.5) * 500));
        lastX = newX;
        platforms.push({ x: newX, y: canvas.height - (i * 150), w: 100, h: 15, index: lastPlatformIndex, speed: 0, glow: 0 });
    }
}

function startGame() {
    score = 0; 
    powerUps = []; 
    scoreMultiplier = 1; 
    multiplierTimer = 0;
    currentLevel = 1; 
    particles = []; 
    ballColor = themes[0].ball;
    lastScorePlatformIndex = 0;
    
    const scoreElem = document.getElementById('score');
    const multTag = document.getElementById('multiplier-tag');

    scoreElem.innerText = "0";
    scoreElem.style.display = 'block';
    scoreElem.style.color = "#ffffff";
    
    if (multTag) {
        multTag.style.display = 'none';
        multTag.style.margin = "0 auto"; // Forza la centratura orizzontale
    }
    
    document.getElementById('start-screen').style.display = 'none';
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) settingsBtn.style.display = 'none';

    document.body.style.backgroundColor = themes[0].bg;
    ball.gravity = 0.5; 
    ball.dy = ball.jumpForce;
    ball.x = canvas.width / 2; 
    ball.y = canvas.height - 100;
    
    createPlatforms();
    gameActive = true;
    
    let games = parseInt(localStorage.getItem('vibeJump_games') || 0);
    localStorage.setItem('vibeJump_games', games + 1);
}

function updateStatsDisplay() {
    document.getElementById('stat-games').innerText = localStorage.getItem('vibeJump_games') || 0;
    document.getElementById('stat-best').innerText = Math.floor(localStorage.getItem('vibeJump_highScore') || 0);
    document.getElementById('stat-total').innerText = Math.floor(localStorage.getItem('vibeJump_totalPoints') || 0);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    
    if (shakeTime > 0) {
        ctx.translate((Math.random() - 0.5) * 7, (Math.random() - 0.5) * 7);
        shakeTime--;
    }

    let currentTheme = themes[(currentLevel - 1) % themes.length];

    bgParticles.forEach(p => {
        ctx.fillStyle = currentTheme.pColor + "33";
        if (currentTheme.pShape === "square") ctx.fillRect(p.x, p.y, p.size, p.size);
        else { ctx.beginPath(); ctx.arc(p.x, p.y, p.size/2, 0, Math.PI * 2); ctx.fill(); }
        p.y += p.speed * currentTheme.pSpeed;
        if(gameActive && ball.y === canvas.height / 2 && ball.dy < 0) p.y += Math.abs(ball.dy) * 0.5;
        if (p.y > canvas.height) { p.y = -10; p.x = Math.random() * canvas.width; }
    });

    if(gameActive) {
        if (keys['ArrowLeft']) ball.x -= 8;
        if (keys['ArrowRight']) ball.x += 8;

        let newLevel = Math.floor(score / 20) + 1;
        if (newLevel !== currentLevel) {
            currentLevel = newLevel;
            let theme = themes[(currentLevel - 1) % themes.length];
            ballColor = theme.ball;
            document.body.style.backgroundColor = theme.bg;
            ball.gravity = Math.min(0.5 + (currentLevel * 0.02), 0.65);
        }

        ball.y += ball.dy;
        ball.dy += ball.gravity;
        ball.squash += (1 - ball.squash) * 0.15;

        if(ball.x < 0) ball.x = canvas.width;
        if(ball.x > canvas.width) ball.x = 0;

        if(ball.y < canvas.height / 2) {
            let diff = canvas.height / 2 - ball.y;
            ball.y = canvas.height / 2;
            platforms.forEach(p => {
                p.y += diff;
                if(p.y > canvas.height) {
                    let highest = platforms.reduce((prev, curr) => (prev.y < curr.y) ? prev : curr);
                    p.y = highest.y - (190 - (ball.gravity * 100));
                    p.x = Math.max(20, Math.min(canvas.width - 120, highest.x + (Math.random() - 0.5) * 400));
                    lastPlatformIndex++;
                    p.index = lastPlatformIndex;
                    p.speed = (currentLevel >= 2) ? (Math.random() - 0.5) * (currentLevel * 1.2) : 0;
                }
            });
            powerUps.forEach(p => p.y += diff);
        }

        // --- GESTIONE POWER-UPS ---
        if (Math.random() < 0.003) powerUps.push(new PowerUp(Math.random() * (canvas.width - 30), -50));
        for (let i = powerUps.length - 1; i >= 0; i--) {
            let p = powerUps[i];
            p.y += 1;
            if (p.active && ball.x + ball.radius > p.x && ball.x - ball.radius < p.x + p.w && ball.y + ball.radius > p.y && ball.y - ball.radius < p.y + p.h) {
                p.active = false; 
                scoreMultiplier = 2; 
                multiplierTimer = 400;
                createParticles(p.x, p.y, "#ffff00");
            }
            p.draw(ctx);
            if (p.y > canvas.height) powerUps.splice(i, 1);
        }

       // --- GESTIONE MOLTIPLICATORE UI ---
const multTag = document.getElementById('multiplier-tag');
const scoreDisplay = document.getElementById('score');

if (multiplierTimer > 0) {
    multiplierTimer--;
    scoreMultiplier = 2;
    if (multTag) {
        multTag.style.display = 'block'; // Lo mette sotto il punteggio
        multTag.style.opacity = (multiplierTimer < 120 && Math.floor(multiplierTimer / 5) % 2 === 0) ? "0.2" : "1";
    }
    if (scoreDisplay) scoreDisplay.style.color = "#ffff00"; 
} else {
    scoreMultiplier = 1;
    if (multTag) multTag.style.display = 'none';
    if (scoreDisplay) scoreDisplay.style.color = "#ffffff";
}

        // --- COLLISIONI PIATTAFORME ---
        platforms.forEach(p => {
            if(p.speed) { p.x += p.speed; if(p.x < 0 || p.x > canvas.width - p.w) p.speed *= -1; }
            if(ball.dy > 0 && ball.x + 10 > p.x && ball.x - 10 < p.x + p.w && ball.y + ball.radius > p.y && ball.y + ball.radius < p.y + p.h) {
                ball.dy = ball.jumpForce; ball.squash = 0.5; p.glow = 1.0;
                shakeTime = 2;
                createParticles(ball.x, ball.y + ball.radius, ballColor);
                if (p.index > lastScorePlatformIndex) {
                    score += (1 * scoreMultiplier);
                    lastScorePlatformIndex = p.index;
                    let scoreElem = document.getElementById('score');
                    scoreElem.innerText = Math.floor(score);
                    scoreElem.style.transform = "scale(1.2)";
                    setTimeout(() => { scoreElem.style.transform = "scale(1)"; }, 100);
                }
            }
        });

        // --- GAME OVER ---
        if(ball.y > canvas.height) {
            gameActive = false;
            let currentScore = Math.floor(score);
            document.getElementById('score').style.display = 'none';
            document.getElementById('multiplier-tag').style.display = 'none';
            const titleElement = document.querySelector('.game-title');
            if (titleElement) titleElement.innerText = "SCORE: " + currentScore;
            saveScoreToGoogle(getPlayerName(), currentScore);
            let totalPoints = parseFloat(localStorage.getItem('vibeJump_totalPoints') || 0);
            localStorage.setItem('vibeJump_totalPoints', totalPoints + currentScore);
            let highscore = parseFloat(localStorage.getItem('vibeJump_highScore') || 0);
            if (currentScore > highscore) localStorage.setItem('vibeJump_highScore', currentScore);
            const settingsBtn = document.getElementById('settings-btn');
            if (settingsBtn) settingsBtn.style.display = 'block';
            setTimeout(() => { document.getElementById('start-screen').style.display = 'flex'; }, 300);
        }
    }

    // --- DISEGNO ELEMENTI ---
    platforms.forEach(p => {
        ctx.save();
        ctx.shadowBlur = p.glow > 0 ? 20 * p.glow : 10;
        ctx.shadowColor = p.glow > 0 ? ballColor : currentTheme.plat;
        ctx.fillStyle = p.glow > 0 ? ballColor : currentTheme.plat;
        ctx.fillRect(p.x, p.y, p.w, p.h);
        if(p.glow > 0) p.glow -= 0.05;
        ctx.restore();
    });

    particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.life--;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color + "77"; ctx.fill();
        if (p.life <= 0) particles.splice(i, 1);
    });

    ctx.beginPath();
    let s = 1 / ball.squash;
    ctx.ellipse(ball.x, ball.y + (ball.radius * (1 - ball.squash)), ball.radius * s, ball.radius * ball.squash, 0, 0, Math.PI * 2);
    ctx.fillStyle = ballColor; ctx.shadowBlur = 25; ctx.shadowColor = ballColor;
    ctx.fill();
    
    ctx.restore();
    requestAnimationFrame(draw);
}

// Chiamate iniziali
createPlatforms();
createBgParticles();
draw();