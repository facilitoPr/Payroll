import { Request, Response } from "express";
import { Types } from "mongoose";
import UserSession from "../model/account/userSession";
import User from "../model/account/user";
import { sanitizeSession } from "../helper/user-session/user-session.normalize";

const getUserSessions = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID de usuario inválido.",
      });
    }

    const user = await User.findOne({
      _id: userId,
      isDeleted: false,
    }).select("name email img isActived");

    if (!user) {
      return res.status(404).json({
        ok: false,
        mensaje: "Usuario no encontrado.",
      });
    }

    const sessions = await UserSession.find({
      user: userId,
    })
      .sort({
        revokedAt: 1,
        lastUsedAt: -1,
        createdAt: -1,
      })
      .lean();

    const activeSessions = sessions.filter((item) => !item.revokedAt).length;
    const revokedSessions = sessions.filter((item) => item.revokedAt).length;

    return res.json({
      ok: true,
      mensaje: "Sesiones obtenidas correctamente.",
      user,
      sessions: sessions.map(sanitizeSession),
      summary: {
        total: sessions.length,
        active: activeSessions,
        revoked: revokedSessions,
      },
    });
  } catch (error) {
    console.log("getUserSessions error:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error obteniendo las sesiones.",
      error,
    });
  }
};

const revokeUserSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    if (!Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID de sesión inválido.",
      });
    }

    const session = await UserSession.findOne({
      _id: sessionId,
    });

    if (!session) {
      return res.status(404).json({
        ok: false,
        mensaje: "Sesión no encontrada.",
      });
    }

    if (session.revokedAt) {
      return res.json({
        ok: true,
        mensaje: "Esta sesión ya estaba revocada.",
        session: sanitizeSession(session),
      });
    }

    session.revokedAt = new Date();
    await session.save();

    return res.json({
      ok: true,
      mensaje: "Sesión revocada correctamente.",
      session: sanitizeSession(session),
    });
  } catch (error) {
    console.log("revokeUserSession error:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error revocando la sesión.",
      error,
    });
  }
};

const revokeAllUserSessions = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { excludeSessionId } = req.body || {};

    if (!Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID de usuario inválido.",
      });
    }

    const query: any = {
      user: userId,
      revokedAt: null,
    };

    if (excludeSessionId && Types.ObjectId.isValid(excludeSessionId)) {
      query._id = { $ne: excludeSessionId };
    }

    const result = await UserSession.updateMany(query, {
      $set: {
        revokedAt: new Date(),
      },
    });

    return res.json({
      ok: true,
      mensaje: "Sesiones activas revocadas correctamente.",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.log("revokeAllUserSessions error:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error revocando las sesiones.",
      error,
    });
  }
};

export { getUserSessions, revokeUserSession, revokeAllUserSessions };
