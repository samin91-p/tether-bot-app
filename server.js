[08:38, 31.8.2026] بوخوم: <!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SiemenS Mini-App</title>
    <script src="https://telegram.org/js/telegram-web-app.js"></script>
    <style>
        body { font-family: sans-serif; background-color: #121526; color: #fff; margin: 0; padding: 20px; display: flex; flex-direction: column; align-items: center; }
        .status { margin-bottom: 20px; font-size: 14px; color: #00e676; font-weight: bold; }
        .card { background-color: #1d2238; border-radius: 12px; padding: 20px; width: 100%; max-width: 350px; text-align: center; margin-bottom: 15px; }
        .title { color: #8a92b2; font-size: 14px; margin-bottom: 8px; }
        .balance { color: #00e676; font-size: 32px; font-weight: bold; }
        .btn { background-color: #00c853; color: white; border: none; padding: 14px; border-radius: 10px; width: 100%; font-size: 16px; font-weight: bold; cursor: pointer; }
    </style>
</head>
<body>

    <div class="status" id="status">در حال اتصال...</div>

    <div class="card">
        <div class="title">موجودی حساب شما</div>
        <div class="balance"><span id="balance">0.00</span> USDT</div>
    </div>

    <div class="card">
        <div class="title">پاداش روزانه</div>
        <button class="btn" id="claimBtn" onclick="claimReward()">دریافت پاداش</button>
    </div>

    <script>
        const tg = window.Telegram?.WebApp;
        if(tg) { tg.ready(); tg.expand(); }
        
        const userId = tg?.initDataUnsafe?.user?.id || '123456';

        function loadData() {
            fetch('/api/user/' + userId)
                .then(res => res.json())
                .then(data => {
                    const val = Number(data.balance);
                    document.getElementById('balance').innerText = isNaN(val) ? '0.00' : val.toFixed(2);
                    document.getElementById('status').innerText = 'متصل شد';
                })
                .catch(() => {
                    document.getElementById('status').innerText = 'خطا در اتصال!';
                });
        }

        function claimReward() {
            document.getElementById('status').innerText = 'در حال ثبت...';
            fetch('/api/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: String(userId) })
            })
            .then(res => res.json())
            .then(data => {
                if(data.success) {
                    const val = Number(data.newBalance);
                    document.getElementById('balance').innerText = isNaN(val) ? '0.00' : val.toFixed(2);
                    document.getElementById('status').innerText = 'پاداش دریافت شد!';
                } else {
                    document.getElementById('status').innerText = 'خطا در ثبت پاداش';
                }
            });
        }

        loadData();
    </script>
</body>
</html>
[08:46, 31.8.2026] بوخوم: const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const MONGO_URI = 'mongodb+srv://saminjorj_db_user:nVETBguTpDjpj3u5@cluster0.gb7umvk.mongodb.net/tetherbot?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB Connected!'))
    .catch(err => console.error('MongoDB Error:', err));

const userSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    balance: { type: Number, default: 0 }
});

const User = mongoose.model('User', userSchema);

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/user/:id', async (req, res) => {
    try {
        let user = await User.findOne({ userId: req.params.id });
        if (!user) {
            user = await User.create({ userId: req.params.id, balance: 0 });
        }
        res.json({ balance: user.balance });
    } catch (err) {
        res.status(500).json({ balance: 0 });
    }
});

app.post('/api/claim', async (req, res) => {
    try {
        const { userId } = req.body;
        let user = await User.findOne({ userId });
        if (!user) {
            user = await User.create({ userId, balance: 0 });
        }
        user.balance += 1;
        await user.save();
        res.json({ success: true, newBalance: user.balance });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

app.listen(PORT, () => console.log('Server running on port ' + PORT));
