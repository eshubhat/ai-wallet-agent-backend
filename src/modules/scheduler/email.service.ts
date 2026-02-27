import nodemailer from 'nodemailer';

// Create a transporter using standard SMTP (or Gmail for dev)
// If credentials belong to a real email, they should be in .env
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER || 'test@ethereal.email',
        pass: process.env.SMTP_PASS || 'password'
    }
});

export const sendTaskTriggeredEmail = async (toEmail: string, taskLabel: string) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM || '"AutoFi" <agent@autofi.work>',
            to: toEmail,
            subject: `Action Required: Scheduled Task Triggered`,
            text: `Your scheduled task "${taskLabel}" has met its condition and is ready to be executed!\n\nPlease log in to your dashboard to confirm and sign the transaction.\n\n— AutoFi`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Task Triggered</h2>
                    <p>Your scheduled task has met its condition and is ready to be executed:</p>
                    <div style="background: #f4f4f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
                        <strong>${taskLabel}</strong>
                    </div>
                    <p>Because you control your own wallet keys, the AI agent cannot sign the transaction for you. Please log in to your dashboard to confirm and sign.</p>
                    <div style="margin-top: 24px;">
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:5174'}" style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Go to Dashboard</a>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[Email] Alert sent to ${toEmail} for task "${taskLabel}". MsgID: ${info.messageId}`);
    } catch (error) {
        console.error(`[Email] Failed to send trigger alert to ${toEmail}:`, error);
    }
};
