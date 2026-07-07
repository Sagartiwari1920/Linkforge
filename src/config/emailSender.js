const { BrevoClient } = require("@getbrevo/brevo");

const brevo = new BrevoClient({
    apiKey: process.env.BREVO_API_KEY
});

async function sendMail({ to, subject, text }) {
    await brevo.transactionalEmails.sendTransacEmail({
        sender: { email: process.env.GMAIL_USER, name: "LinkForge" },
        to: [{ email: to }],
        subject,
        textContent: text
    });
}

module.exports = { sendMail };