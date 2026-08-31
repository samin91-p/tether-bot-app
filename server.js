const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const DB_FILE = path.join(__dirname, 'users.json');

function readDB() {
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify({}));
    }
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function writeDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// تابع کمکی برای ساختار پیش‌فرض کاربر
function getDefaultUserData() {
    return {
        balance: 0,
        totalDeposited: 0,
        depositTime: 0,
        lastClaim: 0,
        lastLucky: 0,
        lastGame: 0,
        invitedBy: null,       // کسی که این کاربر را دعوت کرده
        validReferrals: 0,     // تعداد دوستانی که واریز انجام داده‌اند
        vouchers: 0,           // تعداد ووچرهای دریافتی از دعوت
        referredList: []       // لیست آیدی دوستان دعوت شده
    };
}

// مسیر گرفتن اطلاعات کاربر (همراه با قابلیت ثبت معرف در صورت ارسال startParam)
app.post('/api/user', (req, res) => {
    const { userId, startParam } = req.body;
    if (!userId) return res.status(400).json({ success: false, message: "User ID missing" });

    const db = readDB();
    
    if (!db[userId]) {
        db[userId] = getDefaultUserData();
        
        // اگر کاربر با لینک کسی آمده باشد و معرف خودش نباشد
        if (startParam && db[startParam] && startParam !== userId) {
            db[userId].invitedBy = startParam;
            if (!db[startParam].referredList.includes(userId)) {
                db[startParam].referredList.push(userId);
            }
        }
        writeDB(db);
    } else {
        // چک کردن فیلدهای جدید در صورت آپدیت دیتابیس قدیمی
        let updated = false;
        const defaults = getDefaultUserData();
        for (let key in defaults) {
            if (db[userId][key] === undefined) {
                db[userId][key] = defaults[key];
                updated = true;
            }
        }
        if (updated) writeDB(db);
    }
    
    res.json({ success: true, data: db[userId] });
});

// مسیر ساخت فاکتور
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

// ثبت درخواست بررسی پرداخت
app.post('/api/verify-payment', (req, res) => {
    try {
        const { userId, amountToPay } = req.body;
        console.log("========================================");
        console.log("🔔 واریز جدید ثبت شد!");
        console.log("👤 آیدی کاربر: " + userId);
        console.log("💰 مبلغ درخواستی: " + amountToPay + " USDT");
        console.log("========================================");

        res.json({ success: true, message: "Payment verification request sent successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// شارژ حساب توسط ادمین (و اعمال پاداش خودکار معرف در صورت اولین واریز بالای 20 تتر)
app.post('/api/admin/charge', (req, res) => {
    const { userId, amount, deposit } = req.body;
    const db = readDB();
    
    if (!db[userId]) {
        db[userId] = getDefaultUserData();
    }
    
    const wasAlreadyDeposited = db[userId].totalDeposited >= 20;
    
    db[userId].balance += parseFloat(amount || 0);
    if (deposit) {
        db[userId].totalDeposited += parseFloat(deposit);
        db[userId].depositTime = Date.now();
    }
    
    // اگر کاربر برای اولین بار واریزش به ۲۰ تتر یا بیشتر رسید و کسی او را دعوت کرده بود
    if (!wasAlreadyDeposited && db[userId].totalDeposited >= 20 && db[userId].invitedBy) {
        const referrerId = db[userId].invitedBy;
        if (db[referrerId]) {
            // افزایش تعداد دوستان معتبر و ووچر معرف
            db[referrerId].validReferrals += 1;
            db[referrerId].vouchers += 1;
            // همچنین می‌توانیم اختیاری یک جایزه نقدی هم به معرف بدهیم (مثلاً 1 USDT)
            db[referrerId].balance += 1.0; 
        }
    }
    
    writeDB(db);
    console.log(`✅ حساب کاربر ${userId} شارژ شد.`);
    res.json({ success: true, data: db[userId] });
});

// دریافت جایزه روزانه (1 USDT)
app.post('/api/claim-reward', (req, res) => {
    const { userId } = req.body;
    const db = readDB();
    
    if (!db[userId] || db[userId].totalDeposited < 20) {
        return res.json({ success: false, message: "Requirement not met (Min 20 USDT deposit)" });
    }
    
    const COOLDOWN = 24 * 60 * 60 * 1000;
    const now = Date.now();
    
    if (db[userId].lastClaim && (now - db[userId].lastClaim < COOLDOWN)) {
        return res.json({ success: false, message: "Cooldown active" });
    }
    
    db[userId].balance += 1.0;
    db[userId].lastClaim = now;
    writeDB(db);
    
    res.json({ success: true, data: db[userId], reward: 1.0 });
});

// باز کردن جعبه شانس (بین 1 تا 5 USDT)
app.post('/api/open-lucky', (req, res) => {
    const { userId } = req.body;
    const db = readDB();
    
    if (!db[userId] || db[userId].totalDeposited < 20) {
        return res.json({ success: false, message: "Requirement not met" });
    }
    
    const COOLDOWN = 24 * 60 * 60 * 1000;
    const now = Date.now();
    
    if (db[userId].lastLucky && (now - db[userId].lastLucky < COOLDOWN)) {
        return res.json({ success: false, message: "Cooldown active" });
    }
    
    const randomReward = parseFloat((Math.random() * 4 + 1).toFixed(2));
    db[userId].balance += randomReward;
    db[userId].lastLucky = now;
    writeDB(db);
    
    res.json({ success: true, data: db[userId], reward: randomReward });
});

// بازی چرخش (Mystery Spin Game - یک بار در هفته / هر ۷ روز)
app.post('/api/play-game', (req, res) => {
    const { userId } = req.body;
    const db = readDB();
    
    if (!db[userId] || db[userId].totalDeposited < 40) {
        return res.json({ success: false, message: "Requirement not met (Min 40 USDT deposit)" });
    }
    
    const WEEK_COOLDOWN = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    
    if (db[userId].lastGame && (now - db[userId].lastGame < WEEK_COOLDOWN)) {
        return res.json({ success: false, message: "You can only play once a week!" });
    }
    
    const prizes = [2.0, 5.0, 10.0, 20.0, 3.0, 4.0];
    const wonPrize = prizes[Math.floor(Math.random() * prizes.length)];
    
    db[userId].balance += wonPrize;
    db[userId].lastGame = now;
    writeDB(db);
    
    res.json({ success: true, data: db[userId], reward: wonPrize });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
   console.log(`Server is running on port ${PORT}`);
});
