const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// فایل ساده برای ذخیره اطلاعات کاربران
const DB_FILE = path.join(__dirname, 'users.json');

// تابع خواندن دیتابیس
function readDB() {
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify({}));
    }
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

// تابع نوشتن در دیتابیس
function writeDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// مسیر ساخت فاکتور با مبلغ اعشاری اختصاصی
app.post('/api/create-invoice', (req, res) => {
    try {
        const { userId, baseAmount } = req.body;
        const randomCents = (Math.floor(Math.random() * 90) + 10) / 100;
        const amountToPay = (parseFloat(baseAmount || 20) + randomCents).toFixed(2);
        const walletAddress = "0xDdaE2e4e81A39C4E68faFAfd8b6aa05192f7A123";

        res.json({
            success: true,
            walletAddress: walletAddress,
            amountToPay: amountToPay,
            message: "Invoice created successfully"
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// دریافت درخواست بررسی پرداخت از کاربر
app.post('/api/verify-payment', (req, res) => {
    try {
        const { userId, amountToPay } = req.body;
        
        console.log("========================================");
        console.log("🔔 واریز جدید ثبت شد!");
        console.log("👤 آیدی کاربر: " + userId);
        console.log("💰 مبلغ درخواستی: " + amountToPay + " USDT");
        console.log("========================================");

        res.json({ 
            success: true, 
            message: "Payment verification request sent successfully" 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// مسیر گرفتن اطلاعات کاربر (موجودی و وضعیت سپرده)
app.get('/api/user/:userId', (req, res) => {
    const db = readDB();
    const userId = req.params.userId;
    
    if (!db[userId]) {
        db[userId] = { balance: 0, totalDeposited: 0, depositTime: 0 };
        writeDB(db);
    }
    
    res.json({ success: true, data: db[userId] });
});

// مسیر شارژ حساب کاربر (توسط شما به عنوان ادمین)
app.post('/api/admin/charge', (req, res) => {
    const { userId, amount, deposit } = req.body; // deposit اختیاری برای فعالسازی سپرده
    const db = readDB();
    
    if (!db[userId]) {
        db[userId] = { balance: 0, totalDeposited: 0, depositTime: 0 };
    }
    
    db[userId].balance += parseFloat(amount || 0);
    if (deposit) {
        db[userId].totalDeposited += parseFloat(deposit);
        db[userId].depositTime = Date.now();
    }
    
    writeDB(db);
    console.log(`✅ حساب کاربر ${userId} به مبلغ ${amount} شارژ شد.`);
    res.json({ success: true, data: db[userId] });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
   console.log(`Server is running on port ${PORT}`);
});
