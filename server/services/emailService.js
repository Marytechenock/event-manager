const nodemailer = require('nodemailer');
require('dotenv').config();

const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpSecurity = (process.env.SMTP_SECURITY || '').toLowerCase();
const smtpSecure =
    process.env.SMTP_SECURE === 'true' ||
    smtpPort === 465 ||
    smtpSecurity.includes('ssl') ||
    smtpSecurity.includes('smtps');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD
    }
});

const getEmailTemplate = (guest) => {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #f8f9fa; padding: 20px; text-align: center; }
                .content { padding: 20px; }
                .lucky-number {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 15px;
                    text-align: center;
                    margin: 20px 0;
                    border-radius: 8px;
                    font-size: 24px;
                    font-weight: bold;
                }
                .footer { margin-top: 20px; font-size: 0.9em; color: #666; text-align: center; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Registration Confirmation</h1>
                    <p>MAZ Superbrand Awards 2025</p>
                </div>
                <div class="content">
                    <p>Hello ${guest.name} ${guest.surname},</p>
                    <p>Thank you for registering for the MAZ Superbrand Business Banquet 2026!</p>



                    <p>Here are your registration details:</p>
                    <ul>
                        <li><strong>Name:</strong> ${guest.name} ${guest.surname}</li>
                        <li><strong>Email:</strong> ${guest.email}</li>
                        <li><strong>Phone:</strong> ${guest.phone}</li>
                        <li><strong>Organisation:</strong> ${guest.company_name || 'N/A'}</li>
                        <li><strong>Position:</strong> ${guest.position || 'N/A'}</li>
                        <li><strong>Table Number:</strong> ${guest.table_number || 'Will be assigned'}</li>
                    </ul>

                    <p>We look forward to seeing you at the event!</p>
                </div>
                <div class="footer">
                    <p>If you have any questions, please contact us at info@marytechenock.com</p>
                    <p>© 2026 MAZ Superbrand Business Banquet. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;
};

const sendRegistrationEmail = async (guest) => {
    try {
        const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USERNAME;
        const mailOptions = {
            from: `"MAZ Superbrand Business Banquet" <${fromEmail}>`,
            to: guest.email,
            subject: 'Registration Confirmation - MAZ Superbrand Awards 2025',
            html: getEmailTemplate(guest),
            bcc: process.env.ADMIN_EMAIL || 'info@marytechenock.com'
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: %s', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending email:', {
            message: error.message,
            code: error.code,
            command: error.command,
            response: error.response
        });
        throw new Error('Failed to send confirmation email');
    }
};

module.exports = {
    sendRegistrationEmail
};
