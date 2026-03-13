const express = require('express');
const SibApiV3Sdk = require('sib-api-v3-sdk');
const cors = require('cors');
const axios = require('axios'); // Auto-ping ke liye axios install karna hoga

const app = express();

app.use(cors({ origin: '*', methods: ['GET', 'POST'], allowedHeaders: ['Content-Type'] }));
app.use(express.json());

// --- BREVO CONFIG ---
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY; 
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

const BRAND_COLOR = "#2563eb";
const FOOTER_TEXT = "© 2026 PharmPro Cloud Solutions. All rights reserved.";

// --- AUTO-PING SYSTEM (KEEP-ALIVE) ---
const SERVER_URL = process.env.SERVER_URL || `http://localhost:3000`;

const keepAlive = () => {
    setInterval(async () => {
        try {
            console.log(`📡 Auto-Ping: Maintaining Server Connection at ${new Date().toLocaleTimeString()}...`);
            await axios.get(`${SERVER_URL}/ping`);
        } catch (err) {
            console.error("⚠️ Ping Failed: Server might be offline or URL is wrong.");
        }
    }, 840000); // Har 14 minutes baad ping karega
};

// Ping Endpoint
app.get('/ping', (req, res) => {
    res.status(200).send("PONG! 🏓");
});

app.get('/', (req, res) => {
    res.send(`<h1 style="text-align:center; margin-top:50px; color:#2563eb; font-family:sans-serif;">PharmPro API is Live! ✅</h1><p style="text-align:center;">Uptime monitoring active.</p>`);
});

/**
 * 1. SIGNUP / WELCOME EMAIL
 */
app.post('/api/welcome-email', async (req, res) => {
    const { email, userName } = req.body;
    if (!email) return res.status(400).json({ success: false, error: "Email missing" });

    let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.subject = "🚀 Welcome to PharmPro - Dashboard Access Granted!";
    sendSmtpEmail.htmlContent = `
        <html>
            <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f7fa; padding: 40px 20px;">
                <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                    <div style="background-color: ${BRAND_COLOR}; padding: 30px; text-align: center; color: white;">
                        <h1 style="margin: 0;">PharmPro Cloud</h1>
                    </div>
                    <div style="padding: 40px 30px;">
                        <h2>Hi ${userName || 'Pharmacist'},</h2>
                        <p style="font-size: 16px; color: #475569; line-height: 1.6;">Your pharmacy management account is now live. Start tracking your inventory and sales professionally.</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="#" style="background: ${BRAND_COLOR}; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to Dashboard</a>
                        </div>
                    </div>
                    <div style="background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b;">${FOOTER_TEXT}</div>
                </div>
            </body>
        </html>`;
    
    sendSmtpEmail.sender = { "name": "PharmPro Support", "email": "sufiangsufiang15@gmail.com" };
    sendSmtpEmail.to = [{ "email": email }];

    try {
        await apiInstance.sendTransacEmail(sendSmtpEmail);
        res.status(200).json({ success: true });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

/**
 * 2. SMART STOCK & EXPIRY ALERTS
 */
app.post('/api/stock-alert', async (req, res) => {
    const { email, itemName, currentQty, type } = req.body;
    let config = { subject: `⚠️ Stock Alert: ${itemName}`, title: "Inventory Warning", color: "#f59e0b", msg: "Item is below threshold." };

    if (type === 'AUTO_REMOVED_EXPIRED') {
        config = { subject: `🚫 Safety Alert: Expiry Removal`, title: "Expiry Action Taken", color: "#ef4444", msg: "Expired stock has been auto-removed." };
    } else if (currentQty <= 0) {
        config = { subject: `❌ Out of Stock: ${itemName}`, title: "Zero Stock Alert", color: "#dc2626", msg: "This item is now unavailable." };
    }

    let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.subject = config.subject;
    sendSmtpEmail.htmlContent = `
        <html>
            <body style="font-family: sans-serif; background-color: #f8fafc; padding: 20px;">
                <div style="max-width: 500px; margin: auto; background: #ffffff; border-radius: 10px; border-top: 6px solid ${config.color}; padding: 30px;">
                    <h2 style="color: #1e293b;">${config.title}</h2>
                    <p style="color: #475569;">${config.msg}</p>
                    <div style="background: #f1f5f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Item:</strong> ${itemName}</p>
                        <p><strong>Quantity:</strong> <span style="color:${config.color}">${currentQty}</span></p>
                    </div>
                </div>
            </body>
        </html>`;
    
    sendSmtpEmail.sender = { "name": "PharmPro Alerts", "email": "sufiangsufiang15@gmail.com" };
    sendSmtpEmail.to = [{ "email": email }];

    try {
        await apiInstance.sendTransacEmail(sendSmtpEmail);
        res.status(200).json({ success: true });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server Running on Port: ${PORT}`);
    keepAlive(); // Server start hote hi auto-ping active
});
