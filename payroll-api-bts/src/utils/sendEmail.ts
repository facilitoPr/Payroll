import nodemailer from "nodemailer";

export const sendEmail = async ({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: '"Blue Technology Solution" <facilitopr@gmail.com>',
      to,
      subject,
      html,
    });

    return true;
  } catch (error) {
    console.error("Error sending email: ", error);
    return false;
  }
};
