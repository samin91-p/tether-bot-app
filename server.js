const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

// سرو کردن خودکار فایل‌های فرانت‌اند و index.html
app.use(express.static(path.join(__dirname)));

// مسیر فایل پایگاه داده برای جلوگیری از صفر شدن موجودی‌ها
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

// API دریافت اطلاعات و موجودی کاربر
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
console.log('Server is running on port ' + PORT);
});
