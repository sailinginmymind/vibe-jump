const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let score = 0;
let gameActive = false;
let controlMode = 'touch'; // 'touch' o 'tilt'

let ball = {
    x: canvas.width / 2,
    y: canvas.height - 150,
    radius: 15,
    dy: 0,
    jumpForce: -14,
    gravity: 0.5
};

let platforms = [];

// Funzione per scegliere il tipo di controllo
function setControl(mode) {
    controlMode = mode;
    document.getElementById('btnTouch').classList.toggle('active', mode === 'touch');
    document.getElementById('btnTilt').classList.toggle('active', mode === 'tilt');
    
    if(mode === 'tilt' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission(); // Richiesto su iOS
    }
}

function createPlatforms() {
    platforms = [];
    // Una piattaforma fissa sotto la pallina all'inizio
    platforms.push({ x: canvas.width/2 - 50, y: canvas.height - 50, w: 100, h: 15 });
    
    for(let i=1; i<7; i++) {
        platforms.push({
            x: Math.random() * (canvas.width - 100),
            y: canvas.height - (i * 150),
            w: 100,
            h: 15
        });
    }
}

function startGame() {
    score = 0;
    document.getElementById('score').innerText = score;
    document.getElementById('start-screen').style.display = 'none';
    
    ball.y = canvas.height - 100;
    ball.dy = ball.jumpForce; // Salto automatico iniziale
    createPlatforms();
    gameActive = true;
}

// GESTIONE MOVIMENTO
window.addEventListener('touchstart', (e) => {
    if(controlMode === 'touch') {
        ball.x = e.touches[0].clientX;
    }
});

window.addEventListener('touchmove', (e) => {
    if(controlMode === 'touch') {
        ball.x = e.touches[0].clientX;
    }
});

// Accelerometro (Inclinazione)
window.addEventListener('deviceorientation', (e) => {
    if(controlMode === 'tilt' && gameActive) {
        // gamma è l'inclinazione sinistra/destra (-90 a 90)
        let tilt = e.gamma; 
        ball.x += tilt * 0.5; // Regola sensibilità
    }
});

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if(gameActive) {
        ball.y += ball.dy;
        ball.dy += ball.gravity;

        // Limiti bordi laterali
        if(ball.x < 0) ball.x = canvas.width;
        if(ball.x > canvas.width) ball.x = 0;

        // Scorrimento telecamera
        if(ball.y < canvas.height / 2) {
            let diff = canvas.height / 2 - ball.y;
            ball.y = canvas.height / 2;
            platforms.forEach(p => {
                p.y += diff;
                if(p.y > canvas.height) {
                    p.y = 0;
                    p.x = Math.random() * (canvas.width - 100);
                    score++;
                    document.getElementById('score').innerText = score;
                }
            });
        }

        // Collisioni
        platforms.forEach(p => {
            if(ball.dy > 0 && 
               ball.x + ball.radius > p.x && ball.x - ball.radius < p.x + p.w &&
               ball.y + ball.radius > p.y && ball.y + ball.radius < p.y + p.h) {
                ball.dy = ball.jumpForce;
            }
        });

        // Game Over
        if(ball.y > canvas.height) {
            gameActive = false;
            document.getElementById('start-screen').style.display = 'flex';
        }
    }

    // Disegno Grafico
    platforms.forEach(p => {
        ctx.fillStyle = "white";
        ctx.shadowBlur = 10;
        ctx.shadowColor = "white";
        ctx.fillRect(p.x, p.y, p.w, p.h);
    });

    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#00ffcc";
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#00ffcc";
    ctx.fill();
    ctx.closePath();

    requestAnimationFrame(draw);
}

createPlatforms();
draw();