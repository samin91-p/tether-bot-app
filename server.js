const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// فعال‌سازی کامل CORS برای جلوگیری از مسدود شدن در تلگرام
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ذخیره داده‌ها در حافظه سرور (بدون نیاز به نام‌کاربری و رمز عبور dbs)
let users = {};

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

app.listen(PORT, () => console.log(Server running on port ${PORT}));
