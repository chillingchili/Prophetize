import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import * as userController from "../controllers/userController";

const router = Router();

// User Routes
router.post("/register", userController.register);
router.post("/login", userController.login);
router.post("/logout", requireAuth, userController.logout);
router.post("/refresh-token", userController.refreshUserToken);
router.get("/profile", requireAuth, userController.getMyProfile);
router.patch("/profile", requireAuth, userController.updateProfile);
router.post("/google-sync", requireAuth, userController.googleSync);
router.post("/claim-allowance", requireAuth, userController.claimAllowance);

export default router;