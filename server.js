const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

// مسیر فایل پایگاه داده برای اینکه اطلاعات کاربران با ریستارت شدن یا خوابیدن سرور پاک نشود
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

// سرو کردن فایل‌های استاتیک فرانت‌اند (مثل عکس‌ها، استایل‌ها و اسکریپت‌ها)
app.use(express.static(path.join(__dirname)));

// API دریافت اطلاعات کاربر و موجودی
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

// باز شدن صفحه اصلی مینی‌اپ با آدرس ریشه
app.get('/', (req, res) => {
const indexPath = path.join(__dirname, 'app.html');
if (fs.existsSync(indexPath)) {
res.sendFile(indexPath);
} else {
res.sendFile(path.join(__dirname, 'index.html'));
}
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
console.log('Server is running on port ' + PORT);
});
