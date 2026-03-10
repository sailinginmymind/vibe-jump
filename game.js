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

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxfy0WfaSt_PWRr5TH84MJPyTulurfy3adZHLPeuEmtkjLS4yn_mWOXHKO0F9U49fpM/exec";

const themes = [
    { name: "Cyber City", ball: "#00ffcc", plat: "#ffffff", bg: "#0a0a0a" }, 
    { name: "Synth Wave", ball: "#ff00ff", plat: "#ff00ff", bg: "#1a001a" }, 
    { name: "Nuclear Zone", ball: "#ccff00", plat: "#ccff00", bg: "#0d1a00" }, 
    { name: "Deep Space", ball: "#0077ff", plat: "#ffffff", bg: "#00051a" }, 
    { name: "Mars Orbit", ball: "#ff3300", plat: "#ffcc00", bg: "#1a0500" }
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

// --- GESTIONE CONTROLLI ---
function setControl(mode) {
    controlMode = mode;
    const btnTouch = document.getElementById('btnTouch');
    const btnTilt = document.getElementById('btnTilt');
    
    btnTouch.classList.remove('active');
    btnTilt.classList.remove('active');
    btnTouch.style = ""; 
    btnTilt.style = "";

    const activeBtn = (mode === 'touch') ? btnTouch : btnTilt;
    activeBtn.classList.add('active');

    // Applica il colore del tema corrente al pulsante attivo
    let currentTheme = themes[(currentLevel - 1) % themes.length];
    activeBtn.style.backgroundColor = currentTheme.ball;
    activeBtn.style.boxShadow = `0 0 15px ${currentTheme.ball}`;
    activeBtn.style.borderColor = currentTheme.ball;

    if(mode === 'tilt' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission();
    }
}

// Event Listeners
window.addEventListener('keydown', (e) => { keys[e.code] = true; });
window.addEventListener('keyup', (e) => { keys[e.code] = false; });
window.addEventListener('touchstart', (e) => { if(controlMode === 'touch') ball.x = e.touches[0].clientX; });
window.addEventListener('touchmove', (e) => { if(controlMode === 'touch') ball.x = e.touches[0].clientX; });
window.addEventListener('deviceorientation', (e) => {
    if(controlMode === 'tilt' && gameActive) ball.x += e.gamma * 0.8;
});

// --- FUNZIONI DI SUPPORTO ---
function createParticles(x, y, color) {
    let numParticles = 8;
    for (let i = 0; i < numParticles; i++) {
        particles.push({
            x: x, y: y,
            radius: Math.random() * 3 + 1,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() * -5) - 2,
            life: 30,
            color: color
        });
    }
}

function createPlatforms() {
    platforms = [];
    lastPlatformIndex = 0;
    platforms.push({ x: canvas.width/2 - 50, y: canvas.height - 50, w: 100, h: 15, index: 0, speed: 0, glow: 0 });
    for(let i=1; i<7; i++) {
        lastPlatformIndex++;
        platforms.push({
            x: Math.random() * (canvas.width - 100),
            y: canvas.height - (i * 150),
            w: 100, h: 15, index: lastPlatformIndex, speed: 0, glow: 0
        });
    }
}

function startGame() {
    score = 0;
    currentLevel = 1;
    particles = [];
    ballColor = themes[0].ball;
    document.body.style.backgroundColor = themes[0].bg;
    ball.gravity = 0.5;
    ball.dy = ball.jumpForce;
    ball.x = canvas.width / 2;
    ball.y = canvas.height - 100;
    ball.squash = 1;
    
    // Il numero in alto resta bianco
    const scoreElement = document.getElementById('score');
    scoreElement.innerText = score;
    scoreElement.style.color = "#ffffff"; 

    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('main-title').innerText = "VIBE JUMP";
    document.getElementById('final-message').style.display = 'none';
    createPlatforms();
    gameActive = true;
}

async function saveScoreToGoogle(name, score) {
    try {
        await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            cache: 'no-cache',
            body: JSON.stringify({ name: name, score: score })
        });
        setTimeout(loadLeaderboardFromGoogle, 1000);
    } catch (error) { console.error("Errore invio:", error); }
}

async function loadLeaderboardFromGoogle() {
    try {
        const response = await fetch(SCRIPT_URL);
        const data = await response.json();
        const list = document.getElementById('highscores-list');
        if(list) {
            list.innerHTML = data.map(row => `<li>${row[0]}: ${row[1]} pts</li>`).join('');
        }
    } catch (error) { console.error("Errore caricamento:", error); }
}

function getPlayerName() {
    let savedName = localStorage.getItem('vibeJump_playerName');
    if (!savedName) {
        savedName = prompt("BENVENUTO! Inserisci il tuo nome:", "Player1");
        if (savedName) {
            savedName = savedName.substring(0, 10);
            localStorage.setItem('vibeJump_playerName', savedName);
        } else { savedName = "Player1"; }
    }
    return savedName;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if(gameActive) {
        if (keys['ArrowLeft']) ball.x -= 8;
        if (keys['ArrowRight']) ball.x += 8;

        let newLevel = Math.floor(score / 20) + 1;
        if (newLevel !== currentLevel) {
            currentLevel = newLevel;
            let currentTheme = themes[(currentLevel - 1) % themes.length];
            ballColor = currentTheme.ball;
            document.body.style.backgroundColor = currentTheme.bg;
            ball.gravity = 0.5 + (currentLevel * 0.02);
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
                    p.y = 0;
                    p.x = Math.random() * (canvas.width - 100);
                    lastPlatformIndex++;
                    p.index = lastPlatformIndex;
                    p.glow = 0;
                    p.speed = (currentLevel >= 2) ? (Math.random() - 0.5) * (currentLevel * 1.2) : 0;
                }
            });
        }

        platforms.forEach(p => {
            if(p.speed) {
                p.x += p.speed;
                if(p.x < 0 || p.x > canvas.width - p.w) p.speed *= -1;
            }
            if(ball.dy > 0 && 
               ball.x + 10 > p.x && ball.x - 10 < p.x + p.w &&
               ball.y + ball.radius > p.y && ball.y + ball.radius < p.y + p.h) {
                ball.dy = ball.jumpForce;
                ball.squash = 0.5;
                p.glow = 1.0; 
                createParticles(ball.x, ball.y + ball.radius, ballColor);
                if (p.index > score) {
                    score = p.index;
                    document.getElementById('score').innerText = score;
                }
            }
        });

       if(ball.y > canvas.height) {
    gameActive = false;
    let playerName = getPlayerName();
    if (score > 0) saveScoreToGoogle(playerName, score);

    let currentTheme = themes[(currentLevel - 1) % themes.length];
    let levelColor = currentTheme.ball; 
    
    // Aggiornamento Titolo Leaderboard
    const lbTitle = document.querySelector('#leaderboard h3');
    if(lbTitle) {
        lbTitle.innerText = "TOP 5 JUMPERS";
        // Cambia SOLO il colore, il font è già gestito dal CSS
        lbTitle.style.color = levelColor; 
        lbTitle.style.textShadow = `0 0 10px ${levelColor}44`;
    }

    // Aggiornamento Tasto Gioca Ora
    const btnStart = document.getElementById('btnStart');
    if(btnStart) {
        btnStart.style.borderColor = levelColor;
        btnStart.style.color = levelColor;
    }

    // Mostra la schermata finale
    setTimeout(() => { 
        document.getElementById('start-screen').style.display = 'flex'; 
    }, 300);
}
    }

    // --- DISEGNO ---
    let themeIdx = (currentLevel - 1) % themes.length;
    let activeTheme = themes[themeIdx];

    platforms.forEach(p => {
        if (p.glow > 0) {
            ctx.shadowBlur = 20 * p.glow;
            ctx.shadowColor = ballColor;
            ctx.fillStyle = ballColor; 
            p.glow -= 0.05; 
        } else {
            ctx.shadowBlur = 10;
            ctx.shadowColor = activeTheme.plat;
            ctx.fillStyle = activeTheme.plat;
        }
        ctx.fillRect(p.x, p.y, p.w, p.h);
    });

    ctx.shadowBlur = 0;
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.life--;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color + "77"; 
        ctx.fill();
        if (p.life <= 0) particles.splice(i, 1);
    }

    ctx.beginPath();
    let stretch = 1 / ball.squash;
    ctx.ellipse(ball.x, ball.y + (ball.radius * (1 - ball.squash)), ball.radius * stretch, ball.radius * ball.squash, 0, 0, Math.PI * 2);
    ctx.fillStyle = ballColor;
    ctx.shadowBlur = 25; ctx.shadowColor = ballColor;
    ctx.fill();
    ctx.closePath();

    requestAnimationFrame(draw);
}

// Avvio
loadLeaderboardFromGoogle();
async function loadLeaderboardFromGoogle() {
    try {
        const response = await fetch(SCRIPT_URL);
        const data = await response.json();
        const list = document.getElementById('highscores-list');
        if(list) {
            // Prendiamo i primi 5 e usiamo le classi name-val e score-val
            list.innerHTML = data.slice(0, 5).map(row => `
                <li>
                    <span class="name-val">${row[0]}</span>
                    <span class="score-val">${row[1]}</span>
                </li>
            `).join('');
        }
    } catch (error) { 
        console.error("Errore:", error); 
    }
}
createPlatforms();
draw();