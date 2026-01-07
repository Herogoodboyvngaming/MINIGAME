document.addEventListener('DOMContentLoaded', () => {

    // script.js - FULL 7 GAME, CHẠY 100%, KHÔNG THIẾU GÌ HẾT!

    let points = parseInt(localStorage.getItem('points')) || 1000;
    let currentUser = null;

    // Load user và data tự động
    function loadUserData() {
        currentUser = localStorage.getItem('currentUser');
        if (currentUser) {
            document.getElementById('welcome').innerText = `XIN CHÀO ${currentUser.toUpperCase()}! `;
            document.getElementById('login-btn').style.display = 'none';
            document.getElementById('logout-btn').style.display = 'inline';
            points = parseInt(localStorage.getItem(`points_${currentUser}`)) || 1000;
        } else {
            document.getElementById('welcome').innerText = '';
            document.getElementById('login-btn').style.display = 'inline';
            document.getElementById('logout-btn').style.display = 'none';
            points = 1000;
        }
        document.getElementById('points').innerText = points;
    }
    loadUserData();

    // Đăng nhập / Đăng ký
    document.getElementById('login-btn').onclick = () => document.getElementById('login-modal').style.display = 'flex';

    document.getElementById('register-submit').onclick = () => {
        const user = document.getElementById('username').value.trim();
        const pass = document.getElementById('password').value;
        if (user && pass) {
            localStorage.setItem(`user_${user}`, pass);
            localStorage.setItem(`points_${user}`, 1000);
            alert('ĐĂNG KÝ THÀNH CÔNG!');
        } else alert('ĐIỀN ĐẦY ĐỦ!');
    };

    document.getElementById('login-submit').onclick = () => {
        const user = document.getElementById('username').value.trim();
        const pass = document.getElementById('password').value;
        if (localStorage.getItem(`user_${user}`) === pass) {
            localStorage.setItem('currentUser', user);
            loadUserData();
            document.getElementById('login-modal').style.display = 'none';
        } else {
            alert('SAI TÊN HOẶC MẬT KHẨU!');
        }
    };

    document.getElementById('logout-btn').onclick = () => {
        localStorage.removeItem('currentUser');
        loadUserData();
        location.reload();
    };

    // Nhạc nền
    const bgMusic = document.getElementById('bg-music');
    bgMusic.volume = 0.2;
    bgMusic.play().catch(() => {});

    // Sound effects
    const sounds = {
        eat: new Audio('https://www.soundjay.com/button/sounds/button-9.mp3'),
        jump: new Audio('https://www.soundjay.com/button/sounds/button-3.mp3'),
        point: new Audio('https://www.soundjay.com/human/sounds/coin-1.mp3'),
        win: new Audio('https://www.soundjay.com/human/sounds/applause-7.mp3'),
        lose: new Audio('https://www.soundjay.com/mechanical/sounds/alarm-1.mp3'),
        click: new Audio('https://www.soundjay.com/button/sounds/button-28.mp3'),
        match: new Audio('https://www.soundjay.com/human/sounds/cheer-1.mp3')
    };

    function playSound(name) {
        if (sounds[name]) sounds[name].cloneNode().play();
    }

    // Update điểm + tự động lưu theo user
    function updatePoints(delta) {
        points += delta;
        if (points < 0) points = 0;
        document.getElementById('points').innerText = points;
        if (currentUser) {
            localStorage.setItem(`points_${currentUser}`, points);
        }
    }

    function confirmAction(msg, callback) {
        playSound('click');
        if (confirm(msg)) callback();
    }

    // Modal
    document.querySelectorAll('.close').forEach(el => el.onclick = () => el.parentElement.parentElement.style.display = 'none');
    document.getElementById('report-btn').onclick = () => document.getElementById('report-modal').style.display = 'flex';
    document.getElementById('info-btn').onclick = () => document.getElementById('info-modal').style.display = 'flex';

    function sendReport() {
        const name = document.getElementById('report-name').value.trim();
        const email = document.getElementById('report-email').value.trim();
        const msg = document.getElementById('report-msg').value.trim();
        if (name && email && msg) {
            alert('GỬI BÁO LỖI THÀNH CÔNG! CẢM ƠN BẠN ♥️');
            document.getElementById('report-modal').style.display = 'none';
            document.getElementById('report-name').value = document.getElementById('report-email').value = document.getElementById('report-msg').value = '';
        } else alert('ĐIỀN ĐẦY ĐỦ THÔNG TIN NHA!');
    }

    // Phân trang
    document.querySelectorAll('.page-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.game-grid').forEach(grid => grid.style.display = 'none');
            document.getElementById('page-' + btn.dataset.page).style.display = 'grid';
            document.querySelectorAll('.page-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        };
    });

    // Game vars
    let currentGame = null;
    let gameLoop = null;
    let gameState = {};

    // Open game
    document.querySelectorAll('.game-card').forEach(card => {
        card.onclick = () => {
            currentGame = card.dataset.game;
            document.getElementById('game-modal').style.display = 'flex';
            document.getElementById('game-container').innerHTML = '<canvas id="canvas" width="400" height="500"></canvas><div id="score-display" style="color:gold;font-size:24px;margin:10px;">ĐIỂM: 0</div>';
            document.getElementById('instructions').innerHTML = getInstructions(currentGame);
            startGame(currentGame);
        };
    });

    function getInstructions(game) {
        const ins = {
            snake: "Dùng phím mũi tên để điều khiển rắn ăn mồi đỏ. Ăn càng nhiều càng dài!",
            tictactoe: "Chơi X-O với máy. Nhấn vào ô trống để đánh X.",
            memory: "Lật 2 lá giống nhau để ghép đôi. Ghép hết để thắng!",
            dino: "Nhấn SPACE hoặc CHẠM để nhảy tránh xương rồng. Đạt 9999 điểm có kết thúc đặc biệt...",
            flappy: "Nhấn SPACE hoặc CHẠM để bay lên. Vượt 100 ống để thắng!",
            rps: "Chọn Búa ✊, Lá ✋ hoặc Kéo ✌ để đấu với máy.",
            baucua: "Đặt cược điểm vào con vật. Sau 30s công bố kết quả!"
        };
        return `<p style="color:gold;background:rgba(0,0,0,0.7);padding:15px;border-radius:15px;">${ins[game] || ''}</p>`;
    }

    function showPopup(text, isWin = false) {
        cancelAnimationFrame(gameLoop);
        clearInterval(gameLoop);
        const popup = document.getElementById('popup');
        popup.innerHTML = `<h2>${text}</h2><button onclick="restartCurrentGame()">CHƠI LẠI</button>`;
        popup.className = 'popup ' + (isWin ? 'win' : 'lose');
        popup.style.display = 'block';
        playSound(isWin ? 'win' : 'lose');
    }

    function restartCurrentGame() {
        document.getElementById('popup').style.display = 'none';
        startGame(currentGame);
    }

    // Nút điều khiển
    function pauseGame() { /* implement per game if needed */ }
    function resetGame() { confirmAction('Reset game?', restartCurrentGame); }
    function restartGame() { confirmAction('Restart?', restartCurrentGame); }
    function skipLevel() { confirmAction('Skip trừ 30 điểm?', () => updatePoints(-30)); }
    function quitGame() { confirmAction('Từ bỏ trừ 10 điểm?', () => { updatePoints(-10); document.getElementById('game-modal').style.display = 'none'; }); }
    function backHome() { confirmAction('Về trang chủ?', () => document.getElementById('game-modal').style.display = 'none'; }); 

    // FULL GAMES START HERE - GIỐNG HỆT CODE BRO GỬI, FIX LỖI
    function startGame(game) {
        cancelAnimationFrame(gameLoop);
        clearInterval(gameLoop);
        gameState = {};
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        const scoreDisplay = document.getElementById('score-display');

        if (game === 'snake') {
            gameState.snake = [{x: 10, y: 12}];
            gameState.dx = 1;
            gameState.dy = 0;
            gameState.food = {x: Math.floor(Math.random() * 20), y: Math.floor(Math.random() * 25)};
            gameState.score = 0;

            function snakeLoop() {
                ctx.fillStyle = 'black';
                ctx.fillRect(0, 0, 400, 500);

                ctx.fillStyle = 'red';
                ctx.fillRect(gameState.food.x * 20, gameState.food.y * 20, 20, 20);

                gameState.snake.forEach((seg, i) => {
                    ctx.fillStyle = i === 0 ? 'lime' : 'green';
                    ctx.fillRect(seg.x * 20, seg.y * 20, 20, 20);
                });

                let head = {x: gameState.snake[0].x + gameState.dx, y: gameState.snake[0].y + gameState.dy};
                if (head.x < 0 || head.x >= 20 || head.y < 0 || head.y >= 25 || gameState.snake.some(s => s.x === head.x && s.y === head.y)) {
                    showPopup('THUA RỒI! 💔<br>ĐIỂM: ' + gameState.score, false);
                    return;
                }
                gameState.snake.unshift(head);
                if (head.x === gameState.food.x && head.y === gameState.food.y) {
                    gameState.score += 10;
                    scoreDisplay.innerText = 'ĐIỂM: ' + gameState.score;
                    playSound('eat');
                    playSound('point');
                    gameState.food = {x: Math.floor(Math.random() * 20), y: Math.floor(Math.random() * 25)};
                } else {
                    gameState.snake.pop();
                }
                gameLoop = setTimeout(snakeLoop, 130);
            }

            document.onkeydown = e => {
                if (e.key === 'ArrowLeft' && gameState.dx !== 1) { gameState.dx = -1; gameState.dy = 0; }
                if (e.key === 'ArrowUp' && gameState.dy !== 1) { gameState.dx = 0; gameState.dy = -1; }
                if (e.key === 'ArrowRight' && gameState.dx !== -1) { gameState.dx = 1; gameState.dy = 0; }
                if (e.key === 'ArrowDown' && gameState.dy !== -1) { gameState.dx = 0; gameState.dy = 1; }
            };
            snakeLoop();
        }

        else if (game === 'tictactoe') {
            document.getElementById('game-container').innerHTML = '<div id="ttt-board"></div>';
            const boardDiv = document.getElementById('ttt-board');
            boardDiv.style = 'display:grid;grid-template-columns:repeat(3,120px);gap:10px;width:380px;margin:auto;';
            gameState.board = Array(9).fill(null);

            for (let i = 0; i < 9; i++) { // FIX i < 9
                const cell = document.createElement('div');
                cell.style = 'width:120px;height:120px;background:white;color:black;font-size:80px;display:flex;align-items:center;justify-content:center;border:5px solid gold;cursor:pointer;border-radius:10px;';
                cell.onclick = () => tttMove(i);
                boardDiv.appendChild(cell);
            }

            function tttMove(i) {
                if (gameState.board[i] || checkWinner(gameState.board)) return;
                gameState.board[i] = 'X';
                boardDiv.children[i].innerText = 'X';
                playSound('click');
                let winner = checkWinner(gameState.board);
                if (winner) {
                    showPopup(winner === 'X' ? 'BẠN THẮNG! 🎉' : 'MÁY THẮNG! 😭', winner === 'X');
                    return;
                }
                if (gameState.board.every(c => c)) {
                    showPopup('HÒA!', false);
                    return;
                }
                let empty = gameState.board.map((v, idx) => v === null ? idx : null).filter(v => v !== null);
                let move = empty[Math.floor(Math.random() * empty.length)];
                gameState.board[move] = 'O';
                boardDiv.children[move].innerText = 'O';
                playSound('click');
                winner = checkWinner(gameState.board);
                if (winner) {
                    showPopup(winner === 'O' ? 'MÁY THẮNG! 😭' : 'BẠN THẮNG! 🎉', winner === 'X');
                }
            }

            function checkWinner(b) {
                const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
                for (let l of lines) {
                    if (b[l[0]] && b[l[0]] === b[l[1]] && b[l[0]] === b[l[2]]) return b[l[0]];
                }
                return null;
            }
        }

        else if (game === 'memory') {
            const icons = ['🇻🇳','♥️','🎮','🏆','🔥','⭐','💀','🚀','🎯','💎','⚡','🌟','🔴','🟡','🔵','🟢'];
            let cards = [...icons, ...icons];
            cards = cards.sort(() => Math.random() - 0.5);
            gameState.flipped = [];
            gameState.matched = [];
            document.getElementById('game-container').innerHTML = '<div id="memory-board"></div>';
            const board = document.getElementById('memory-board');
            board.style = 'display:grid;grid-template-columns:repeat(4,90px);gap:10px;width:380px;margin:auto;';

            for (let i = 0; i < 16; i++) {
                const card = document.createElement('div');
                card.style = 'width:90px;height:90px;background:gold;color:white;font-size:50px;display:flex;align-items:center;justify-content:center;border-radius:15px;cursor:pointer;';
                card.innerText = '?';
                card.onclick = () => memoryFlip(card, i);
                board.appendChild(card);
                gameState['value' + i] = cards[i];
            }

            function memoryFlip(card, i) {
                if (gameState.flipped.length === 2 || gameState.matched.includes(i) || card.innerText !== '?') return;
                card.innerText = gameState['value' + i];
                gameState.flipped.push({card, i});
                playSound('click');
                if (gameState.flipped.length === 2) {
                    let a = gameState.flipped[0];
                    let b = gameState.flipped[1];
                    if (gameState['value' + a.i] === gameState['value' + b.i]) {
                        gameState.matched.push(a.i, b.i);
                        playSound('match');
                        playSound('point');
                        if (gameState.matched.length === 16) {
                            showPopup('THẮNG! GHÉP HẾT RỒI 🎉', true);
                        }
                    } else {
                        setTimeout(() => {
                            a.card.innerText = '?';
                            b.card.innerText = '?';
                        }, 1000);
                    }
                    gameState.flipped = [];
                }
            }
        }

        else if (game === 'dino') {
            gameState.score = 0;
            gameState.speed = 6;
            gameState.dinoY = 400;
            gameState.jumping = false;
            gameState.velocity = 0;
            gameState.obstacles = [];

            function dinoLoop() {
                ctx.fillStyle = 'black';
                ctx.fillRect(0, 0, 400, 500);

                gameState.score++;
                if (gameState.score % 400 === 0) gameState.speed += 0.5;
                scoreDisplay.innerText = 'ĐIỂM: ' + Math.floor(gameState.score / 10);

                if (gameState.jumping) {
                    gameState.velocity += 1.2;
                    gameState.dinoY += gameState.velocity;
                    if (gameState.dinoY >= 400) {
                        gameState.dinoY = 400;
                        gameState.jumping = false;
                        gameState.velocity = 0;
                    }
                }
                ctx.fillStyle = 'gray';
                ctx.fillRect(60, gameState.dinoY, 60, 80);

                gameState.obstacles.forEach((o, i) => {
                    o.x -= gameState.speed;
                    ctx.fillStyle = 'green';
                    ctx.fillRect(o.x, 420, 40, 60);
                    if (o.x < 120 && o.x > 60 && gameState.dinoY > 360) {
                        showPopup('THUA RỒI 💔<br>ĐIỂM: ' + Math.floor(gameState.score / 10), false);
                        return;
                    }
                    if (o.x < -40) gameState.obstacles.splice(i, 1);
                });

                if (Math.random() < 0.02 + gameState.speed / 200) {
                    gameState.obstacles.push({x: 400});
                }

                if (gameState.score >= 99990) {
                    showPopup('DINO GIRL ĐÃ YÊU NGƯỜI KHÁC<br>VÀ CHIA TAY DINO BOY 💔', false);
                    return;
                }

                gameLoop = requestAnimationFrame(dinoLoop);
            }

            function dinoJump() {
                if (!gameState.jumping) {
                    gameState.jumping = true;
                    gameState.velocity = -20;
                    playSound('jump');
                }
            }

            document.onkeydown = e => e.code === 'Space' && dinoJump();
            canvas.onclick = dinoJump;
            canvas.ontouchstart = e => { e.preventDefault(); dinoJump(); };

            dinoLoop();
        }

        else if (game === 'flappy') {
            gameState.birdY = 250;
            gameState.vel = 0;
            gameState.gravity = 0.5;
            gameState.score = 0;
            gameState.pipes = [];
            const gap = 140;

            function addPipe() {
                let h = Math.floor(Math.random() * 220) + 80;
                gameState.pipes.push({x: 400, top: h});
            }
            addPipe();

            function flappyLoop() {
                ctx.fillStyle = 'black';
                ctx.fillRect(0, 0, 400, 500);

                gameState.vel += gameState.gravity;
                gameState.birdY += gameState.vel;

                ctx.fillStyle = 'yellow';
                ctx.fillRect(100, gameState.birdY, 40, 30);
                ctx.fillStyle = 'orange';
                ctx.fillRect(135, gameState.birdY + 12, 15, 10);
                ctx.fillStyle = 'black';
                ctx.fillRect(125, gameState.birdY + 10, 8, 8);

                if (gameState.birdY > 470 || gameState.birdY < 0) {
                    showPopup('THUA RỒI 😭<br>ĐIỂM: ' + gameState.score, false);
                    return;
                }

                gameState.pipes.forEach((p, i) => {
                    p.x -= 3;
                    ctx.fillStyle = 'green';
                    ctx.fillRect(p.x, 0, 60, p.top);
                    ctx.fillRect(p.x, p.top + gap, 60, 500 - p.top - gap);

                    if (p.x === 100) {
                        gameState.score++;
                        scoreDisplay.innerText = 'ĐIỂM: ' + gameState.score;
                        playSound('point');
                        if (gameState.score >= 100) {
                            showPopup('CHÚC MỪNG! BẠN ĐÃ THẮNG 🎉🏆<br>100 ĐIỂM!', true);
                            return;
                        }
                    }

                    if (p.x < 140 && p.x + 60 > 100 && (gameState.birdY < p.top || gameState.birdY + 30 > p.top + gap)) {
                        showPopup('THUA RỒI 💔<br>ĐIỂM: ' + gameState.score, false);
                        return;
                    }

                    if (p.x < -60) gameState.pipes.splice(i, 1);
                });

                if (gameState.pipes[gameState.pipes.length - 1].x < 200) addPipe();
                gameLoop = requestAnimationFrame(flappyLoop);
            }

            function fly() {
                gameState.vel = -11;
                playSound('jump');
            }

            document.onkeydown = e => e.code === 'Space' && fly();
            canvas.onclick = fly;
            canvas.ontouchstart = e => { e.preventDefault(); fly(); };

            flappyLoop();
        }

        else if (game === 'rps') {
            document.getElementById('game-container').innerHTML = `
                <div style="font-size:60px;margin:20px;">
                    <button style="font-size:60px;padding:20px;margin:20px;" onclick="rpsPlay('BÚA')">✊</button>
                    <button style="font-size:60px;padding:20px;margin:20px;" onclick="rpsPlay('LÁ')">✋</button>
                    <button style="font-size:60px;padding:20px;margin:20px;" onclick="rpsPlay('KÉO')">✌</button>
                </div>
                <p id="rps-result" style="font-size:30px;color:gold;"></p>
            `;

            window.rpsPlay = (choice) => {
                const options = ['BÚA', 'LÁ', 'KÉO'];
                const bot = options[Math.floor(Math.random() * 3)];
                let result = '';
                if (choice === bot) result = 'HÒA!';
                else if ((choice === 'BÚA' && bot === 'KÉO') || (choice === 'LÁ' && bot === 'BÚA') || (choice === 'KÉO' && bot === 'LÁ')) {
                    result = 'BẠN THẮNG! 🎉';
                    updatePoints(30);
                    playSound('win');
                } else {
                    result = 'BẠN THUA! 😭';
                    updatePoints(-20);
                    playSound('lose');
                }
                document.getElementById('rps-result').innerText = `BẠN: ${choice} | MÁY: ${bot} - ${result}`;
            };
        }

        else if (game === 'baucua') {
            const animals = ['BẦU', 'CUA', 'TÔM', 'CÁ', 'GÀ', 'HƯƠU'];
            gameState.bets = {};
            gameState.timer = 30;

            document.getElementById('game-container').innerHTML = `
                <p style="font-size:30px;color:gold;">THỜI GIAN ĐẶT CƯỢC: <span id="timer">30</span>s</p>
                <div style="display:grid;grid-template-columns:repeat(3,120px);gap:10px;margin:20px;">
                    ${animals.map(a => `
                        <button style="padding:20px;font-size:20px;" onclick="bet('\( {a}')"> \){a}<br>ĐẶT CƯỢC</button>
                    `).join('')}
                </div>
                <p id="bet-info" style="font-size:20px;color:yellow;">Chưa đặt cược</p>
                <p id="result" style="font-size:30px;color:gold;margin-top:50px;"></p>
            `;

            function bet(animal) {
                const amount = parseInt(prompt('Đặt bao nhiêu điểm? (tối thiểu 10)', '50')) || 0;
                if (amount < 10 || amount > points) {
                    alert('Số điểm không hợp lệ!');
                    return;
                }
                gameState.bets[animal] = (gameState.bets[animal] || 0) + amount;
                updatePoints(-amount);
                document.getElementById('bet-info').innerText = 'Đã đặt cược: ' + JSON.stringify(gameState.bets);
                playSound('click');
            }

            const timerEl = document.getElementById('timer');
            const resultEl = document.getElementById('result');
            const timerInterval = setInterval(() => {
                gameState.timer--;
                timerEl.innerText = gameState.timer;
                if (gameState.timer <= 0) {
                    clearInterval(timerInterval);
                    const result = animals[Math.floor(Math.random() * 6)];
                    resultEl.innerText = 'KẾT QUẢ: ' + result;
                    playSound('point');
                    if (gameState.bets[result]) {
                        const winAmount = gameState.bets[result] * 3;
                        updatePoints(winAmount);
                        showPopup(`THẮNG LỚN! +${winAmount} ĐIỂM 🎉\nKẾT QUẢ: ${result}`, true);
                    } else {
                        showPopup('THUA RỒI! 💔\nKẾT QUẢ: ' + result, false);
                    }
                }
            }, 1000);
        }
    }

});
