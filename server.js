const express = require('express'); // Fixed 'Const' to 'const'
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

// --- BREVO CONFIGURATION ---
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY; 

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

// Root Route
app.get('/', (req, res) => {
    res.send(`<h1 style="text-align:center; margin-top:50px; color:#2563eb;">PharmPro API is Live! ✅</h1>`);
});

/**
 * 1. SIGNUP / WELCOME EMAIL API
 */
app.post('/api/welcome-email', async (req, res) => {
    const { email, userName } = req.body;
    console.log(`📩 Welcome Email Request for: ${email}`); // LOG ADDED

    if (!email) return res.status(400).json({ success: false, error: "Email missing" });

    let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.subject = "🚀 Welcome to PharmPro - Account Activated!";
    sendSmtpEmail.htmlContent = `<html><body style="font-family: Arial; padding: 20px;"><h2>Hello, ${userName || 'Pharmacist'}!</h2><p>Your account is active.</p></body></html>`;
    sendSmtpEmail.sender = { "name": "PharmPro Support", "email": "sufiangsufiang15@gmail.com" };
    sendSmtpEmail.to = [{ "email": email }];

    try {
        await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log(`✅ SUCCESS: Welcome email sent to ${email}`); // LOG ADDED
        res.status(200).json({ success: true, message: "Welcome email sent" });
    } catch (error) {
        console.error("❌ ERROR (Welcome):", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * 2. SMART STOCK & EXPIRY ALERTS API
 */
app.post('/api/stock-alert', async (req, res) => {
    const { email, itemName, currentQty, type } = req.body;
    
    // Yahan log lazmi aayega taake pata chale request aayi hai
    console.log(`🔔 Alert Triggered | Type: ${type} | Item: ${itemName} | Target: ${email}`);

    if (!email || !itemName) {
        console.log("⚠️ Alert failed: Missing details in request body");
        return res.status(400).json({ success: false, error: "Missing details" });
    }

    // Default Settings (Low Stock)
    let subject = `⚠️ Low Stock Alert: ${itemName}`;
    let title = "Stock Warning";
    let icon = "⚠️";
    let bgColor = "#fff5f5";
    let borderColor = "#f87171";
    let mainMessage = `The item <b>${itemName}</b> is running low. Current quantity: <b style="color: #ef4444;">${currentQty}</b>.`;

    // Overwrite for Expiry
    if (type === 'AUTO_REMOVED_EXPIRED') {
        subject = `🚫 Expired Medicine Removed: ${itemName}`;
        title = "Expiry Removal Alert";
        icon = "🚫";
        bgColor = "#f8fafc";
        borderColor = "#6366f1";
        mainMessage = `Security Alert: The medicine <b>${itemName}</b> has reached its expiry date and has been <b>automatically removed</b> for safety.`;
    } 
    else if (currentQty <= 0 || type === 'OUT_OF_STOCK') {
        subject = `❌ Out of Stock: ${itemName}`;
        title = "Zero Stock Alert";
        icon = "❌";
        mainMessage = `The item <b>${itemName}</b> is now completely <b>Out of Stock</b>.`;
    }

    let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = `
        <html>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
                <div style="max-width: 600px; margin: auto; background-color: ${bgColor}; border-left: 6px solid ${borderColor}; padding: 30px; border-radius: 8px;">
                    <div style="font-size: 40px;">${icon}</div>
                    <h2 style="color: #1e293b; margin-top: 10px;">${title}</h2>
                    <p style="font-size: 16px; color: #475569;">${mainMessage}</p>
                </div>
            </body>
        </html>`;
    
    sendSmtpEmail.sender = { "name": "PharmPro Alerts", "email": "sufiangsufiang15@gmail.com" };
    sendSmtpEmail.to = [{ "email": email }];

    try {
        await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log(`✅ SUCCESS: ${type} email sent for ${itemName}`); // LOG FOR DASHBOARD
        res.status(200).json({ success: true, message: "Alert email sent" });
    } catch (error) {
        console.error("❌ ERROR (Alert):", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server Running | Port: ${PORT} | Time: ${new Date().toLocaleString()}`);
});
