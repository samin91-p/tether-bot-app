const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let users = {};

app.get('/api/user/:id', (req, res) => {
    const id = String(req.params.id || '123456');
    const refBy = req.query.ref;

    if (!users[id]) {
        users[id] = { balance: 0, lastClaim: 0, lastSpin: 0, referrals: 0 };
        if (refBy && users[refBy] && refBy !== id) {
            users[refBy].balance += 0.50;
            users[refBy].referrals += 1;
        }
    }
    res.json(users[id]);
});

app.post('/api/claim', (req, res) => {
    const id = String(req.body.userId || '123456');
    const now = Date.now();
    const COOLDOWN = 24 * 60 * 60 * 1000;

    if (!users[id]) users[id] = { balance: 0, lastClaim: 0, lastSpin: 0, referrals: 0 };

    const user = users[id];
    if (now - user.lastClaim < COOLDOWN) {
        return res.json({ success: false, message: 'هنوز ۲۴ ساعت نگذشته است.' });
    }

    user.balance += 1.00;
    user.lastClaim = now;
    res.json({ success: true, newBalance: user.balance, lastClaim: user.lastClaim });
});

// مسیر چرخش گردونه شانس
app.post('/api/spin', (req, res) => {
    const id = String(req.body.userId || '123456');
    const now = Date.now();
    const COOLDOWN = 24 * 60 * 60 * 1000;

    if (!users[id]) users[id] = { balance: 0, lastClaim: 0, lastSpin: 0, referrals: 0 };
    const user = users[id];

    if (now - (user.lastSpin || 0) < COOLDOWN) {
        return res.json({ success: false, message: 'گردونه روزانه شما قبلاً استفاده شده است.' });
    }

    // گزینه‌های گردونه و شانس‌ها
    const prizes = [0.10, 0.25, 0.50, 1.00, 2.00, 5.00];
    const winAmount = prizes[Math.floor(Math.random() * prizes.length)];

    user.balance += winAmount;
    user.lastSpin = now;

    res.json({
        success: true,
        reward: winAmount,
        newBalance: user.balance,
        lastSpin: user.lastSpin
    });
});

app.listen(PORT, function() {
    console.log('Server running on port ' + PORT);
});
