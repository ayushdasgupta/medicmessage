import nodemailer from "nodemailer";
export const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        port: 465,
        secure: true,
        // logger:true,
        // debug:true,
        secureConnection: false,
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
        },
        tls: {
            rejectUnauthorized: true
        }
    });

    const mailOptions = {
        from: {
            name: "MedicaPro",
            address: process.env.MAIL_USER
        },
        to: options.email,
        subject: options.subject,
        html: options.html,
    };

    await transporter.sendMail(mailOptions);
};

