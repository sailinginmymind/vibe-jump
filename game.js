const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let score = 0;
let gameActive = false;
let controlMode = 'touch'; 
let keys = {}; 

let ball = {
    x: canvas.width / 2,
    y: canvas.height - 150,
    radius: 15,
    dy: 0,
    jumpForce: -14,
    gravity: 0.5
};

let platforms = [];

// --- GESTIONE CONTROLLI ---
function setControl(mode) {
    controlMode = mode;
    document.getElementById('btnTouch').classList.toggle('active', mode === 'touch');
    document.getElementById('btnTilt').classList.toggle('active', mode === 'tilt');
    
    if(mode === 'tilt' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission();
    }
}

// Supporto PC (Frecce)
window.addEventListener('keydown', (e) => { keys[e.code] = true; });
window.addEventListener('keyup', (e) => { keys[e.code] = false; });

// Supporto Mobile (Touch)
window.addEventListener('touchstart', (e) => {
    if(controlMode === 'touch') ball.x = e.touches[0].clientX;
});
window.addEventListener('touchmove', (e) => {
    if(controlMode === 'touch') ball.x = e.touches[0].clientX;
});

// Supporto Mobile (Inclinazione)
window.addEventListener('deviceorientation', (e) => {
    if(controlMode === 'tilt' && gameActive) {
        let tilt = e.gamma; 
        ball.x += tilt * 0.8; // Sensibilità aumentata per reattività
    }
});

let lastPlatformIndex = 0; // Tiene traccia dell'ultima piattaforma creata

function createPlatforms() {
    platforms = [];
    lastPlatformIndex = 0;
    
    // Piattaforma di partenza (Punto 0)
    platforms.push({ 
        x: canvas.width/2 - 50, 
        y: canvas.height - 50, 
        w: 100, 
        h: 15, 
        index: 0 
    });
    
    for(let i=1; i<7; i++) {
        lastPlatformIndex++;
        platforms.push({
            x: Math.random() * (canvas.width - 100),
            y: canvas.height - (i * 150),
            w: 100,
            h: 15,
            index: lastPlatformIndex
        });
    }
}

function startGame() {
    score = 0;
    document.getElementById('score').innerText = score;
    document.getElementById('start-screen').style.display = 'none';
    
    // Reset dei testi del menu
    document.getElementById('main-title').innerText = "VIBE JUMP";
    document.getElementById('final-message').style.display = 'none';
    
    ball.x = canvas.width / 2;
    ball.y = canvas.height - 100;
    ball.dy = ball.jumpForce; 
    createPlatforms();
    gameActive = true;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if(gameActive) {
        // Movimento PC
        if (keys['ArrowLeft']) ball.x -= 8;
        if (keys['ArrowRight']) ball.x += 8;

        ball.y += ball.dy;
        ball.dy += ball.gravity;

        // Effetto "Wrap" (Teletrasporto ai bordi)
        if(ball.x < 0) ball.x = canvas.width;
        if(ball.x > canvas.width) ball.x = 0;

       // 1. Scorrimento telecamera (NON aumenta più lo score qui)
        if(ball.y < canvas.height / 2) {
            let diff = canvas.height / 2 - ball.y;
            ball.y = canvas.height / 2;
            platforms.forEach(p => {
                p.y += diff;
                if(p.y > canvas.height) {
                    p.y = 0;
                    p.x = Math.random() * (canvas.width - 100);
                    // Assegniamo alla nuova piattaforma l'indice successivo
                    lastPlatformIndex++;
                    p.index = lastPlatformIndex;
                }
            });
        }

        // 2. Collisioni con piattaforme e AGGIORNAMENTO SCORE
        platforms.forEach(p => {
            if(ball.dy > 0 && 
               ball.x + 10 > p.x && ball.x - 10 < p.x + p.w &&
               ball.y + ball.radius > p.y && ball.y + ball.radius < p.y + p.h) {
                
                ball.dy = ball.jumpForce;

                // IL PUNTEGGIO DIVENTA L'INDICE DELLA PIATTAFORMA
                // Solo se la piattaforma è più in alto di quella attuale
                if (p.index > score) {
                    score = p.index;
                    document.getElementById('score').innerText = score;
                }
            }
        });

       // Game Over
        if(ball.y > canvas.height) {
            gameActive = false;
            
            // Personalizza il messaggio finale
            const msgElement = document.getElementById('final-message');
            const titleElement = document.getElementById('main-title');
            
            titleElement.innerText = "GAME OVER";
            msgElement.innerText = `Peccato! Hai fatto ${score} punti.`;
            msgElement.style.display = 'block';

            setTimeout(() => {
                document.getElementById('start-screen').style.display = 'flex';
            }, 300);
        }
    }

    // --- DISEGNO GRAFICO ---
    // Piattaforme Neon
    platforms.forEach(p => {
        ctx.fillStyle = "white";
        ctx.shadowBlur = 10;
        ctx.shadowColor = "white";
        ctx.fillRect(p.x, p.y, p.w, p.h);
    });

    // Pallina Neon
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#00ffcc";
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#00ffcc";
    ctx.fill();
    ctx.closePath();

    requestAnimationFrame(draw);
}

// Avvio
createPlatforms();
draw();