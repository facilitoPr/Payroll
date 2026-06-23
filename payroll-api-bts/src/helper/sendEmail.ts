// src/helpers/sendEmail.ts
import nodemailer from "nodemailer";

interface SendEmailOptions {
  to: string | string[]; // Destinatario(s)
  subject: string; // Asunto
  html?: string; // Cuerpo en HTML
  text?: string; // Cuerpo en texto plano (opcional)
  fromName?: string;
}

let transporter: nodemailer.Transporter | null = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    throw new Error(
      "EMAIL_USER o EMAIL_PASS no están configurados en las variables de entorno."
    );
  }

  transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // true para 465, false para 587
    auth: {
      user,
      pass,
    },
  });

  return transporter;
};

export const sendEmail = async (opts: SendEmailOptions): Promise<boolean> => {
  try {
    const transporter = getTransporter();

    const fromName =
      opts.fromName ||
      process.env.EMAIL_FROM_NAME ||
      "Notificaciones del sistema";

    const mailOptions: nodemailer.SendMailOptions = {
      from: `"${fromName}" <${process.env.EMAIL_USER}>`,
      to: Array.isArray(opts.to) ? opts.to.join(",") : opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Correo enviado:", info.messageId);

    return true;
  } catch (error) {
    console.error("Error al enviar correo:", error);
    return false;
  }
};
