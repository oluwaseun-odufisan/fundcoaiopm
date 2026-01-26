import nodemailer from 'nodemailer';
import validator from 'validator';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Ensure this is an App Password for Gmail
    },
});

const sendEmail = async ({ to, subject, text }) => {
    if (!to || !validator.isEmail(to)) {
        console.error(`Invalid email address: ${to}`);
        throw new Error('Invalid or missing email address');
    }

    console.log(`Attempting to send email to ${to} with subject "${subject}"`);
    try {
        await transporter.verify(); // Verify SMTP connection
        const info = await transporter.sendMail({
            from: `"T Manager" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
        });
        console.log(`Email successfully sent to ${to}: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error(`Failed to send email to ${to}:`, error.message, error.stack);
        throw new Error(`Failed to send email: ${error.message}`);
    }
};

export { sendEmail };