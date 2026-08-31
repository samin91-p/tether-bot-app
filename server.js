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

// ذخیره‌سازی داده‌ها در حافظه
let users = {};

app.get('/api/user/:id', (req, res) => {
    const id = String(req.params.id || '123456');
    const refBy = req.query.ref;

    if (!users[id]) {
        users[id] = {
            balance: 0,
            lastClaim: 0,
            referrals: 0
        };

        // اگر کاربر با لینک دعوت وارد شده باشد
        if (refBy && users[refBy] && refBy !== id) {
            users[refBy].balance += 0.50; // پاداش دعوت کننده (0.50 USDT)
            users[refBy].referrals += 1;
        }
    }

    res.json(users[id]);
});

app.post('/api/claim', (req, res) => {
    const id = String(req.body.userId || '123456');
    const now = Date.now();
    const COOLDOWN = 24 * 60 * 60 * 1000; // ۲۴ ساعت به میلی‌ثانیه

    if (!users[id]) {
        users[id] = { balance: 0, lastClaim: 0, referrals: 0 };
    }

    const user = users[id];
    const timePassed = now - user.lastClaim;

    if (timePassed < COOLDOWN) {
        const remainingMs = COOLDOWN - timePassed;
        return res.json({ 
            success: false, 
            message: 'چند ساعت دیگر دوباره تلاش کنید', 
            remainingMs 
        });
    }

    user.balance += 1.00;
    user.lastClaim = now;

    res.json({ 
        success: true, 
        newBalance: user.balance,
        lastClaim: user.lastClaim
    });
});

app.listen(PORT, () => console.log('Server running on port ' + PORT));
