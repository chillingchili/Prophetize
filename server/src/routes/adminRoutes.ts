import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { requireAdmin } from '../middleware/adminMiddleware';
import * as adminMarketOpsController from '../controllers/adminMarketOpsController';
import * as notificationController from '../controllers/notificationController';

const router = Router();

router.get('/markets/pending', requireAuth, requireAdmin, adminMarketOpsController.getPendingApprovals);
router.get('/markets/due-resolution', requireAuth, requireAdmin, adminMarketOpsController.getDueResolutions);
router.post('/markets/:id/review', requireAuth, requireAdmin, adminMarketOpsController.reviewMarket);
router.post('/markets/:id/resolve', requireAuth, requireAdmin, adminMarketOpsController.resolveMarket);
router.post('/notifications/send', requireAuth, requireAdmin, notificationController.sendAdminNotification);

export default router;
