// Danh sách game Việt Nam
const games = [
    { name: "🇻🇳 Flappy Bird VN", id: "flappy", desc: "Game kinh điển của Nguyễn Hà Đông" },
    { name: "🇻🇳 Ô Ăn Quan", id: "oanquan", desc: "Trò chơi dân gian Việt Nam" },
    { name: "🇻🇳 Pikachu", id: "pikachu", desc: "Nối Pikachu cổ điển" },
    { name: "🇻🇳 Bắn Vịt", id: "shootduck", desc: "Bắn vịt vui nhộn" },
    { name: "🇻🇳 2048 Việt Nam", id: "2048vn", desc: "Ghép số phong cách VN" },
    { name: "🇻🇳 Bầu Cua Tôm Cá", id: "baucua", desc: "Xúc xắc may rủi" },
    // Thêm nếu cần
];

// Phaser vars
let game = null;
let currentGameId = null;
let currentScore = 0;

// Âm thanh
const clickSound = document.getElementById('click-sound');
const successSound = document.getElementById('success-sound');
const gameOverSound = document.getElementById('game-over-sound');
const bgMusic = document.getElementById('background-music');

bgMusic.volume = 0.3;
bgMusic.play().catch(() => {});

// Đồng hồ realtime Việt Nam
function updateClock() {
    const now = new Date();
    const options = { timeZone: 'Asia/Ho_Chi_Minh', hour12: false };
    const timeString = now.toLocaleString('vi-VN', options);
    document.getElementById('realtime-clock').textContent = `🕐 ${timeString}`;
}
setInterval(updateClock, 1000);
updateClock();

// Modal controls
const modals = document.querySelectorAll('.modal');
const closeBtns = document.querySelectorAll('.close');

closeBtns.forEach(btn => {
    btn.onclick = () => {
        modals.forEach(m => m.style.display = 'none');
        clickSound.play();
    };
});

window.onclick = (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
        clickSound.play();
    }
};

// Auth system
let currentUser = null;

function loadUser() {
    const saved = localStorage.getItem('currentUser');
    if (saved) {
        currentUser = JSON.parse(saved);
        currentScore = currentUser.score || 0;
        updateScoreDisplay();
        document.getElementById('username-display').textContent = currentUser.name;
        document.getElementById('user-info').classList.remove('hidden');
        document.getElementById('auth-buttons').classList.add('hidden');
        showMainContent();
    }
}

function showMainContent() {
    document.getElementById('main-content').classList.remove('hidden');
    renderGames();
}

function renderGames() {
    const container = document.getElementById('game-list');
    container.innerHTML = '';
    games.forEach(g => {
        const card = document.createElement('div');
        card.className = 'game-card';
        card.innerHTML = `<h3>\( {g.name}</h3><p> \){g.desc}</p><p>Chơi ngay →</p>`;
        card.onclick = () => {
            clickSound.play();
            startGame(g.id);
        };
        container.appendChild(card);
    });
}

// Bắt đầu game
function startGame(id) {
    currentGameId = id;
    currentScore = currentUser ? (currentUser.score || 0) : 0;
    updateScoreDisplay();
    document.getElementById('home').style.display = 'none';
    document.getElementById('game-controls').classList.remove('hidden');
    document.getElementById('phaser-game').classList.remove('hidden'); // thêm class hidden ở CSS nếu cần

    const config = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        parent: 'phaser-game',
        physics: { default: 'arcade', arcade: { gravity: { y: 300 }, debug: false } },
        scene: getSceneForGame(id)
    };

    if (game) game.destroy(true);
    game = new Phaser.Game(config);
    successSound.play();
}

// Các scene game
function getSceneForGame(id) {
    switch (id) {
        case 'flappy': return flappyScene();
        case 'oanquan': return simpleClickScene('Ô Ăn Quan - Click để ăn quan!');
        case 'pikachu': return simpleClickScene('Pikachu - Click để match!');
        case 'shootduck': return simpleClickScene('Bắn Vịt - Click để bắn!');
        case '2048vn': return simpleClickScene('2048 VN - Click để ghép số!');
        case 'baucua': return simpleClickScene('Bầu Cua - Click để tung xúc xắc!');
        default: return simpleClickScene('Game vui vẻ - Click để + điểm!');
    }
}

// Flappy Bird VN chi tiết
function flappyScene() {
    return {
        preload: function () {
            this.load.image('background', 'https://labs.phaser.io/assets/skies/space3.png');
            this.load.image('bird', 'https://labs.phaser.io/assets/sprites/phaser-dude.png');
            this.load.image('pipe', 'https://labs.phaser.io/assets/sprites/pipe.png');
        },
        create: function () {
            this.add.image(400, 300, 'background');
            this.bird = this.physics.add.sprite(100, 300, 'bird').setScale(1.5);
            this.bird.setCollideWorldBounds(true);
            this.bird.body.setGravityY(1000);

            this.pipes = this.physics.add.group();
            this.score = 0;
            this.scoreText = this.add.text(20, 20, 'Điểm: 0', { fontSize: '32px', fill: '#fff' });

            this.input.on('pointerdown', () => this.bird.setVelocityY(-400));
            this.input.keyboard.on('keydown-SPACE', () => this.bird.setVelocityY(-400));

            this.time.addEvent({ delay: 1500, callback: this.addPipe, callbackScope: this, loop: true });

            this.physics.add.collider(this.bird, this.pipes, () => this.gameOver());
        },
        addPipe: function () {
            const hole = Math.floor(Math.random() * 5) + 1;
            for (let i = 0; i < 10; i++) {
                if (i !== hole && i !== hole + 1) {
                    const pipe = this.pipes.create(800, i * 60 + 30, 'pipe');
                    pipe.setVelocityX(-200);
                    pipe.checkWorldBounds = true;
                    pipe.outOfBoundsKill = true;
                }
            }
        },
        update: function () {
            if (this.bird.y > 600 || this.bird.y < 0) this.gameOver();
            this.pipes.children.iterate(pipe => {
                if (pipe && pipe.x < this.bird.x && !pipe.scored) {
                    pipe.scored = true;
                    this.score += 10;
                    updateGlobalScore(10);
                    this.scoreText.setText('Điểm: ' + this.score);
                }
            });
        },
        gameOver: function () {
            gameOver();
        }
    };
}

// Scene đơn giản cho các game khác (click để + điểm)
function simpleClickScene(title) {
    return {
        create: function () {
            this.add.text(200, 200, title + '\nClick để +10 điểm!', { fontSize: '32px', fill: '#fff', align: 'center' });
            this.input.on('pointerdown', () => {
                updateGlobalScore(10);
            });
            // Auto end sau 30s
            this.time.delayedCall(30000, () => gameOver());
        }
    };
}

// Update score
function updateGlobalScore(points) {
    currentScore += points;
    updateScoreDisplay();
    if (currentUser) currentUser.score = currentScore;
}

function updateScoreDisplay() {
    document.getElementById('current-score').textContent = currentScore;
}

// Game over & destroy
function gameOver() {
    gameOverSound.play();
    alert(`Game Over! Điểm cuối: ${currentScore}`);
    saveUserData(); // Lưu ngay khi over
    destroyGame();
}

function destroyGame() {
    if (game) {
        game.destroy(true);
        game = null;
    }
    document.getElementById('home').style.display = 'block';
    document.getElementById('game-controls').classList.add('hidden');
    document.getElementById('phaser-game').classList.add('hidden');
    currentGameId = null;
}

// Game Controls (có confirm hết)
document.getElementById('skip-btn').onclick = () => {
    if (currentScore < 30) return alert('Không đủ 30 điểm!');
    if (confirm('SKIP? Trừ 30 điểm!')) {
        currentScore -= 30;
        updateScoreDisplay();
        saveUserData();
    }
};

document.getElementById('stop-btn').onclick = () => {
    if (confirm('Dừng game ngay?')) destroyGame();
};

document.getElementById('reset-btn').onclick = () => {
    if (confirm('RESET? Xóa toàn bộ điểm!')) {
        currentScore = 0;
        updateScoreDisplay();
        saveUserData();
    }
};

document.getElementById('restart-btn').onclick = () => {
    if (confirm('RESTART? Chơi lại từ đầu (giữ điểm hiện tại)?')) {
        destroyGame();
        startGame(currentGameId);
    }
};

document.getElementById('quit-btn').onclick = () => {
    if (confirm('TỪ BỎ? Trừ 10 điểm!')) {
        currentScore = Math.max(0, currentScore - 10);
        updateScoreDisplay();
        destroyGame();
        saveUserData();
    }
};

// Đăng ký
document.getElementById('register-form').onsubmit = (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;

    if (localStorage.getItem(`user_${email}`)) return alert('Email đã tồn tại!');

    const userData = { name, email, password, score: 0 };
    localStorage.setItem(`user_${email}`, JSON.stringify(userData));
    alert('Đăng ký thành công!');
    document.getElementById('register-modal').style.display = 'none';
    successSound.play();
};

// Đăng nhập
document.getElementById('login-form').onsubmit = (e) => {
    e.preventDefault();
    const identifier = document.getElementById('login-identifier').value.trim();
    const password = document.getElementById('login-password').value;

    let found = false;
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('user_')) {
            const user = JSON.parse(localStorage.getItem(key));
            if ((user.email === identifier || user.name === identifier) && user.password === password) {
                currentUser = user;
                currentScore = user.score || 0;
                updateScoreDisplay();
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                document.getElementById('login-modal').style.display = 'none';
                document.getElementById('username-display').textContent = user.name;
                document.getElementById('user-info').classList.remove('hidden');
                document.getElementById('auth-buttons').classList.add('hidden');
                showMainContent();
                successSound.play();
                found = true;
                break;
            }
        }
    }
    if (!found) alert('Sai thông tin đăng nhập!');
};

// Đăng xuất
document.getElementById('logout-btn').onclick = () => {
    saveUserData();
    localStorage.removeItem('currentUser');
    currentUser = null;
    location.reload();
};

// Report bug & info modal (giữ nguyên)
document.getElementById('report-bug-btn').onclick = () => {
    document.getElementById('bug-modal').style.display = 'block';
    clickSound.play();
};

document.getElementById('bug-form').onsubmit = (e) => {
    e.preventDefault();
    alert('Cảm ơn báo lỗi! Sẽ sửa sớm nhất 🇻🇳');
    document.getElementById('bug-modal').style.display = 'none';
    successSound.play();
    e.target.reset();
};

document.getElementById('info-btn').onclick = () => {
    document.getElementById('info-modal').style.display = 'block';
    clickSound.play();
};

// Auto save data
function saveUserData() {
    if (!currentUser) return;
    currentUser.score = currentScore;

    const notification = document.getElementById('save-notification');
    const countdownEl = document.getElementById('countdown');
    notification.classList.remove('hidden');

    let seconds = 5;
    countdownEl.textContent = seconds;

    const timer = setInterval(() => {
        seconds--;
        countdownEl.textContent = seconds;
        if (seconds <= 0) {
            clearInterval(timer);
            localStorage.setItem(`user_${currentUser.email}`, JSON.stringify(currentUser));
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            notification.classList.add('hidden');
            successSound.play();
        }
    }, 1000);
}

setInterval(saveUserData, 60000); // Mỗi 60s
loadUser(); // Load khi mở trang
