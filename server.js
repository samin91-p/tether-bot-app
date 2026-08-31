const express = require('express');
const path = require('path');
const cors = require('cors'); // فعال کردن اجازه دسترسی از مینی‌اپ
const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors()); // اجازه دادن به درخواست‌های مینی‌اپ
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// مسیر ساخت فاکتور با مبلغ اعشاری اختصاصی
app.post('/api/create-invoice', (req, res) => {
    try {
        const { userId, baseAmount } = req.body;
        
        // تولید یک رقم اعشاری رندوم کوچک (مثلاً 0.45) برای تشخیص خودکار واریزی کاربر
        const randomCents = (Math.floor(Math.random() * 90) + 10) / 100; // عددی بین 0.10 تا 0.99
        const amountToPay = (parseFloat(baseAmount || 20) + randomCents).toFixed(2);
        
        // آدرس ولت ثابت شما (می‌توانید آدرس خودتان را اینجا بگذارید)
        const walletAddress = "0xDdaE2e4e81A39C4E68faFAfd8b6aa05192f7A123";

        res.json({
            success: true,
            walletAddress: walletAddress,
            amountToPay: amountToPay,
            message: "Invoice created successfully"
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
   console.log(`Server is running on port ${PORT}`);
});
