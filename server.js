const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

// سرو کردن فایل‌های استاتیک پوشه public
app.use(express.static(path.join(__dirname, 'public')));

// مسیر فایل دیتابیس برای جلوگیری از صفر شدن موجودی‌ها
const DB_FILE = path.join(__dirname, 'database.json');

function readDatabase() {
if (!fs.existsSync(DB_FILE)) {
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

function saveDatabase(data) {
fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// API دریافت موجودی و اطلاعات کاربر
app.get('/api/user', (req, res) => {
const userId = req.query.userId || '6559439220';
const db = readDatabase();

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

// API بخش واریز با آدرس ولت دقیق شما و متون انگلیسی
app.get('/api/deposit', (req, res) => {
res.json({
status: 'success',
address: '0xDdaE2e4e81A39C4E68faFAF1d8b6aa05192f7A123',
network: 'BEP20 (USDT)',
buttonText: 'I Have Paid / Check Deposit'
});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
console.log('Server is running on port ' + PORT);
});
