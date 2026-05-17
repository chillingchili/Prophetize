import { Router } from "express";
import * as marketController from "../controllers/marketController";
import { requireAdmin } from "../middleware/adminMiddleware";
import { requireAuth } from "../middleware/authMiddleware";

const router = Router();

// TEST ROUTES
router.get("/get-all", marketController.getAllMarkets);

// ACTUAL ROUTES
router.get("/trending", marketController.getTrendingMarkets);
router.get("/categories", marketController.getCategories);
router.get("/category/:category", marketController.getMarketByCategory);
router.get("/search", marketController.searchMarket);
router.get('/resolved', marketController.getResolvedMarkets);
router.get('/created', requireAuth, marketController.getCreatedMarkets);
router.get('/created/user/:userId', requireAuth, marketController.getCreatedMarkets);
router.get("/:id/history", marketController.getMarketHistory);
router.post("/create", requireAuth, marketController.createMarket);
router.post("/review/:id", requireAuth, requireAdmin, marketController.reviewMarket);
router.get("/:id", marketController.getMarketById);


export default router; 