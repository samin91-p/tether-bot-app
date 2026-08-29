const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// اجازه اتصال از تمام دامنه‌ها (حل مشکل CORS)
app.use(cors());
app.use(express.json());

// دیتابیس موقت در حافظه
const users = {};

// دریافت اطلاعات کاربر
app.get('/api/user/:id', (req, res) => {
    const userId = req.params.id;
    if (!users[userId]) {
        users[userId] = { balance: 0.00, lastClaim: null };
    }
    res.json(users[userId]);
});

// دریافت پاداش روزانه
app.post('/api/claim', (req, res) => {
    const { userId } = req.body;
    if (!users[userId]) {
        users[userId] = { balance: 0.00, lastClaim: null };
    }
    
    // افزودن ۱ دلار به موجودی
    users[userId].balance += 1.00;
    res.json({ success: true, newBalance: users[userId].balance });
});

app.listen(PORT, () => {
    console.log(Server is running on port ${PORT});
});
