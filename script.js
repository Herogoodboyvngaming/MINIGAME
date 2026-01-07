// Danh sách game Việt Nam
const games = [
    { name: "🇻🇳 Flappy Bird VN", id: "flappy", desc: "Click/Space để bay! - Nguyễn Hà Đông" },
    { name: "🇻🇳 Pikachu Onet", id: "pikachu", desc: "Click 2 con cùng màu để nối!" },
    { name: "🇻🇳 Bắn Vịt", id: "shootduck", desc: "Di chuột + click bắn vịt!" },
    { name: "🇻🇳 Ô Ăn Quan", id: "oanquan", desc: "Click ô để ăn quan dân gian!" },
    { name: "🇻🇳 2048 Việt Nam", id: "2048vn", desc: "Phím mũi tên ghép số!" },
    { name: "🇻🇳 Bầu Cua Tôm Cá", id: "baucua", desc: "Click cược + lắc xúc xắc!" },
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

// Nút Đăng nhập / Đăng ký
document.getElementById('login-btn').onclick = () => {
    document.getElementById('login-modal').style.display = 'block';
    clickSound.play();
};

document.getElementById('register-btn').onclick = () => {
    document.getElementById('register-modal').style.display = 'block';
    clickSound.play();
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
    document.getElementById('phaser-game').classList.remove('hidden');

    const config = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        parent: 'phaser-game',
        physics: { default: 'arcade', arcade: { gravity: { y: 300 } } },
        scene: getSceneForGame(id)
    };

    if (game) game.destroy(true);
    game = new Phaser.Game(config);
    successSound.play();
}

// Các scene game CÓ ĐIỀU KHIỂN THẬT
function getSceneForGame(id) {
    switch (id) {
        case 'flappy': return flappySceneV2();
        case 'pikachu': return pikachuSceneV2();
        case 'shootduck': return shootDuckSceneV2();
        case 'oanquan': return oanquanSceneV2();
        case '2048vn': return game2048SceneV2();
        case 'baucua': return baucuaSceneV2();
        default: return simpleGameScene();
    }
}

// Flappy Bird VN - Điều khiển thật
function flappySceneV2() {
    return {
        preload: function () {
            this.load.image('bg', 'https://labs.phaser.io/assets/skies/space3.png');
            this.load.image('bird', 'https://labs.phaser.io/assets/sprites/phaser-dude.png');
            this.load.image('pipe', 'https://labs.phaser.io/assets/sprites/pipe.png');
        },
        create: function () {
            this.add.image(400, 300, 'bg').setScale(1.5);
            this.bird = this.physics.add.sprite(150, 300, 'bird').setScale(2);
            this.bird.body.setGravityY(1000);
            this.bird.setCollideWorldBounds(true);

            this.pipes = this.physics.add.group();
            this.score = 0;
            this.scoreText = this.add.text(350, 50, 'ĐIỂM: 0', { fontSize: '32px', fill: '#fff' });

            this.input.on('pointerdown', () => this.jump());
            this.input.keyboard.on('keydown-SPACE', () => this.jump());

            this.time.addEvent({ delay: 1800, callback: this.spawnPipes, callbackScope: this, loop: true });
            this.physics.add.collider(this.bird, this.pipes, () => gameOver());
        },
        jump: function () {
            this.bird.setVelocityY(-450);
        },
        spawnPipes: function () {
            const hole = Phaser.Math.Between(100, 400);
            const topPipe = this.pipes.create(850, hole - 300, 'pipe').setScale(1.5);
            const bottomPipe = this.pipes.create(850, hole + 200, 'pipe').setScale(1.5);
            topPipe.body.velocity.x = -200;
            bottomPipe.body.velocity.x = -200;
        },
        update: function () {
            if (this.bird.y > 600 || this.bird.y < 0) gameOver();
            this.pipes.children.iterate(pipe => {
                if (pipe && pipe.x < this.bird.x && !pipe.scored) {
                    pipe.scored = true;
                    this.score += 100;
                    updateGlobalScore(100);
                    this.scoreText.setText('ĐIỂM: ' + this.score);
                }
            });
        }
    };
}

// Pikachu Onet đơn giản
function pikachuSceneV2() {
    let selected = [];
    return {
        create: function () {
            this.grid = [];
            for (let row = 0; row < 6; row++) {
                this.grid[row] = [];
                for (let col = 0; col < 8; col++) {
                    const color = Phaser.Math.Between(0, 4);
                    const tile = this.add.rectangle(100 + col * 80, 100 + row * 80, 70, 70, ['0xff0000','0x00ff00','0x0000ff','0xffff00','0xff00ff'][color])
                        .setInteractive()
                        .setStrokeStyle(3, 0xffffff);
                    tile.row = row; tile.col = col; tile.color = color;
                    tile.on('pointerdown', () => {
                        if (selected.length < 2) selected.push(tile);
                        if (selected.length === 2) {
                            if (selected[0].color === selected[1].color) {
                                selected.forEach(t => t.destroy());
                                updateGlobalScore(200);
                            }
                            selected = [];
                        }
                    });
                    this.grid[row][col] = tile;
                }
            }
        }
    };
}

// Bắn Vịt
function shootDuckSceneV2() {
    return {
        create: function () {
            this.ducks = this.physics.add.group();
            this.time.addEvent({ delay: 1500, callback: () => {
                const duck = this.ducks.create(850, Phaser.Math.Between(100, 500), 'bird').setScale(1.5);
                duck.setVelocityX(-200);
            }, loop: true });

            this.input.on('pointerdown', pointer => {
                this.ducks.children.iterate(duck => {
                    if (duck && Phaser.Math.Distance.Between(pointer.x, pointer.y, duck.x, duck.y) < 50) {
                        duck.destroy();
                        updateGlobalScore(300);
                    }
                });
            });
        }
    };
}

// Ô Ăn Quan, 2048, Bầu Cua đơn giản tương tự...
function oanquanSceneV2() {
    return { create: function () { this.add.text(300, 300, 'Ô Ăn Quan - Click để ăn!', { fontSize: '32px', fill: '#fff' }); } };
}
function game2048SceneV2() {
    return { create: function () { this.add.text(300, 300, '2048 VN - Dùng phím mũi tên!', { fontSize: '32px', fill: '#fff' }); } };
}
function baucuaSceneV2() {
    return { create: function () { this.add.text(300, 300, 'Bầu Cua - Click để cược!', { fontSize: '32px', fill: '#fff' }); } };
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
    alert(`Game Over! Tổng điểm: ${currentScore}`);
    saveUserData();
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

// Game Controls (có confirm)
document.getElementById('skip-btn').onclick = () => {
    if (currentScore < 30) return alert('Không đủ điểm!');
    if (confirm('SKIP? -30 điểm')) { currentScore -= 30; updateScoreDisplay(); saveUserData(); }
};
document.getElementById('stop-btn').onclick = () => confirm('STOP game?') && destroyGame();
document.getElementById('reset-btn').onclick = () => confirm('RESET toàn bộ điểm?') && (currentScore = 0) && updateScoreDisplay() && saveUserData();
document.getElementById('restart-btn').onclick = () => confirm('RESTART?') && destroyGame() && startGame(currentGameId);
document.getElementById('quit-btn').onclick = () => confirm('TỪ BỎ? -10 điểm') && (currentScore = Math.max(0, currentScore - 10)) && updateScoreDisplay() && destroyGame() && saveUserData();

// Đăng ký / Đăng nhập / Đăng xuất / Report / Info
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
};

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
                found = true;
                break;
            }
        }
    }
    if (!found) alert('Sai thông tin!');
};

document.getElementById('logout-btn').onclick = () => {
    saveUserData();
    localStorage.removeItem('currentUser');
    currentUser = null;
    location.reload();
};

document.getElementById('report-bug-btn').onclick = () => document.getElementById('bug-modal').style.display = 'block';
document.getElementById('bug-form').onsubmit = (e) => { e.preventDefault(); alert('Cảm ơn báo lỗi!'); document.getElementById('bug-modal').style.display = 'none'; e.target.reset(); };
document.getElementById('info-btn').onclick = () => document.getElementById('info-modal').style.display = 'block';

// Auto save
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

setInterval(saveUserData, 60000);
loadUser(); // Khởi động
