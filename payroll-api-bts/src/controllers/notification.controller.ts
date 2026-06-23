import { Request, Response } from "express";
import { Types } from "mongoose";
import { NotificationRecipient } from "../model/notification/NotificationRecipient";
import { notifyRole, notifyUsers } from "../services/notification.service";
import { Notification } from "../model/notification/Notification";
import { getSocketIO } from "../config/socket";
import { toBool, toNum } from "../helper/parse";

const io = getSocketIO()
/**
 * GET /notifications/my?unread=true&archived=false&types=PAYROLL_RUN_CLOSED,DISCIPLINARY_WARNING_CREATED&limit=20&initial=0
 */
const listMyNotifications = async (req: any, res: Response) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res.status(401).json({ ok: false, mensaje: "No autenticado" });
    }

    const unread = toBool((req.query as any).unread);
    const archived = toBool((req.query as any).archived);

    const limit = Math.max(
      1,
      Math.min(100, toNum((req.query as any).limit, 20))
    );
    const initial = Math.max(0, toNum((req.query as any).initial, 0));

    const typesRaw = String((req.query as any).types || "").trim();
    const types = typesRaw
      ? typesRaw
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    const matchRecipient: any = {
      user: userId,
      isDeleted: false,
      isActive: true,
    };

    const and: any[] = [];

    if (unread) {
      and.push({
        $or: [{ readAt: { $exists: false } }, { readAt: null }],
      });
    }

    if (!archived) {
      and.push({
        $or: [{ archivedAt: { $exists: false } }, { archivedAt: null }],
      });
    }

    if (and.length) matchRecipient.$and = and;

    // Aggregate para contar y filtrar también notificaciones isDeleted/isActive
    const pipeline: any[] = [
      { $match: matchRecipient },
      {
        $lookup: {
          from: "notifications",
          localField: "notification",
          foreignField: "_id",
          as: "notificationDoc",
        },
      },
      { $unwind: "$notificationDoc" },
      {
        $match: {
          "notificationDoc.isDeleted": false,
          "notificationDoc.isActive": true,
          ...(types.length ? { "notificationDoc.type": { $in: types } } : {}),
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          items: [
            { $skip: initial },
            { $limit: limit },
            {
              $project: {
                _id: 1,
                notification: "$notificationDoc",
                user: 1,
                seenAt: 1,
                readAt: 1,
                archivedAt: 1,
                createdAt: 1,
                updatedAt: 1,
              },
            },
          ],
          total: [{ $count: "count" }],
        },
      },
    ];

    const agg = await NotificationRecipient.aggregate(pipeline);
    const items = agg?.[0]?.items || [];
    const total = agg?.[0]?.total?.[0]?.count || 0;

    return res.status(200).json({
      ok: true,
      items,
      total,
      limit,
      initial,
      mensaje: "Notificaciones obtenidas",
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ ok: false, error, mensaje: "¡Ups! Algo salió mal" });
  }
};

/**
 * GET /notifications/my/unread-count
 */
const getMyUnreadCount = async (req: any, res: Response) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res.status(401).json({ ok: false, mensaje: "No autenticado" });
    }

    const pipeline: any[] = [
      {
        $match: {
          user: userId,
          isDeleted: false,
          isActive: true,
          $and: [
            { $or: [{ archivedAt: { $exists: false } }, { archivedAt: null }] },
            { $or: [{ readAt: { $exists: false } }, { readAt: null }] },
          ],
        },
      },
      {
        $lookup: {
          from: "notifications",
          localField: "notification",
          foreignField: "_id",
          as: "notificationDoc",
        },
      },
      { $unwind: "$notificationDoc" },
      {
        $match: {
          "notificationDoc.isDeleted": false,
          "notificationDoc.isActive": true,
        },
      },
      { $count: "count" },
    ];

    const agg = await NotificationRecipient.aggregate(pipeline);
    const count = agg?.[0]?.count || 0;

    return res.status(200).json({
      ok: true,
      count,
      mensaje: "Conteo de no leídas",
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ ok: false, error, mensaje: "¡Ups! Algo salió mal" });
  }
};

/**
 * PUT /notifications/my/:notificationId/seen
 */
const markMyNotificationSeen = async (req: any, res: Response) => {
  try {
    const userId = req.user._id;
    if (!userId)
      return res.status(401).json({ ok: false, mensaje: "No autenticado" });

    const { notificationId } = req.params;
    if (!notificationId || !Types.ObjectId.isValid(notificationId)) {
      return res
        .status(400)
        .json({ ok: false, mensaje: "notificationId inválido" });
    }

    const now = new Date();

    const r = await NotificationRecipient.updateOne(
      {
        user: userId,
        notification: new Types.ObjectId(notificationId),
        isDeleted: false,
      },
      {
        $set: { seenAt: now },
      }
    );

    return res.status(200).json({
      ok: true,
      modified: (r as any).modifiedCount ?? (r as any).nModified ?? 0,
      mensaje: "Notificación marcada como vista",
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ ok: false, error, mensaje: "¡Ups! Algo salió mal" });
  }
};

/**
 * PUT /notifications/my/:notificationId/read
 */
const markMyNotificationRead = async (req: any, res: Response) => {
  try {
    const userId = req.user._id;
    if (!userId)
      return res.status(401).json({ ok: false, mensaje: "No autenticado" });

    const { notificationId } = req.params;
    if (!notificationId || !Types.ObjectId.isValid(notificationId)) {
      return res
        .status(400)
        .json({ ok: false, mensaje: "notificationId inválido" });
    }

    const now = new Date();

    const r = await NotificationRecipient.updateOne(
      {
        user: userId,
        notification: new Types.ObjectId(notificationId),
        isDeleted: false,
      },
      {
        $set: { readAt: now, seenAt: now },
      }
    );

    return res.status(200).json({
      ok: true,
      modified: (r as any).modifiedCount ?? (r as any).nModified ?? 0,
      mensaje: "Notificación marcada como leída",
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ ok: false, error, mensaje: "¡Ups! Algo salió mal" });
  }
};

/**
 * PUT /notifications/my/read-all
 */
const markAllMyNotificationsRead = async (req: any, res: Response) => {
  try {
    const userId = req.user._id;
    if (!userId)
      return res.status(401).json({ ok: false, mensaje: "No autenticado" });

    const now = new Date();

    const r = await NotificationRecipient.updateMany(
      {
        user: userId,
        isDeleted: false,
        isActive: true,
        $and: [
          { $or: [{ archivedAt: { $exists: false } }, { archivedAt: null }] },
          { $or: [{ readAt: { $exists: false } }, { readAt: null }] },
        ],
      },
      {
        $set: { readAt: now, seenAt: now },
      }
    );

    return res.status(200).json({
      ok: true,
      modified: (r as any).modifiedCount ?? (r as any).nModified ?? 0,
      mensaje: "Todas las notificaciones fueron marcadas como leídas",
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ ok: false, error, mensaje: "¡Ups! Algo salió mal" });
  }
};

/**
 * PUT /notifications/my/:notificationId/archive
 */
const archiveMyNotification = async (req: any, res: Response) => {
  try {
    const userId = req.user._id;
    if (!userId)
      return res.status(401).json({ ok: false, mensaje: "No autenticado" });

    const { notificationId } = req.params;
    if (!notificationId || !Types.ObjectId.isValid(notificationId)) {
      return res
        .status(400)
        .json({ ok: false, mensaje: "notificationId inválido" });
    }

    const now = new Date();

    const r = await NotificationRecipient.updateOne(
      {
        user: userId,
        notification: new Types.ObjectId(notificationId),
        isDeleted: false,
      },
      {
        $set: { archivedAt: now },
      }
    );

    return res.status(200).json({
      ok: true,
      modified: (r as any).modifiedCount ?? (r as any).nModified ?? 0,
      mensaje: "Notificación archivada",
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ ok: false, error, mensaje: "¡Ups! Algo salió mal" });
  }
};

/**
 * PUT /notifications/my/:notificationId/unarchive
 */
const unarchiveMyNotification = async (req: any, res: Response) => {
  try {
    const userId = req.user._id;
    if (!userId)
      return res.status(401).json({ ok: false, mensaje: "No autenticado" });

    const { notificationId } = req.params;
    if (!notificationId || !Types.ObjectId.isValid(notificationId)) {
      return res
        .status(400)
        .json({ ok: false, mensaje: "notificationId inválido" });
    }

    const r = await NotificationRecipient.updateOne(
      {
        user: userId,
        notification: new Types.ObjectId(notificationId),
        isDeleted: false,
      },
      {
        $set: { archivedAt: null },
      }
    );

    return res.status(200).json({
      ok: true,
      modified: (r as any).modifiedCount ?? (r as any).nModified ?? 0,
      mensaje: "Notificación desarchivada",
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ ok: false, error, mensaje: "¡Ups! Algo salió mal" });
  }
};

/**
 * DELETE /notifications/my/:notificationId
 * Soft delete SOLO del recipient (no borra la Notification global)
 */
const deleteMyNotification = async (req: any, res: Response) => {
  try {
    const userId = req.user._id;
    if (!userId)
      return res.status(401).json({ ok: false, mensaje: "No autenticado" });

    const { notificationId } = req.params;
    if (!notificationId || !Types.ObjectId.isValid(notificationId)) {
      return res
        .status(400)
        .json({ ok: false, mensaje: "notificationId inválido" });
    }

    const r = await NotificationRecipient.updateOne(
      {
        user: userId,
        notification: new Types.ObjectId(notificationId),
        isDeleted: false,
      },
      {
        $set: { isDeleted: true, isActive: false },
      }
    );

    return res.status(200).json({
      ok: true,
      modified: (r as any).modifiedCount ?? (r as any).nModified ?? 0,
      mensaje: "Notificación eliminada",
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ ok: false, error, mensaje: "¡Ups! Algo salió mal" });
  }
};

//

const sendNotification = async (req: any, res: Response) => {
  try {
    const { title, message, link, user, event, time } = req.body;

    let response;
    if (user) {
      response = await notifyUsers({
        recipientUserIds: [user],
        title,
        message,
        type: "GENERAL_NOTIFICATION",
        link: link ? link : "",
        severity: "SUCCESS",
      });
    } else {
      response = await notifyRole({
        roleCode: "EMPLOYEE",
        title,
        message,
        type: "GENERAL_NOTIFICATION",
        link: link ? link : "",
        severity: "SUCCESS",
      });
    }

    if (response.ok) {
      setTimeout(async () => {
        await NotificationRecipient.findOneAndDelete({
          notification: response.notification,
        });
        await Notification.findByIdAndDelete(response.notification);
        io.emit("notifications:remove");
      }, time ? time : 10000);
    }

    return res.status(200).json({
      ok: true,
      mensaje: "Notificaciones obtenidas",
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ ok: false, error, mensaje: "¡Ups! Algo salió mal" });
  }
};

export {
  listMyNotifications,
  getMyUnreadCount,
  markMyNotificationSeen,
  markMyNotificationRead,
  markAllMyNotificationsRead,
  archiveMyNotification,
  unarchiveMyNotification,
  deleteMyNotification,
  sendNotification,
};
