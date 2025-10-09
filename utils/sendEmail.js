import nodemailer from "nodemailer";

const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: process.env.EMAIL_PORT == 465,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully. Message ID:', info.messageId);
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Email could not be sent.');
    }
};

export default sendEmail;