import { Router } from "express";
import * as controller from "../controllers/captureController.js";
import { authenticate, requireAdmin } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/", authenticate, controller.capture);
router.post("/admin/score", authenticate, requireAdmin, controller.adjustScoreForTesting);
router.post("/admin/reset", authenticate, requireAdmin, controller.resetProgressForTesting);
router.get("/me", authenticate, controller.myCaptures);
router.get("/ranking", authenticate, controller.ranking);

export default router;
