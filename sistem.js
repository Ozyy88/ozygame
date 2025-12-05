// Inisialisasi canvas
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

// Buat latar bintang
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

// Variabel game
let score = 0;
let level = 1;
let health = 100;
let gameOver = false;
let isShooting = false;
let lastShotTime = 0;
let shotDelay = 200; // ms
let enemySpawnDelay = 1500; // ms
let lastEnemySpawn = 0;
let boosterActive = false;
let boosterType = '';
let boosterEndTime = 0;
let playerSpeed = 5;

// Pemain
const player = {
    x: canvas.width / 2,
    y: canvas.height - 100,
    width: 40,
    height: 60,
    color: '#3a3aff',
    speed: playerSpeed
};

// Array untuk peluru, musuh, dan booster
let bullets = [];
let enemies = [];
let boosters = [];
let particles = [];

// Input kontrol
const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    space: false
};

// Event listener untuk keyboard - PERBAIKAN: cegah default behavior untuk spasi
window.addEventListener('keydown', (e) => {
    if (e.key === 'w' || e.key === 'W') keys.w = true;
    if (e.key === 'a' || e.key === 'A') keys.a = true;
    if (e.key === 's' || e.key === 'S') keys.s = true;
    if (e.key === 'd' || e.key === 'D') keys.d = true;
    if (e.key === ' ') {
        keys.space = true;
        e.preventDefault(); // Mencegah scroll halaman saat menekan spasi
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

// Fungsi untuk menggambar pemain
function drawPlayer() {
    // Badan pesawat
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x - player.width/2, player.y - player.height/2, player.width, player.height);
    
    // Kokpit
    ctx.fillStyle = '#5a5aff';
    ctx.beginPath();
    ctx.arc(player.x, player.y - 10, 12, 0, Math.PI * 2);
    ctx.fill();
    
    // Sayap
    ctx.fillStyle = '#2a2aff';
    ctx.fillRect(player.x - 35, player.y + 5, 70, 10);
    
    // Mesin
    ctx.fillStyle = '#ff9900';
    ctx.fillRect(player.x - 15, player.y + 20, 10, 15);
    ctx.fillRect(player.x + 5, player.y + 20, 10, 15);
    
    // Efek mesin jika bergerak
    if (keys.w || keys.a || keys.s || keys.d) {
        ctx.fillStyle = '#ff6600';
        ctx.fillRect(player.x - 15, player.y + 35, 10, 10);
        ctx.fillRect(player.x + 5, player.y + 35, 10, 10);
    }
}

// Fungsi untuk membuat peluru
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

// Fungsi untuk menggambar dan menggerakkan peluru
function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        
        // Gambar peluru
        ctx.fillStyle = bullet.color;
        ctx.fillRect(bullet.x - bullet.width/2, bullet.y, bullet.width, bullet.height);
        
        // Gerakkan peluru
        bullet.y -= bullet.speed;
        
        // Hapus peluru jika keluar layar
        if (bullet.y < 0) {
            bullets.splice(i, 1);
        }
    }
}

// Fungsi untuk membuat musuh
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

// Fungsi untuk menggambar dan menggerakkan musuh
function updateEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        
        // Gambar musuh
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x - enemy.width/2, enemy.y - enemy.height/2, enemy.width, enemy.height);
        
        // Gambar detail musuh
        ctx.fillStyle = '#ff8e8e';
        ctx.fillRect(enemy.x - enemy.width/4, enemy.y - enemy.height/4, enemy.width/2, enemy.height/4);
        
        // Gerakkan musuh
        enemy.y += enemy.speed;
        
        // Cek tabrakan dengan pemain
        if (
            player.x - player.width/2 < enemy.x + enemy.width/2 &&
            player.x + player.width/2 > enemy.x - enemy.width/2 &&
            player.y - player.height/2 < enemy.y + enemy.height/2 &&
            player.y + player.height/2 > enemy.y - enemy.height/2
        ) {
            // Kurangi kesehatan
            health -= 10;
            healthFill.style.width = `${health}%`;
            
            // Buat efek partikel
            createParticles(enemy.x, enemy.y, enemy.color);
            
            // Hapus musuh
            enemies.splice(i, 1);
            
            // Cek game over
            if (health <= 0) {
                health = 0;
                gameOver = true;
                gameOverScreen.style.display = 'flex';
                finalScoreElement.textContent = score;
            }
            
            continue;
        }
        
        // Hapus musuh jika keluar layar
        if (enemy.y > canvas.height + 50) {
            enemies.splice(i, 1);
        }
    }
}

// Fungsi untuk membuat booster
function spawnBooster() {
    // 5% kemungkinan membuat booster saat musuh mati
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

// Fungsi untuk menggambar dan menggerakkan booster
function updateBoosters() {
    for (let i = boosters.length - 1; i >= 0; i--) {
        const booster = boosters[i];
        
        // Gambar booster
        ctx.fillStyle = booster.color;
        ctx.beginPath();
        ctx.arc(booster.x, booster.y, booster.width/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Gambar efek bintang
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(booster.x - 2, booster.y - 10, 4, 6);
        ctx.fillRect(booster.x - 2, booster.y + 4, 4, 6);
        ctx.fillRect(booster.x - 10, booster.y - 2, 6, 4);
        ctx.fillRect(booster.x + 4, booster.y - 2, 6, 4);
        
        // Gerakkan booster
        booster.y += booster.speed;
        
        // Cek tabrakan dengan pemain
        if (
            player.x - player.width/2 < booster.x + booster.width/2 &&
            player.x + player.width/2 > booster.x - booster.width/2 &&
            player.y - player.height/2 < booster.y + booster.height/2 &&
            player.y + player.height/2 > booster.y - booster.height/2
        ) {
            // Aktifkan booster
            activateBooster(booster.type, booster.message);
            
            // Hapus booster
            boosters.splice(i, 1);
            
            continue;
        }
        
        // Hapus booster jika keluar layar
        if (booster.y > canvas.height + 50) {
            boosters.splice(i, 1);
        }
    }
    
    // Periksa apakah booster masih aktif
    if (boosterActive && Date.now() > boosterEndTime) {
        deactivateBooster();
    }
}

// Fungsi untuk mengaktifkan booster
function activateBooster(type, message) {
    boosterActive = true;
    boosterType = type;
    boosterEndTime = Date.now() + 10000; // 10 detik
    
    // Terapkan efek booster
    switch(type) {
        case 'health':
            health = Math.min(100, health + 30);
            healthFill.style.width = `${health}%`;
            break;
        case 'speed':
            player.speed = playerSpeed * 1.5;
            break;
        case 'rapidfire':
            shotDelay = 100; // Setengah dari delay normal
            break;
    }
    
    // Tampilkan notifikasi
    boosterMessage.textContent = message;
    boosterNotice.classList.add('active');
    
    // Sembunyikan notifikasi setelah 3 detik
    setTimeout(() => {
        boosterNotice.classList.remove('active');
    }, 3000);
}

// Fungsi untuk menonaktifkan booster
function deactivateBooster() {
    boosterActive = false;
    
    // Kembalikan ke pengaturan normal
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

// Fungsi untuk membuat partikel efek
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

// Fungsi untuk menggambar dan menggerakkan partikel
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        
        // Gambar partikel
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.life / 30;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Gerakkan partikel
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        particle.life--;
        
        // Hapus partikel jika sudah habis umurnya
        if (particle.life <= 0) {
            particles.splice(i, 1);
        }
    }
    ctx.globalAlpha = 1.0;
}

// Fungsi untuk mendeteksi tabrakan peluru dengan musuh
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
                // Tambah skor
                score += enemy.type === 'fast' ? 20 : 10;
                scoreElement.textContent = score;
                
                // Buat partikel ledakan
                createParticles(enemy.x, enemy.y, enemy.color);
                
                // Hapus peluru dan musuh
                bullets.splice(i, 1);
                enemies.splice(j, 1);
                
                // Cek apakah perlu spawn booster
                spawnBooster();
                
                // Tingkatkan level setiap 100 poin
                const newLevel = Math.floor(score / 100) + 1;
                if (newLevel > level) {
                    level = newLevel;
                    levelElement.textContent = level;
                    
                    // Tingkatkan kesulitan
                    enemySpawnDelay = Math.max(500, 1500 - level * 100);
                }
                
                break;
            }
        }
    }
}

// Fungsi untuk mengupdate posisi pemain berdasarkan input
function updatePlayer() {
    if (keys.w && player.y - player.height/2 > 0) player.y -= player.speed;
    if (keys.s && player.y + player.height/2 < canvas.height) player.y += player.speed;
    if (keys.a && player.x - player.width/2 > 0) player.x -= player.speed;
    if (keys.d && player.x + player.width/2 < canvas.width) player.x += player.speed;
    
    if (keys.space) {
        shoot();
    }
}

// Fungsi untuk menggambar latar belakang
function drawBackground() {
    // Latar belakang gradasi
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#0a0a2a");
    gradient.addColorStop(1, "#000010");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Gambar beberapa bintang besar
    ctx.fillStyle = "white";
    for (let i = 0; i < 50; i++) {
        const x = (i * 97) % canvas.width;
        const y = (i * 73) % canvas.height;
        const size = Math.sin(Date.now() / 1000 + i) * 0.5 + 1;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Gambar planet di kejauhan
    ctx.fillStyle = "rgba(100, 100, 200, 0.2)";
    ctx.beginPath();
    ctx.arc(150, 100, 60, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = "rgba(200, 100, 100, 0.15)";
    ctx.beginPath();
    ctx.arc(canvas.width - 200, 150, 80, 0, Math.PI * 2);
    ctx.fill();
}

// Variabel untuk mengontrol game loop - PERBAIKAN: mencegah multiple game loop
let gameLoopId = null;
let gameRunning = false;

// Fungsi utama game loop
function gameLoop() {
    if (gameOver) {
        gameRunning = false;
        return;
    }
    
    // Bersihkan canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Gambar latar belakang
    drawBackground();
    
    // Update dan gambar semua elemen
    updatePlayer();
    updateBullets();
    spawnEnemy();
    updateEnemies();
    updateBoosters();
    updateParticles();
    checkCollisions();
    drawPlayer();
    
    // NOTE: UI is rendered in DOM (HTML) so canvas-side UI drawing removed
    
    // Request frame berikutnya
    gameLoopId = requestAnimationFrame(gameLoop);
}

// Fungsi untuk memulai game loop - PERBAIKAN: hanya mulai jika belum berjalan
function startGameLoop() {
    if (!gameRunning) {
        gameRunning = true;
        gameLoop();
    }
}

// Fungsi untuk restart game
function restartGame() {
    // Batalkan game loop yang sedang berjalan
    if (gameLoopId !== null) {
        cancelAnimationFrame(gameLoopId);
        gameLoopId = null;
    }
    
    // Reset semua variabel
    score = 0;
    level = 1;
    health = 100;
    gameOver = false;
    boosterActive = false;
    gameRunning = false;
    
    // Reset pemain
    player.x = canvas.width / 2;
    player.y = canvas.height - 100;
    player.speed = playerSpeed;
    
    // Kosongkan array
    bullets = [];
    enemies = [];
    boosters = [];
    particles = [];
    
    // Reset UI
    scoreElement.textContent = score;
    levelElement.textContent = level;
    healthFill.style.width = `${health}%`;
    
    // Sembunyikan layar game over
    gameOverScreen.style.display = 'none';
    
    // Hapus notifikasi booster jika ada
    boosterNotice.classList.remove('active');
    
    // Reset pengaturan booster
    deactivateBooster();
    
    // Mulai game loop baru
    setTimeout(startGameLoop, 100);
}

// Event listener untuk tombol restart - PERBAIKAN: pastikan hanya ada satu event listener
restartBtn.onclick = restartGame;

// Mulai game
startGameLoop();