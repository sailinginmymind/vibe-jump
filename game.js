const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let score = 0;
let gameActive = false;

// Configurazione Pallina
let ball = {
    x: canvas.width / 2,
    y: canvas.height - 100,
    radius: 15,
    dy: 0,
    jumpForce: -12,
    gravity: 0.6
};

// Configurazione Piattaforme
let platforms = [];
function createPlatform(y) {
    platforms.push({
        x: Math.random() * (canvas.width - 100),
        y: y,
        w: 100,
        h: 15
    });
}

// Inizializzazione
for(let i=0; i<6; i++) createPlatform(i * 150);

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Disegna Pallina con scia neon
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#00ffcc";
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#00ffcc";
    ctx.fill();
    ctx.closePath();

    // Logica Salto e Gravità
    if(gameActive) {
        ball.y += ball.dy;
        ball.dy += ball.gravity;

        // Movimento piattaforme (illusione di salita)
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
    }

    // Disegna Piattaforme
    platforms.forEach(p => {
        ctx.fillStyle = "#fff";
        ctx.fillRect(p.x, p.y, p.w, p.h);
        
        // Collisione (solo se scende)
        if(ball.dy > 0 && 
           ball.x > p.x && ball.x < p.x + p.w &&
           ball.y + ball.radius > p.y && ball.y + ball.radius < p.y + p.h) {
            ball.dy = ball.jumpForce;
        }
    });

    // Game Over
    if(ball.y > canvas.height) {
        gameActive = false;
        location.reload(); // Semplice reset
    }

    requestAnimationFrame(draw);
}

function startGame() {
    document.getElementById('start-screen').style.display = 'none';
    gameActive = true;
}

// Controllo tocco
window.addEventListener('touchstart', (e) => {
    // Qui puoi gestire il movimento orizzontale con l'inclinazione o il tocco
    ball.x = e.touches[0].clientX;
});

draw();