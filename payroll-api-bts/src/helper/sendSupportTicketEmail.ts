import { transporter } from "../config/nodemailer";

type SendSupportTicketEmailParams = {
  ticketId: string;
  title: string;
  description: string;
  priority: string;
  userName: string;
  userEmail: string;
};

export const sendSupportTicketEmail = async ({
  ticketId,
  title,
  description,
  priority,
  userName,
  userEmail,
}: SendSupportTicketEmailParams) => {

  const supportEmail = process.env.SUPPORT_EMAIL || "info@bluetechnologysolution.com";

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: supportEmail,
    subject: `Nuevo ticket de soporte - ${title}`,
    html: `
      <div style="font-family: Arial, sans-serif; font-size: 14px; color: #111;">
        <h2>Nuevo ticket de soporte</h2>
        <p><strong>ID:</strong> ${ticketId}</p>
        <p><strong>Título:</strong> ${title}</p>
        <p><strong>Prioridad:</strong> ${priority}</p>
        <p><strong>Usuario:</strong> ${userName}</p>
        <p><strong>Correo:</strong> ${userEmail}</p>
        <p><strong>Descripción:</strong></p>
        <div style="padding: 12px; background: #f5f5f5; border-radius: 8px;">
          ${description.replace(/\n/g, "<br/>")}
        </div>
      </div>
    `,
  });
};