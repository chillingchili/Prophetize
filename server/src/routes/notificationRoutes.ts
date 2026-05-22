import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import * as notificationController from "../controllers/notificationController";

const router = Router();

router.post("/register", requireAuth, notificationController.registerNotificationChannel);
router.post("/trigger", requireAuth, notificationController.triggerNotification);

router.get("/", requireAuth, notificationController.getNotifications);
router.patch("/read", requireAuth, notificationController.markAsRead);
router.patch("/read-all", requireAuth, notificationController.markAllAsRead);
router.get("/unread-count", requireAuth, notificationController.getUnreadCount);

router.post("/register-push-token", requireAuth, notificationController.registerPushToken);
router.post("/unregister-push-token", requireAuth, notificationController.unregisterPushToken);

export default router;
