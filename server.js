const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let userBalances = {};

app.get('/api/user/:id', (req, res) => {
    const id = req.params.id || '123456';
    if (!userBalances[id]) userBalances[id] = 0;
    res.json({ balance: userBalances[id] });
});

app.post('/api/claim', (req, res) => {
    const id = req.body.userId || '123456';
    if (!userBalances[id]) userBalances[id] = 0;
    userBalances[id] += 1;
    res.json({ success: true, newBalance: userBalances[id] });
});

app.listen(PORT, () => console.log('Server running on port ' + PORT));
