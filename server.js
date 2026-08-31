const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const MONGO_URI = 'mongodb+srv://saminjorj_db_user:nVETBguTpDjpj3u5@cluster0.gb7umvk.mongodb.net/tetherbot?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB Connected Successfully'))
    .catch(err => console.error('MongoDB Connection Error:', err));

const userSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    balance: { type: Number, default: 0 }
});

const User = mongoose.model('User', userSchema);

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/user/:id', async (req, res) => {
    try {
        let id = req.params.id;
        if (!id || id === 'undefined') id = '123456';
        
        let user = await User.findOne({ userId: id });
        if (!user) {
            user = await User.create({ userId: id, balance: 0 });
        }
        res.json({ balance: user.balance });
    } catch (err) {
        res.status(500).json({ balance: 0, error: err.message });
    }
});

app.post('/api/claim', async (req, res) => {
    try {
        let id = req.body.userId;
        if (!id || id === 'undefined') id = '123456';

        let user = await User.findOne({ userId: id });
        if (!user) {
            user = await User.create({ userId: id, balance: 0 });
        }
        user.balance += 1;
        await user.save();
        res.json({ success: true, newBalance: user.balance });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.listen(PORT, () => console.log('Server running on port ' + PORT));
