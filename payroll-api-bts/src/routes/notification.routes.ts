import { Router } from "express";
import {
  listMyNotifications,
  getMyUnreadCount,
  markMyNotificationSeen,
  markMyNotificationRead,
  markAllMyNotificationsRead,
  archiveMyNotification,
  unarchiveMyNotification,
  deleteMyNotification,
  sendNotification,
} from "../controllers/notification.controller";
import { validateJWT } from "../middlewares/validate-jwt";

const notificationsRouter = Router();

notificationsRouter.post("/sendNotification", sendNotification);

notificationsRouter.use(validateJWT);

// Inbox
notificationsRouter.get("/my", listMyNotifications);
notificationsRouter.get("/my/unread-count", getMyUnreadCount);

//
notificationsRouter.put("/my/:notificationId/seen", markMyNotificationSeen);
notificationsRouter.put("/my/:notificationId/read", markMyNotificationRead);
notificationsRouter.put("/my/read-all", markAllMyNotificationsRead);

notificationsRouter.put("/my/:notificationId/archive", archiveMyNotification);
notificationsRouter.put(
  "/my/:notificationId/unarchive",
  unarchiveMyNotification,
);

// Delete
notificationsRouter.delete("/my/:notificationId", deleteMyNotification);

export default notificationsRouter;
