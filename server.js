const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

// مسیر فایل پایگاه داده محلی برای جلوگیری از پاک شدن اطلاعات
const DB_FILE = path.join(__dirname, 'database.json');

// تابع خواندن اطلاعات از فایل
function readDatabase() {
if (!fs.existsSync(DB_FILE)) {
// اطلاعات پیش‌فرض اگر فایل وجود نداشت
const defaultData = {
"6559439220": { balance: 62.20, totalDeposited: 20.00, refCount: 0, voucherCount: 0 }
};
fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2));
return defaultData;
}
try {
const data = fs.readFileSync(DB_FILE, 'utf8');
return JSON.parse(data);
} catch (err) {
return {};
}
}

// تابع ذخیره کردن اطلاعات در فایل
function saveDatabase(data) {
fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// مسیر دریافت اطلاعات کاربر
app.get('/api/user', (req, res) => {
const userId = req.query.userId || '6559439220'; // گرفتن شناسه کاربر از درخواست
const db = readDatabase();

// اگر کاربر جدید بود یک موجودی اولیه به او بدهیم یا اطلاعات قبلی‌اش را بخوانیم
if (!db[userId]) {
db[userId] = {
balance: 0.00,
totalDeposited: 0.00,
refCount: 0,
voucherCount: 0
};
saveDatabase(db);
}

res.json({
userId: userId,
balance: db[userId].balance,
totalDeposited: db[userId].totalDeposited,
refCount: db[userId].refCount,
voucherCount: db[userId].voucherCount
});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
console.log('Server is running on port ' + PORT);
});
