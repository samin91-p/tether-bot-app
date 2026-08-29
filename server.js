const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// تنظیم دستی CORS بدون نیاز به پکیج خارجی
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

const users = {};

app.get('/api/user/:id', (req, res) => {
    const userId = req.params.id;
    if (!users[userId]) {
        users[userId] = { balance: 0.00, lastClaim: null };
    }
    res.json(users[userId]);
});

app.post('/api/claim', (req, res) => {
    const { userId } = req.body;
    if (!users[userId]) {
        users[userId] = { balance: 0.00, lastClaim: null };
    }
    users[userId].balance += 1.00;
    res.json({ success: true, newBalance: users[userId].balance });
});

app.listen(PORT, () => {
    console.log(Server is running on port ${PORT});
});
