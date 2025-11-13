const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
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
                    <p>Thank you for registering for the MAZ Superbrand Awards 2025!</p>
                    <p>Here are your registration details:</p>
                    <ul>
                        <li><strong>Name:</strong> ${guest.name} ${guest.surname}</li>
                        <li><strong>Email:</strong> ${guest.email}</li>
                        <li><strong>Phone:</strong> ${guest.phone}</li>
                        <li><strong>Company:</strong> ${guest.company_name || 'N/A'}</li>
                        <li><strong>Position:</strong> ${guest.position || 'N/A'}</li>
                        <li><strong>Table Number:</strong> ${guest.table_number || 'Will be assigned'}</li>
                    </ul>
                    <p>We look forward to seeing you at the event!</p>
                </div>
                <div class="footer">
                    <p>If you have any questions, please contact us at info@marytechenock.com</p>
                    <p>© 2025 MAZ Superbrand Awards. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;
};

const sendRegistrationEmail = async (guest) => {
    try {
        const mailOptions = {
            from: `"MAZ Superbrand Awards" <${process.env.SMTP_FROM_EMAIL || 'no-reply@marytechenock.com'}>`,
            to: guest.email,
            subject: 'Registration Confirmation - MAZ Superbrand Awards 2025',
            html: getEmailTemplate(guest),
            bcc: process.env.ADMIN_EMAIL || 'info@marytechenock.com'
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: %s', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send confirmation email');
    }
};

module.exports = {
    sendRegistrationEmail
};
