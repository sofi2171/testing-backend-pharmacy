const express = require('express');
const SibApiV3Sdk = require('sib-api-v3-sdk');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// --- BREVO CONFIGURATION (SECURE) ---
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];

// Render Dashboard mein iska naam 'BREVO_API_KEY' hona chahiye
apiKey.apiKey = process.env.BREVO_API_KEY; 

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

// Root Route - Server status check karne ke liye
app.get('/', (req, res) => {
    res.send(`
        <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
            <h1 style="color: #0092ff;">PharmPro Backend is Secure! ✅</h1>
            <p style="color: #555;">Server is running and ready to send emails.</p>
        </div>
    `);
});

/**
 * 1. Welcome Email API
 */
app.post('/api/welcome-email', async (req, res) => {
    const { email, userName } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, error: "Email is required" });
    }

    let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.subject = "Welcome to PharmPro";
    sendSmtpEmail.htmlContent = `
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
                    <h2 style="color: #2563eb;">Hello ${userName || 'User'}!</h2>
                    <p>Welcome to <b>PharmPro</b>. Your professional pharmacy management account has been created successfully.</p>
                    <p>You can now manage your inventory, track sales, and get real-time alerts.</p>
                    <br>
                    <p style="font-size: 12px; color: #777;">Regards,<br>PharmPro Team</p>
                </div>
            </body>
        </html>`;
    sendSmtpEmail.sender = { "name": "PharmPro Support", "email": "sufiangsufiang15@gmail.com" };
    sendSmtpEmail.to = [{ "email": email }];

    try {
        await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log(`✅ Welcome mail sent to: ${email}`);
        res.status(200).json({ success: true, message: "Welcome email sent" });
    } catch (error) {
        console.error("❌ Brevo Welcome Error:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * 2. Stock Alert API
 */
app.post('/api/stock-alert', async (req, res) => {
    const { email, itemName, currentQty } = req.body;

    if (!email || !itemName) {
        return res.status(400).json({ success: false, error: "Missing details" });
    }

    let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.subject = `⚠️ Low Stock Alert: ${itemName}`;
    sendSmtpEmail.htmlContent = `
        <html>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
                <div style="background-color: #fff5f5; border-left: 5px solid #c53030; padding: 20px;">
                    <h2 style="color: #c53030; margin-top: 0;">Critical Stock Warning!</h2>
                    <p>This is an automated alert for your inventory.</p>
                    <p>Item: <b style="font-size: 18px;">${itemName}</b></p>
                    <p>Current Quantity: <b style="color: #c53030;">${currentQty}</b></p>
                    <p>Please restock this item immediately to avoid out-of-stock situations.</p>
                </div>
            </body>
        </html>`;
    sendSmtpEmail.sender = { "name": "PharmPro Alerts", "email": "sufiangsufiang15@gmail.com" };
    sendSmtpEmail.to = [{ "email": email }];

    try {
        await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log(`⚠️ Alert sent for: ${itemName}`);
        res.status(200).json({ success: true, message: "Stock alert sent" });
    } catch (error) {
        console.error("❌ Brevo Alert Error:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Secure Server running on port ${PORT}`);
});
