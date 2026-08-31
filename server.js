const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

let users = {};

// ارسال مستقیم صفحه فرانت‌اند از طریق سرور (بدون وابستگی به فایل‌های دیگر)
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SiemenS Mini-App</title>
    <script src="https://telegram.org/js/telegram-web-app.js"></script>
    <style>
        body { font-family: sans-serif; background-color: #121526; color: #fff; margin: 0; padding: 20px; display: flex; flex-direction: column; align-items: center; }
        .status { margin-bottom: 15px; font-size: 14px; color: #00e676; font-weight: bold; }
        .card { background-color: #1d2238; border-radius: 12px; padding: 20px; width: 100%; max-width: 350px; text-align: center; margin-bottom: 15px; box-sizing: border-box; }
        .title { color: #8a92b2; font-size: 14px; margin-bottom: 8px; }
        .balance { color: #00e676; font-size: 32px; font-weight: bold; }
        .btn { background-color: #00c853; color: white; border: none; padding: 14px; border-radius: 10px; width: 100%; font-size: 16px; font-weight: bold; cursor: pointer; transition: 0.2s; }
        .btn:disabled { background-color: #444; color: #aaa; cursor: not-allowed; }
        .timer { margin-top: 10px; font-size: 14px; color: #ffb74d; }
        .ref-box { background: #141824; padding: 10px; border-radius: 8px; font-size: 12px; word-break: break-all; margin-top: 10px; user-select: all; color: #64b5f6; }
    </style>
</head>
<body>

    <div class="status" id="status">در حال اتصال...</div>

    <div class="card">
        <div class="title">موجودی حساب شما</div>
        <div class="balance"><span id="balance">0.00</span> USDT</div>
    </div>

    <div class="card">
        <div class="title">پاداش روزانه (۱ USDT)</div>
        <button class="btn" id="claimBtn" onclick="claimReward()">دریافت پاداش</button>
        <div class="timer" id="timer"></div>
    </div>

    <div class="card">
        <div class="title">دعوت از دوستان (۰.۵ USDT پاداش)</div>
        <div>تعداد زیرمجموعه‌ها: <b id="refCount">0</b> نفر</div>
        <div class="ref-box" id="refLink">در حال دریافت لینک...</div>
    </div>

    <script>
        const tg = window.Telegram?.WebApp;
        if(tg) { tg.ready(); tg.expand(); }
        
        const userId = String(tg?.initDataUnsafe?.user?.id || '123456');
        const botUsername = "SiemenS_bot"; 
        const startParam = tg?.initDataUnsafe?.start_param || '';

        let timerInterval = null;

        function loadData() {
            fetch('/api/user/' + userId + '?ref=' + startParam)
                .then(res => res.json())
                .then(data => {
                    document.getElementById('balance').innerText = Number(data.balance || 0).toFixed(2);
                    document.getElementById('refCount').innerText = data.referrals || 0;
                    document.getElementById('refLink').innerText = 'https://t.me/' + botUsername + '?start=' + userId;
                    document.getElementById('status').innerText = 'متصل شد';

                    checkTimer(data.lastClaim || 0);
                })
                .catch(err => {
                    document.getElementById('status').innerText = 'خطا در اتصال به سرور';
                    document.getElementById('status').style.color = '#ff5252';
                });
        }

        function checkTimer(lastClaim) {
            const COOLDOWN = 24 * 60 * 60 * 1000;
            const now = Date.now();
            const timePassed = now - lastClaim;

            if (lastClaim > 0 && timePassed < COOLDOWN) {
                startCountdown(COOLDOWN - timePassed);
            } else {
                enableButton();
            }
        }

        function startCountdown(remainingMs) {
            const btn = document.getElementById('claimBtn');
            btn.disabled = true;
            
            clearInterval(timerInterval);
            timerInterval = setInterval(() => {
                remainingMs -= 1000;
                if (remainingMs <= 0) {
                    clearInterval(timerInterval);
                    enableButton();
                    return;
                }
                const hours = Math.floor(remainingMs / (1000 * 60 * 60));
                const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);
                
                btn.innerText = 'دریافت شد';
                document.getElementById('timer').innerText = 'دریافت بعدی: ' + hours + ':' + minutes + ':' + seconds;
            }, 1000);
        }

        function enableButton() {
            const btn = document.getElementById('claimBtn');
            btn.disabled = false;
            btn.innerText = 'دریافت پاداش';
            document.getElementById('timer').innerText = '';
        }

        function claimReward() {
            fetch('/api/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: userId })
            })
            .then(res => res.json())
            .then(data => {
                if(data.success) {
                    document.getElementById('balance').innerText = Number(data.newBalance).toFixed(2);
                    checkTimer(data.lastClaim);
                } else {
                    alert(data.message);
                }
            })
            .catch(err => alert('خطا در برقراری ارتباط با سرور'));
        }

        loadData();
    </script>
</body>
</html>
    `);
});

app.get('/api/user/:id', (req, res) => {
    try {
        const id = String(req.params.id || '123456');
        const refBy = req.query.ref;

        if (!users[id]) {
            users[id] = { balance: 0, lastClaim: 0, referrals: 0 };
            if (refBy && users[refBy] && refBy !== id) {
                users[refBy].balance += 0.50;
                users[refBy].referrals += 1;
            }
        }
        res.json(users[id]);
    } catch (err) {
        res.status(500).json({ balance: 0, lastClaim: 0, referrals: 0 });
    }
});

app.post('/api/claim', (req, res) => {
    try {
        const id = String(req.body.userId || '123456');
        const now = Date.now();
        const COOLDOWN = 24 * 60 * 60 * 1000;

        if (!users[id]) {
            users[id] = { balance: 0, lastClaim: 0, referrals: 0 };
        }

        const user = users[id];
        if (now - user.lastClaim < COOLDOWN) {
            return res.json({ success: false, message: 'هنوز ۲۴ ساعت نگذشته است.' });
        }

        user.balance += 1.00;
        user.lastClaim = now;
        res.json({ success: true, newBalance: user.balance, lastClaim: user.lastClaim });
    } catch (err) {
        res.status(500).json({ success: false, message: 'خطای سرور' });
    }
});

app.listen(PORT, () => {
    console.log('Server running on port ' + PORT);
});
