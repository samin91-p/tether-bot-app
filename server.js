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
"6559439220": { balance: 67.44, totalDeposited: 20.00, totalWithdrawn: 0.00, refCount: 0, voucherCount: 0, lastClaimDate: null }
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

app.get('/api/user', (req, res) => {
const userId = req.query.userId || '6559439220';
const db = readDatabase();

if (!db[userId]) {
db[userId] = {
balance: 0.00,
totalDeposited: 0.00,
totalWithdrawn: 0.00,
refCount: 0,
voucherCount: 0,
lastClaimDate: null
};
saveDatabase(db);
}

const today = new Date().toISOString().split('T')[0];
const alreadyClaimedToday = db[userId].lastClaimDate === today;
const totalDeposited = db[userId].totalDeposited || 0;
const totalWithdrawn = db[userId].totalWithdrawn || 0;

const maxTotalWithdrawAllowed = totalDeposited * 0.5;
const remainingWithdrawLimit = Math.max(0, maxTotalWithdrawAllowed - totalWithdrawn);

res.json({
userId: userId,
balance: db[userId].balance,
totalDeposited: totalDeposited,
totalWithdrawn: totalWithdrawn,
refCount: db[userId].refCount,
voucherCount: db[userId].voucherCount,
canWithdraw: totalDeposited >= 20.00 && remainingWithdrawLimit > 0,
maxWithdrawLimit: remainingWithdrawLimit,
alreadyClaimedToday: alreadyClaimedToday
});
});

// درخواست واریز کاربر که برای ادمین جهت تایید می‌فرستد
app.post('/api/deposit-request', (req, res) => {
const { userId, amount, txid } = req.body;
if (!amount || amount <= 0) {
return res.json({ success: false, message: 'مقدار واریز نامعتبر است.' });
}

// ارسال دکمه تایید به ادمین
bot.sendMessage(ADMIN_CHAT_ID, `📥 *درخواست واریز جدید*\n\n👤 User ID: \`${userId}\`\n💰 Amount: *${amount} USDT*\n🔗 TXID / Info:\n\`${txid || 'ندارد'}\``, {
parse_mode: 'Markdown',
reply_markup: {
inline_keyboard: [
[
{ text: '✅ تایید و واریز به حساب', callback_data: `approve_dep_${userId}_${amount}` },
{ text: '❌ رد', callback_data: `reject_dep_${userId}` }
]
]
}
});

res.json({ success: true });
});

app.post('/api/claim-daily', (req, res) => {
const { userId } = req.body;
const db = readDatabase();
if (!db[userId]) return res.json({ success: false, message: 'User not found' });

if (db[userId].totalDeposited < 20.00) {
return res.json({ success: false, message: 'حداقل واریز برای دریافت پاداش ۲۰ تتر است.' });
}

const today = new Date().toISOString().split('T')[0];
if (db[userId].lastClaimDate === today) {
return res.json({ success: false, message: 'شما امروز پاداش خود را دریافت کرده‌اید.' });
}

db[userId].balance += 1.00;
db[userId].lastClaimDate = today;
saveDatabase(db);
res.json({ success: true, newBalance: db[userId].balance });
});

app.post('/api/withdraw', (req, res) => {
const { userId, amount, userWallet } = req.body;
const db = readDatabase();
if (!db[userId]) return res.json({ success: false, message: 'User not found' });

const user = db[userId];
if ((user.totalDeposited || 0) < 20.00) {
return res.json({ success: false, message: 'برای فعال شدن برداشت باید حداقل ۲۰ تتر واریز کرده باشید.' });
}

const maxTotalWithdrawAllowed = user.totalDeposited * 0.5;
const remainingLimit = maxTotalWithdrawAllowed - (user.totalWithdrawn || 0);

if (amount > remainingLimit) {
return res.json({ success: false, message: `شما فقط می‌توانید تا سقف ${remainingLimit.toFixed(2)} تتر دیگر برداشت کنید.` });
}

if (amount > user.balance) {
return res.json({ success: false, message: 'موجودی حساب شما کافی نیست.' });
}

user.balance -= amount;
user.totalWithdrawn = (user.totalWithdrawn || 0) + amount;
saveDatabase(db);

bot.sendMessage(ADMIN_CHAT_ID, `🚨 *درخواست برداشت جدید*\n\n👤 User ID: \`${userId}\`\n💰 Amount: *${amount} USDT*\n📥 Destination Wallet:\n\`${userWallet}\``, { parse_mode: 'Markdown' });

res.json({ success: true, newBalance: user.balance });
});

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

app.get('/api/deposit', (req, res) => {
res.json({
status: 'success',
address: MY_WALLET_ADDRESS,
network: 'BEP20 (USDT)'
});
});

bot.on('callback_query', async (query) => {
const chatId = query.message.chat.id.toString();
const data = query.data;
const db = readDatabase();

try { await bot.answerCallbackQuery(query.id); } catch (e) {}

if (data.startsWith('approve_dep_')) {
const parts = data.split('_');
const targetUserId = parts[2];
const amount = parseFloat(parts[3]);

if (db[targetUserId]) {
db[targetUserId].totalDeposited = (db[targetUserId].totalDeposited || 0) + amount;
db[targetUserId].balance = (db[targetUserId].balance || 0) + amount;
saveDatabase(db);

bot.sendMessage(targetUserId, `✅ واریز مبلغ *${amount} USDT* شما توسط ادمین تایید و به موجودی اضافه شد!`, { parse_mode: 'Markdown' });
bot.editMessageText(`✅ *واریز تایید شد*\nمبلغ ${amount} به کاربر ${targetUserId} اضافه شد.`, {
chat_id: chatId,
message_id: query.message.message_id,
parse_mode: 'Markdown'
});
}
} else if (data.startsWith('reject_dep_')) {
const targetUserId = data.split('_')[2];
bot.sendMessage(targetUserId, `❌ درخواست واریز شما توسط ادمین رد شد.`, { parse_mode: 'Markdown' });
bot.editMessageText(`❌ *واریز رد شد*`, {
chat_id: chatId,
message_id: query.message.message_id,
parse_mode: 'Markdown'
});
}
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
console.log('Server and Bot are running on port ' + PORT);
});
