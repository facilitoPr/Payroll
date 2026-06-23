import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";

import User, { IUser } from "../model/account/user";
import Department from "../model/rrhh/department";
import { tokenData } from "../helper/token/jwt";
import UserSession from "../model/account/userSession";
import Types from 'mongoose';

export interface AuthRequest extends Request {
  uid: Types.ObjectId | string;
  sid: Types.ObjectId | string;
  user?: IUser | any;
  imageURLs: string[];
  imageURL: string;
  uploadedFilesMap?: Record<string, string | string[] | undefined>;
}

const getTokenFromHeaders = (req: Request) => {
  const xToken = req.headers["x-access-token"];
  if (typeof xToken === "string" && xToken.trim()) return xToken.trim();

  const auth = req.headers["authorization"];
  if (typeof auth === "string" && auth.startsWith("Bearer ")) {
    return auth.replace("Bearer ", "").trim();
  }

  return null;
};

const validateJWT = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = getTokenFromHeaders(req);

    if (!token) {
      return res.status(401).send({
        ok: false,
        message: "Unauthorized",
        mensaje: "No autorizado",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.SECRETORPRIVATEKEY as any,
    ) as tokenData;

    const uid = decoded?.uid;
    const sid = decoded?.sid;

    if (!uid || !sid) {
      return res.status(401).send({
        ok: false,
        message: "Invalid token payload",
        mensaje: "Token inválido",
      });
    }

    const activeSession = await UserSession.findOne({
      _id: sid,
      user: uid,
      revokedAt: null,
    }).lean();

    if (!activeSession) {
      return res.status(401).send({
        ok: false,
        message: "Session closed",
        mensaje: "La sesión fue cerrada",
      });
    }

    const user = await User.findOne({
      _id: uid,
      isActived: true,
      isDeleted: false,
    })
      .populate("rol")
      .lean();

    if (!user) {
      return res.status(401).json({
        message: "No existe este usuario",
      });
    }

    // Buscar un departamento donde managers contenga el user._id
    const isManager = await Department.exists({
      isDeleted: false,
      isActive: true,
      managers: user?._id,
    });

    // TODO verificar si el usuario ha pagado la sub
    req.user = {
      ...user,
      isManager: !!isManager,
    };

    req.user = user;
    req.uid = user._id;
    req.sid = sid;

    next();
  } catch (error) {
    console.log("Error JWT: ", error);
    if (error instanceof jwt.JsonWebTokenError) {
      console.error("Token mal formado: usuario", error.message);
      return res.status(401).send({
        ok: false,
        msg: "Token mal formado usuario:",
      });
      // Aquí puedes manejar el caso de token mal formado, como enviar un mensaje al usuario o realizar otras acciones según sea necesario
    } else {
      res.status(500).json({
        ok: false,
        error,
        mensaje: "¡Ups! Algo salió mal",
        message: "Ups! Something went wrong",
      });
    }
  }
};

export { validateJWT };
