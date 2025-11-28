const nodemailer = require('nodemailer');
require('dotenv').config();
const cache = require('../utils/cache');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'false', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD
    },
    tls: {
        rejectUnauthorized: false
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
                    <p>Thank you for registering for the MAZ Superbrand Awards 2025!</p>

                    <div class="lucky-number">
                        Your Lucky Number: ${guest.lucky_number || 'N/A'}
                    </div>

                    <p>Here are your registration details:</p>
                    <ul>
                        <li><strong>Name:</strong> ${guest.name} ${guest.surname}</li>
                        <li><strong>Email:</strong> ${guest.email}</li>
                        <li><strong>Phone:</strong> ${guest.phone}</li>
                        <li><strong>Company:</strong> ${guest.company_name || 'N/A'}</li>
                        <li><strong>Position:</strong> ${guest.position || 'N/A'}</li>
                        <li><strong>Table Number:</strong> ${guest.table_number || 'Will be assigned'}</li>
                    </ul>
                    <p><strong>Keep your lucky number safe!</strong> It will be used for raffle draws during the event.</p>
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

// const sendRegistrationEmail = async (guest) => {

    async function sendRegistrationEmail(guest) {

        const { email } = guest;
        const cacheKey = `email:${email}`;

        console.time(`Email processing for ${email}`);

    // Check if we've sent an email to this address recently (rate limiting)
    if (cache.get(cacheKey)) {
        console.log(`Email already sent to ${email} recently, skipping`);
        return;
    }


    try {
        const mailOptions = {
            from: `"MAZ Superbrand Awards" <${process.env.SMTP_FROM_EMAIL || 'no-reply@marytechenock.com'}>`,
            to: guest.email,
            subject: 'Registration Confirmation - MAZ Superbrand Awards 2025',
            html: getEmailTemplate(guest),
            bcc: process.env.ADMIN_EMAIL || 'info@marytechenock.com'
        };

        cache.set(cacheKey, true, 60 * 60 * 1000); // Cache for an hour
        const info = await transporter.sendMail(mailOptions);

        // Use promise with timeout
        // const emailPromise = transporter.sendMail(mailOptions);
        // const timeoutPromise = new Promise((_, reject) =>
        //     setTimeout(() => reject(new Error('Email timeout')), 10000)
        // );

        // await Promise.race([emailPromise, timeoutPromise]);

        console.timeEnd('Email sending');
        console.timeEnd(`Email processing for ${email}`);
        console.log('Email sent successfully to:', email);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        // Remove from cache on failure to allow retry
        cache.delete(cacheKey);
        console.timeEnd(`Email processing for ${email} (failed)`);
        return false;
    }
};

module.exports = {
    sendRegistrationEmail
};
