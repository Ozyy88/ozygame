const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const healthFill = document.getElementById('healthFill');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreElement = document.getElementById('finalScore');
const restartBtn = document.getElementById('restartBtn');
const boosterNotice = document.getElementById('boosterNotice');
const boosterMessage = document.getElementById('boosterMessage');
const starsContainer = document.getElementById('stars');



for (let i = 0; i < 150; i++) {
    const star = document.createElement('div');
    star.classList.add('star');
    const size = Math.random() * 3;
    star.style.width = `${size}px`;
    star.style.height = `${size}px`;
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
    star.style.opacity = Math.random() * 0.8 + 0.2;
    starsContainer.appendChild(star);
}

let score = 0;
let level = 1;
let health = 100;
let gameOver = false;
let isShooting = false;
let lastShotTime = 0;
let shotDelay = 200;
let enemySpawnDelay = 1500;
let lastEnemySpawn = 0;
let boosterActive = false;
let boosterType = '';
let boosterEndTime = 0;
let playerSpeed = 5;


const player = {
    x: canvas.width / 2,
    y: canvas.height - 100,
    width: 40,
    height: 60,
    color: '#3a3aff',
    speed: playerSpeed
};


let bullets = [];
let enemies = [];
let boosters = [];
let particles = [];

const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    space: false
};


window.addEventListener('keydown', (e) => {
    if (e.key === 'w' || e.key === 'W') keys.w = true;
    if (e.key === 'a' || e.key === 'A') keys.a = true;
    if (e.key === 's' || e.key === 'S') keys.s = true;
    if (e.key === 'd' || e.key === 'D') keys.d = true;
    if (e.key === ' ') {
        keys.space = true;
        e.preventDefault(); 
    }
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'w' || e.key === 'W') keys.w = false;
    if (e.key === 'a' || e.key === 'A') keys.a = false;
    if (e.key === 's' || e.key === 'S') keys.s = false;
    if (e.key === 'd' || e.key === 'D') keys.d = false;
    if (e.key === ' ') {
        keys.space = false;
        e.preventDefault();
    }
});


function drawPlayer() {

    ctx.fillStyle = player.color;
    ctx.fillRect(player.x - player.width/2, player.y - player.height/2, player.width, player.height);
    ctx.fillStyle = '#5a5aff';
    ctx.beginPath();
    ctx.arc(player.x, player.y - 10, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2a2aff';
    ctx.fillRect(player.x - 35, player.y + 5, 70, 10);
    ctx.fillStyle = '#ff9900';
    ctx.fillRect(player.x - 15, player.y + 20, 10, 15);
    ctx.fillRect(player.x + 5, player.y + 20, 10, 15);

    if (keys.w || keys.a || keys.s || keys.d) {
        ctx.fillStyle = '#ff6600';
        ctx.fillRect(player.x - 15, player.y + 35, 10, 10);
        ctx.fillRect(player.x + 5, player.y + 35, 10, 10);
    }
}


function shoot() {
    const currentTime = Date.now();
    if (currentTime - lastShotTime > shotDelay) {
        bullets.push({
            x: player.x,
            y: player.y - player.height/2,
            width: 5,
            height: 15,
            color: '#ffff00',
            speed: 10
        });
        lastShotTime = currentTime;
    }
}

function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        
        ctx.fillStyle = bullet.color;
        ctx.fillRect(bullet.x - bullet.width/2, bullet.y, bullet.width, bullet.height);
        
        bullet.y -= bullet.speed;
        
        if (bullet.y < 0) {
            bullets.splice(i, 1);
        }
    }
}

function spawnEnemy() {
    const currentTime = Date.now();
    if (currentTime - lastEnemySpawn > enemySpawnDelay) {
        const enemyType = Math.random() > 0.7 ? 'fast' : 'normal';
        let enemySpeed, enemyColor, enemyWidth, enemyHeight;
        
        if (enemyType === 'fast') {
            enemySpeed = 2 + level * 0.2;
            enemyColor = '#ff3a3a';
            enemyWidth = 35;
            enemyHeight = 35;
        } else {
            enemySpeed = 1 + level * 0.1;
            enemyColor = '#ff6b6b';
            enemyWidth = 40;
            enemyHeight = 50;
        }
        
        enemies.push({
            x: Math.random() * (canvas.width - 60) + 30,
            y: -50,
            width: enemyWidth,
            height: enemyHeight,
            color: enemyColor,
            speed: enemySpeed,
            type: enemyType
        });
        
        lastEnemySpawn = currentTime;
    }
}

function updateEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x - enemy.width/2, enemy.y - enemy.height/2, enemy.width, enemy.height);
        ctx.fillStyle = '#ff8e8e';
        ctx.fillRect(enemy.x - enemy.width/4, enemy.y - enemy.height/4, enemy.width/2, enemy.height/4);
        
        enemy.y += enemy.speed;
        
        if (
            player.x - player.width/2 < enemy.x + enemy.width/2 &&
            player.x + player.width/2 > enemy.x - enemy.width/2 &&
            player.y - player.height/2 < enemy.y + enemy.height/2 &&
            player.y + player.height/2 > enemy.y - enemy.height/2
        ) {
        
            health -= 10;
            healthFill.style.width = `${health}%`;
            
    
            createParticles(enemy.x, enemy.y, enemy.color);
            

            enemies.splice(i, 1);
            
            if (health <= 0) {
                health = 0;
                gameOver = true;
                gameOverScreen.style.display = 'flex';
                finalScoreElement.textContent = score;
            }
            
            continue;
        }
        
    
        if (enemy.y > canvas.height + 50) {
            enemies.splice(i, 1);
        }
    }
}


function spawnBooster() {
    
    if (Math.random() < 0.05 && !boosterActive) {
        const boosterTypes = ['health', 'speed', 'rapidfire'];
        const type = boosterTypes[Math.floor(Math.random() * boosterTypes.length)];
        let color, message;
        
        switch(type) {
            case 'health':
                color = '#2ecc71';
                message = 'Kesehatan +30%';
                break;
            case 'speed':
                color = '#3498db';
                message = 'Kecepatan +50%';
                break;
            case 'rapidfire':
                color = '#9b59b6';
                message = 'Tembakan 2x lebih cepat';
                break;
        }
        
        boosters.push({
            x: Math.random() * (canvas.width - 40) + 20,
            y: -30,
            width: 30,
            height: 30,
            color: color,
            speed: 2,
            type: type,
            message: message
        });
    }
}


function updateBoosters() {
    for (let i = boosters.length - 1; i >= 0; i--) {
        const booster = boosters[i];
        
       
        ctx.fillStyle = booster.color;
        ctx.beginPath();
        ctx.arc(booster.x, booster.y, booster.width/2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(booster.x - 2, booster.y - 10, 4, 6);
        ctx.fillRect(booster.x - 2, booster.y + 4, 4, 6);
        ctx.fillRect(booster.x - 10, booster.y - 2, 6, 4);
        ctx.fillRect(booster.x + 4, booster.y - 2, 6, 4);
        

        booster.y += booster.speed;
        
       
        if (
            player.x - player.width/2 < booster.x + booster.width/2 &&
            player.x + player.width/2 > booster.x - booster.width/2 &&
            player.y - player.height/2 < booster.y + booster.height/2 &&
            player.y + player.height/2 > booster.y - booster.height/2
        ) {
           
            activateBooster(booster.type, booster.message);
            
           
            boosters.splice(i, 1);
            
            continue;
        }
        
        if (booster.y > canvas.height + 50) {
            boosters.splice(i, 1);
        }
    }
    
    if (boosterActive && Date.now() > boosterEndTime) {
        deactivateBooster();
    }
}

function activateBooster(type, message) {
    boosterActive = true;
    boosterType = type;
    boosterEndTime = Date.now() + 10000;
    
    switch(type) {
        case 'health':
            health = Math.min(100, health + 30);
            healthFill.style.width = `${health}%`;
            break;
        case 'speed':
            player.speed = playerSpeed * 1.5;
            break;
        case 'rapidfire':
            shotDelay = 100; 
            break;
    }
    
  
    boosterMessage.textContent = message;
    boosterNotice.classList.add('active');
    
    
    setTimeout(() => {
        boosterNotice.classList.remove('active');
    }, 3000);
}


function deactivateBooster() {
    boosterActive = false;
    
    
    switch(boosterType) {
        case 'speed':
            player.speed = playerSpeed;
            break;
        case 'rapidfire':
            shotDelay = 200;
            break;
    }
    
    boosterType = '';
}


function createParticles(x, y, color) {
    for (let i = 0; i < 10; i++) {
        particles.push({
            x: x,
            y: y,
            size: Math.random() * 5 + 2,
            color: color,
            speedX: Math.random() * 6 - 3,
            speedY: Math.random() * 6 - 3,
            life: 30
        });
    }
}


function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        
       
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.life / 30;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        particle.life--;
        
        if (particle.life <= 0) {
            particles.splice(i, 1);
        }
    }
    ctx.globalAlpha = 1.0;
}

function checkCollisions() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            
            if (
                bullet.x - bullet.width/2 < enemy.x + enemy.width/2 &&
                bullet.x + bullet.width/2 > enemy.x - enemy.width/2 &&
                bullet.y < enemy.y + enemy.height/2 &&
                bullet.y + bullet.height > enemy.y - enemy.height/2
            ) {
                score += enemy.type === 'fast' ? 20 : 10;
                scoreElement.textContent = score;
                
                createParticles(enemy.x, enemy.y, enemy.color);
                
                bullets.splice(i, 1);
                enemies.splice(j, 1);
                
                spawnBooster();
                
                const newLevel = Math.floor(score / 100) + 1;
                if (newLevel > level) {
                    level = newLevel;
                    levelElement.textContent = level;
                    
                    enemySpawnDelay = Math.max(500, 1500 - level * 100);
                }
                
                break;
            }
        }
    }
}

function updatePlayer() {
    if (keys.w && player.y - player.height/2 > 0) player.y -= player.speed;
    if (keys.s && player.y + player.height/2 < canvas.height) player.y += player.speed;
    if (keys.a && player.x - player.width/2 > 0) player.x -= player.speed;
    if (keys.d && player.x + player.width/2 < canvas.width) player.x += player.speed;
    
    if (keys.space) {
        shoot();
    }
}

function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#0a0a2a");
    gradient.addColorStop(1, "#000010");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = "white";
    for (let i = 0; i < 50; i++) {
        const x = (i * 97) % canvas.width;
        const y = (i * 73) % canvas.height;
        const size = Math.sin(Date.now() / 1000 + i) * 0.5 + 1;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.fillStyle = "rgba(100, 100, 200, 0.2)";
    ctx.beginPath();
    ctx.arc(150, 100, 60, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = "rgba(200, 100, 100, 0.15)";
    ctx.beginPath();
    ctx.arc(canvas.width - 200, 150, 80, 0, Math.PI * 2);
    ctx.fill();
}

let gameLoopId = null;
let gameRunning = false;

function gameLoop() {
    if (gameOver) {
        gameRunning = false;
        return;
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawBackground();
    
    updatePlayer();
    updateBullets();
    spawnEnemy();
    updateEnemies();
    updateBoosters();
    updateParticles();
    checkCollisions();
    drawPlayer();
    
    
    gameLoopId = requestAnimationFrame(gameLoop);
}

function startGameLoop() {
    if (!gameRunning) {
        gameRunning = true;
        gameLoop();
    }
}

function restartGame() {
    if (gameLoopId !== null) {
        cancelAnimationFrame(gameLoopId);
        gameLoopId = null;
    }
    
    score = 0;
    level = 1;
    health = 100;
    gameOver = false;
    boosterActive = false;
    gameRunning = false;
    
    player.x = canvas.width / 2;
    player.y = canvas.height - 100;
    player.speed = playerSpeed;
    
    bullets = [];
    enemies = [];
    boosters = [];
    particles = [];
    
    scoreElement.textContent = score;
    levelElement.textContent = level;
    healthFill.style.width = `${health}%`;
    
    gameOverScreen.style.display = 'none';
    
    boosterNotice.classList.remove('active');
    
    deactivateBooster();
    
    setTimeout(startGameLoop, 100);
}

restartBtn.onclick = restartGame;


startGameLoop();
