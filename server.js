message.chat.id;
  const data = query.data;

  if (data === 'deposit') {
    const text = 💳 *Deposit USDT (BEP-20)*\n\nSend your deposit to the following BEP-20 address:\n\n\`${MY_WALLET_ADDRESS}\`\n\n_Note: Minimum deposit is 20 USDT._;
    bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
  }

  if (data === 'dashboard') {
    db.get('SELECT total_deposit, balance FROM users WHERE id = ?', [chatId], (err, user) => {
      if (user) {
        const dailyProfit = Math.floor(user.total_deposit / 20) * 1;
        const text = 📊 *User Dashboard*\n\n💰 Total Deposit: *${user.total_deposit} USDT*\n📈 Daily Profit: *${dailyProfit} USDT/day*\n💵 Available Balance: *${user.balance} USDT*;
        bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      }
    });
  }

  if (data === 'referral') {
    bot.getMe().then((botInfo) => {
      const refLink = https://t.me/${botInfo.username}?start=${chatId};
      bot.sendMessage(chatId, 👥 *Your Referral Link:*\n\n\`${refLink}\`, { parse_mode: 'Markdown' });
    });
  }
});

// اجرای سرور روی پورت رندر
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('Server and Bot are running on port ' + PORT);
});
