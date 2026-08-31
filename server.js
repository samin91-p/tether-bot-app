const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// تنظیمات CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// دیتابیس ساده در حافظه
const users = {};

// دریافت اطلاعات کاربر
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
        res.status(500).json({ error: 'Server Error' });
    }
});

// ثبت پاداش روزانه
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
        res.status(500).json({ error: 'Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(Server is running on port ${PORT});
});
