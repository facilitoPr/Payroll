import bcrypt from "bcrypt";
import { CookieOptions, Request, Response } from "express";
import User from "../model/account/user";
import Department from "../model/rrhh/department";
import { Types } from "mongoose";
import { AuthRequest } from "../middlewares/validate-jwt";
import { buildUserAccesses } from "../helper/user/user.build-accesses";
import { getClientIp } from "../helper/token/client-ip";
import { createRefreshToken, hashToken } from "../helper/token/tokens";
import {
  clearRefreshCookies,
  cookieName,
  cookiePath,
  getRefreshTokenFromReq,
  isProduction,
} from "../helper/user/user.cookies";
import { logRefresh401 } from "../helper/user/user.sessions";
import UserSession from "../model/account/userSession";
import { isUserActive } from "../helper/user/account.validation";
import { generateJWT } from "../helper/token/jwt";
import { Platform } from "../model/account/userSession";
import "../model/company"

const loginPanel = async (req: Request, res: Response) => {
  try {
    const { email, password, deviceId, platform } = req.body as {
      email?: string;
      password?: string;
      deviceId?: string;
      platform?: Platform;
    };

    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        message: "Email and password are required",
        mensaje: "Correo y contraseña son requeridos",
        status: 400,
      });
    }

    if (!deviceId || !platform) {
      return res.status(400).json({
        ok: false,
        message: "deviceId and platform are required",
        mensaje: "deviceId y platform son requeridos",
        status: 400,
      });
    }

    const validPlatforms: Platform[] = ["ios", "android", "web"];

    if (!validPlatforms.includes(platform)) {
      return res.status(400).json({
        ok: false,
        message: "Invalid platform",
        mensaje: "Platform inválida",
        status: 400,
      });
    }

    const lowerEmail = String(email).toLowerCase().trim();

    const userDoc: any = await User.findOne({
      email: lowerEmail,
    })
      .select("+password")
      .populate("rol")
      .populate(
        "company",
        "code legalName tradeName logo primaryColor secondaryColor",
      )
      .populate("paymentSchedule")
      .populate("salaryType")
      .populate("department")
      .populate("project")
      .populate("jobPosition");

    if (!userDoc) {
      return res.status(404).json({
        ok: false,
        message: "Wrong email or password",
        mensaje: "Correo o contraseña equivocada",
        status: 404,
      });
    }

    if (userDoc.isDeleted) {
      return res.status(404).json({
        ok: false,
        message: "This user was deleted, contact an administrator",
        mensaje: "Usuario eliminado, contacte un administrador",
        status: 404,
      });
    }

    /**
     * Soporta ambos nombres por compatibilidad:
     * - isActived: como lo tienes actualmente en este login.
     * - isActive: como usas en modelos nuevos.
     */
    const userIsActive =
      typeof userDoc.isActive === "boolean"
        ? userDoc.isActive
        : typeof userDoc.isActived === "boolean"
          ? userDoc.isActived
          : true;

    if (!userIsActive) {
      return res.status(404).json({
        ok: false,
        message: "User disabled, contact an administrator",
        mensaje: "Usuario desactivado, contacte un administrador",
        status: 404,
      });
    }

    const passwordMatch = await bcrypt.compare(
      String(password),
      userDoc.password,
    );

    if (!passwordMatch) {
      return res.status(404).json({
        ok: false,
        message: "Wrong email or password",
        mensaje: "Correo o contraseña equivocada",
        status: 404,
      });
    }

    const isManager = await Department.exists({
      isDeleted: false,
      isActive: true,
      managers: new Types.ObjectId(userDoc._id),
    });

    const refreshToken = createRefreshToken();
    const refreshTokenHash = hashToken(refreshToken);
    const ip = getClientIp(req);

    /**
     * No recibimos accountType desde el body.
     * Se guarda fijo como USER porque este login solo trabaja con la tabla User.
     */
    const sessionFilter: Record<string, any> = {
      user: userDoc._id,
      deviceId,
      platform,
    };

    const sessionSet: Record<string, any> = {
      refreshTokenHash,
      ip,
      userAgent: req.headers["user-agent"],
      lastUsedAt: new Date(),
      revokedAt: null,
    };

    /**
     * Si tu modelo AccountSession todavía tiene accountType requerido,
     * lo llenamos internamente como USER, pero no se valida ni se recibe del request.
     */

    const session = await UserSession.findOneAndUpdate(
      sessionFilter,
      {
        $set: sessionSet,
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );

    const token = await generateJWT(userDoc, session._id);

    const user = userDoc.toObject();
    delete user.password;

    const userToSend = {
      ...user,
      isManager: !!isManager,
      department: user.department || null,
      jobPosition: user.jobPosition || null,
    };

    const accesses = await buildUserAccesses(userToSend);

    const cookieOptions: CookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: cookiePath,
      maxAge: 1000 * 60 * 60 * 24 * 30,
    };

    if (platform === "web") {
      res.cookie(cookieName, refreshToken, cookieOptions);
    }

    return res.status(200).json({
      ok: true,
      message: "Welcome",
      mensaje: "Sesión iniciada",
      user: {
        ...userToSend,
        accesses,
      },
      token,
      accesses,
      refreshToken: platform === "web" ? undefined : refreshToken,
    });
  } catch (error) {
    console.log("loginPanel error:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "¡Ups! Algo salió mal",
      message: "Ups! Something went wrong",
      error,
    });
  }
};

const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.uid;

    if (!userId) {
      return res.status(401).json({
        ok: false,
        mensaje: "No autorizado",
      });
    }

    const userDoc: any = await User.findById(userId)
      .populate("rol", "code name")
      .populate(
        "company",
        "code legalName tradeName logo primaryColor secondaryColor",
      )
      .populate("paymentSchedule")
      .populate("salaryType")
      .populate("department")
      .populate("project")
      .populate("jobPosition");

    if (!userDoc) {
      return res.status(401).json({
        ok: false,
        mensaje: "Sesión inválida",
      });
    }

    if (userDoc.isDeleted) {
      return res.status(401).json({
        ok: false,
        mensaje: "Usuario eliminado",
      });
    }

    const userIsActive =
      typeof userDoc.isActive === "boolean"
        ? userDoc.isActive
        : typeof userDoc.isActived === "boolean"
          ? userDoc.isActived
          : true;

    if (!userIsActive) {
      return res.status(401).json({
        ok: false,
        mensaje: "Usuario inactivo",
      });
    }

    const isManager = await Department.exists({
      isDeleted: false,
      isActive: true,
      managers: new Types.ObjectId(userDoc._id),
    });

    const user = userDoc.toObject();

    delete user.password;

    const userToSend = {
      ...user,
      isManager: !!isManager,
      department: user.department || null,
      jobPosition: user.jobPosition || null,
      company: user.company || null,
    };

    const accesses = await buildUserAccesses(userToSend);

    return res.status(200).json({
      ok: true,
      mensaje: "Sesión obtenida correctamente",
      user: {
        ...userToSend,
        accesses,
      },
      accesses,
    });
  } catch (error) {
    console.log("getMe error:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error obteniendo la sesión",
    });
  }
};

const refresh = async (req: Request, res: Response) => {
  try {
    const { deviceId, platform } = req.body as {
      deviceId?: string;
      platform?: "ios" | "android" | "web";
    };

    const ip = getClientIp(req);
    const userAgent: any = req.headers["user-agent"];

    if (!deviceId || !platform) {
      clearRefreshCookies(res);
      return res.status(400).send({
        ok: false,
        mensaje: "deviceId, platform son requeridos",
        message: "deviceId, platform are required",
      });
    }

    const refreshToken = getRefreshTokenFromReq(req);

    if (!refreshToken) {
      logRefresh401({
        reason: "REFRESH_TOKEN_MISSING",
        deviceId,
        platform,
        ip,
        userAgent,
      });

      clearRefreshCookies(res);

      return res.status(401).send({
        ok: false,
        mensaje: "Refresh token requerido",
        message: "Refresh token required",
      });
    }

    const refreshHash = hashToken(refreshToken);

    const session = await UserSession.findOne({
      deviceId,
      platform,
      refreshTokenHash: refreshHash,
      revokedAt: null,
    });

    if (!session) {
      logRefresh401({
        reason: "SESSION_NOT_FOUND",
        deviceId,
        platform,
        ip,
        userAgent,
        extra: {
          refreshHash,
        },
      });

      clearRefreshCookies(res);

      return res.status(401).send({
        ok: false,
        mensaje: "Sesión inválida",
        message: "Invalid session",
      });
    }

    const account = await User.findOne({
      _id: session.user,
      isActived: true,
      isDeleted: false,
    }).populate("rol");

    if (!account) {
      logRefresh401({
        reason: "ACCOUNT_NOT_FOUND",
        deviceId,
        platform,
        ip,
        userAgent,
        extra: {
          sessionId: session._id,
          userId: session.user,
        },
      });

      await UserSession.updateOne(
        { _id: session._id },
        { $set: { revokedAt: new Date() } },
      );

      clearRefreshCookies(res);

      return res.status(401).send({
        ok: false,
        mensaje: "Usuario no autorizado",
        message: "Unauthorized user",
      });
    }

    if (!isUserActive(account)) {
      logRefresh401({
        reason: "ACCOUNT_INACTIVE",
        deviceId,
        platform,
        ip,
        userAgent,
        extra: {
          sessionId: session._id,
          accountId: session.user,
          isActive: account?.isActived ?? null,
          isDeleted: account?.isDeleted ?? null,
        },
      });

      await UserSession.updateOne(
        { _id: session._id },
        { $set: { revokedAt: new Date() } },
      );

      clearRefreshCookies(res);

      return res.status(401).send({
        ok: false,
        mensaje: "Usuario no autorizado",
        message: "Unauthorized user",
      });
    }

    const newRefreshToken = createRefreshToken();

    await UserSession.updateOne(
      { _id: session._id },
      {
        $set: {
          refreshTokenHash: hashToken(newRefreshToken),
          lastUsedAt: new Date(),
          ip,
          userAgent,
        },
      },
    );

    const accessToken = await generateJWT(account, session._id);

    const accountToSend = await buildUserAccesses(account);

    if (platform === "web") {
      res.cookie(cookieName, newRefreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        path: cookiePath,
        maxAge: 1000 * 60 * 60 * 24 * 30,
      });

      return res.status(200).send({
        ok: true,
        mensaje: "Token actualizado",
        message: "Token refreshed",
        token: accessToken,
        user: accountToSend,
      });
    }

    return res.status(200).send({
      ok: true,
      mensaje: "Token actualizado",
      message: "Token refreshed",
      token: accessToken,
      refreshToken: newRefreshToken,
      user: accountToSend,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      ok: false,
      mensaje: "¡Ups! Algo salió mal",
      message: "Ups! Something went wrong",
      error,
    });
  }
};

const logout = async (req: AuthRequest, res: Response) => {
  try {
    const uid = req.uid;
    const { deviceId, platform } = req.body as {
      deviceId?: string;
      platform?: "ios" | "android" | "web";
    };

    if (!deviceId || !platform) {
      return res.status(400).send({
        ok: false,
        mensaje: "deviceIdl y platform son requeridos",
        message: "deviceId and platform are required",
      });
    }

    await UserSession.updateOne(
      { user: uid, deviceId, platform, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    );

    if (platform === "web") clearRefreshCookies(res);

    return res
      .status(200)
      .send({ ok: true, mensaje: "Sesión cerrada", message: "Logged out" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      ok: false,
      mensaje: "¡Ups! Algo salió mal",
      message: "Ups! Something went wrong",
      error,
    });
  }
};

const logoutAll = async (req: AuthRequest, res: Response) => {
  try {
    const uid = req.uid;

    await UserSession.updateMany(
      { user: uid, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    );

    clearRefreshCookies(res);

    return res.status(200).send({
      ok: true,
      mensaje: "Todas las sesiones cerradas",
      message: "All sessions logged out",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      ok: false,
      mensaje: "¡Ups! Algo salió mal",
      message: "Ups! Something went wrong",
      error,
    });
  }
};

const deleteAccount = async (req: AuthRequest, res: Response) => {
  try {
    const uid = req.uid;
    if (!uid)
      return res
        .status(401)
        .send({ ok: false, mensaje: "No autorizado", message: "Unauthorized" });

    // ✅ soft delete del usuario
    await User.updateOne(
      { _id: uid },
      {
        $set: {
          isDeleted: true,
          // por compatibilidad si usas isActive / isActive
          isActived: false,
        },
      },
    );

    // ✅ revocar todas sus sesiones
    await UserSession.updateMany(
      { user: uid, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    );

    clearRefreshCookies(res);

    return res.status(200).send({
      ok: true,
      mensaje: "Cuenta eliminada (soft delete)",
      message: "Account deleted (soft delete)",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      ok: false,
      mensaje: "¡Ups! Algo salió mal",
      message: "Ups! Something went wrong",
      error,
    });
  }
};

export { loginPanel, getMe, refresh, logout, logoutAll, deleteAccount };
