import { Response } from "express";
import { AuthRequest } from "../middlewares/validate-jwt";
import SupportTicket from "../model/supportTicket";
import { sendSupportTicketEmail } from "../helper/sendSupportTicketEmail";

const createSupportTicket = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const systemId = req.user?.systemId || null;

    const { title, description, priority } = req.body;

    const newTicket = new SupportTicket({
      title,
      description,
      priority: priority || "MEDIUM",
      user: userId,
      system: systemId || null,
      status: "OPEN",
    });

    await newTicket.save();

    let emailSent = false;

    try {
      await sendSupportTicketEmail({
        ticketId: String(newTicket._id),
        title: newTicket.title,
        description: newTicket.description,
        priority: newTicket.priority,
        userName: req.user?.name || "Usuario",
        userEmail: req.user?.email || "Sin correo",
      });

      newTicket.emailSent = true;
      newTicket.emailSentAt = new Date();
      await newTicket.save();

      emailSent = true;
    } catch (emailError) {
      console.error("Error sending support email:", emailError);
    }

    return res.status(201).json({
      ok: true,
      mensaje: emailSent
        ? "Solicitud de soporte creada y correo enviado con éxito"
        : "Solicitud de soporte creada con éxito, pero no se pudo enviar el correo",
      ticket: newTicket,
    });
  } catch (error) {
    console.error("createSupportTicket error:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error al crear la solicitud de soporte",
    });
  }
};

const getMySupportTickets = async (req: AuthRequest, res: Response) => {
  try {
    const userId =  req.user?._id;

    const {
      limit = "20",
      initial = "0",
      status = "",
      priority = "",
      text = "",
    } = req.query;

    const limitNum = Number(limit) || 20;
    const initialNum = Number(initial) || 0;

    const query: any = {
      user: userId,
      isDeleted: false,
    };

    if (status) {
      query.status = String(status);
    }

    if (priority) {
      query.priority = String(priority);
    }

    if (text) {
      query.$or = [
        { title: { $regex: String(text), $options: "i" } },
        { description: { $regex: String(text), $options: "i" } },
      ];
    }

    const [tickets, total] = await Promise.all([
      SupportTicket.find(query)
        .sort({ createdAt: -1 })
        .skip(initialNum)
        .limit(limitNum),
      SupportTicket.countDocuments(query),
    ]);

    return res.status(200).json({
      ok: true,
      tickets,
      total,
      mensaje: "Tickets obtenidos con éxito",
    });
  } catch (error) {
    console.error("getMySupportTickets error:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error al obtener los tickets de soporte",
    });
  }
};

const getSupportTicketById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const { id } = req.params;

    const ticket = await SupportTicket.findOne({
      _id: id,
      user: userId,
      isDeleted: false,
    }).populate("user")

    if (!ticket) {
      return res.status(404).json({
        ok: false,
        mensaje: "Ticket no encontrado",
      });
    }

    return res.status(200).json({
      ok: true,
      ticket,
      mensaje: "Ticket obtenido con éxito",
    });
  } catch (error) {
    console.error("getSupportTicketById error:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error al obtener el ticket",
    });
  }
};

const getAllSupportTickets = async (req: AuthRequest, res: Response) => {
  try {
    const {
      limit = "20",
      initial = "0",
      status = "",
      priority = "",
      text = "",
      user = "",
    } = req.query;

    const limitNum = Number(limit) || 20;
    const initialNum = Number(initial) || 0;

    const query: any = {
      isDeleted: false,
    };

    if (status) {
      query.status = String(status);
    }

    if (priority) {
      query.priority = String(priority);
    }

    if (user) {
      query.$or = [
        { userNameSnapshot: { $regex: String(user), $options: "i" } },
        { userEmailSnapshot: { $regex: String(user), $options: "i" } },
      ];
    }

    if (text) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { title: { $regex: String(text), $options: "i" } },
          { description: { $regex: String(text), $options: "i" } },
          { responseMessage: { $regex: String(text), $options: "i" } },
        ],
      });
    }

    const [tickets, total] = await Promise.all([
      SupportTicket.find(query)
        .populate("user", "name email img jobPosition rol")
        .sort({ createdAt: -1 })
        .skip(initialNum)
        .limit(limitNum),
      SupportTicket.countDocuments(query),
    ]);

    return res.status(200).json({
      ok: true,
      tickets,
      total,
      mensaje: "Tickets obtenidos con éxito",
    });
  } catch (error) {
    console.error("getAllSupportTickets error:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error al obtener todos los tickets",
    });
  }
};

const getAdminSupportTicketById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const ticket = await SupportTicket.findOne({
      _id: id,
      isDeleted: false,
    }).populate("user", "name email img jobPosition rol");

    if (!ticket) {
      return res.status(404).json({
        ok: false,
        mensaje: "Ticket no encontrado",
      });
    }

    return res.status(200).json({
      ok: true,
      ticket,
      mensaje: "Ticket obtenido con éxito",
    });
  } catch (error) {
    console.error("getAdminSupportTicketById error:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error al obtener el ticket",
    });
  }
};

const updateSupportTicketStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, responseMessage } = req.body;

    const ticket = await SupportTicket.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!ticket) {
      return res.status(404).json({
        ok: false,
        mensaje: "Ticket no encontrado",
      });
    }

    if (status) {
      ticket.status = status;
    }

    if (responseMessage !== undefined) {
      ticket.responseMessage = responseMessage?.trim() || null;
    }

    if (status === "RESOLVED" || status === "CLOSED") {
      ticket.resolvedAt = new Date();
    }

    await ticket.save();

    return res.status(200).json({
      ok: true,
      mensaje: "Ticket actualizado con éxito",
      ticket,
    });
  } catch (error) {
    console.error("updateSupportTicketStatus error:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error al actualizar el ticket",
    });
  }
};

export {
  createSupportTicket,
  getMySupportTickets,
  getSupportTicketById,
  getAllSupportTickets,
  getAdminSupportTicketById,
  updateSupportTicketStatus,
};
