const express = require('express');
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
    balance: { type: Number, default: 0 },
    lastClaim: { type: Number, default: 0 },
    referrals: { type: Number, default: 0 }
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
        let userId = String(req.params.id || '123456');
        let refBy = req.query.ref;

        let user = await User.findOne({ userId });
        if (!user) {
            user = await User.create({ userId, balance: 0, lastClaim: 0, referrals: 0 });
            if (refBy && refBy !== userId) {
                let inviter = await User.findOne({ userId: String(refBy) });
                if (inviter) {
                    inviter.balance += 0.50;
                    inviter.referrals += 1;
                    await inviter.save();
                }
            }
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ balance: 0, lastClaim: 0, referrals: 0 });
    }
});

app.post('/api/claim', async (req, res) => {
    try {
        let userId = String(req.body.userId || '123456');
        let user = await User.findOne({ userId });
        if (!user) {
            user = await User.create({ userId, balance: 0, lastClaim: 0, referrals: 0 });
        }

        const now = Date.now();
        const COOLDOWN = 24 * 60 * 60 * 1000;

        if (now - user.lastClaim < COOLDOWN) {
            return res.json({ success: false, message: 'هنوز زمان دریافت پاداش نرسیده است.' });
        }

        user.balance += 1.00;
        user.lastClaim = now;
        await user.save();

        res.json({ success: true, newBalance: user.balance, lastClaim: user.lastClaim });
    } catch (err) {
        res.status(500).json({ success: false, message: 'خطا در ثبت دیتابیس' });
    }
});

app.listen(PORT, () => console.log('Server running on port ' + PORT));
