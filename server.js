const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const usersDB = {};

app.post('/api/user-data', (req, res) => {
  const { userId, firstName } = req.body;
  if (!userId) return res.status(400).json({ error: 'User ID is required' });

  if (!usersDB[userId]) {
    usersDB[userId] = {
      id: userId,
      name: firstName || 'کاربر',
      balance: 0.00,
      hasDeposited20: false,
      depositDate: null,
      lastClaimDate: null
    };
  }
  res.json(usersDB[userId]);
});

app.post('/api/claim-daily', (req, res) => {
  const { userId } = req.body;
  const user = usersDB[userId];

  if (!user) return res.status(404).json({ error: 'User not found' });
  if (!user.hasDeposited20) return res.status(403).json({ error: 'نیازمند واریز حداقل ۲۰ تتر است.' });

  const today = new Date().toDateString();
  if (user.lastClaimDate === today) {
    return res.status(400).json({ error: 'پاداش امروز قبلاً دریافت شده است.' });
  }

  user.balance += 1.00;
  user.lastClaimDate = today;
  res.json({ success: true, balance: user.balance, message: '۱ تتر اضافه شد!' });
});

app.listen(3000, () => console.log('🛡️ Server running securely on port 3000'));