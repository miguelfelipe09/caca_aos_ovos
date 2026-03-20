import { Router } from "express";
import * as controller from "../controllers/captureController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/", authenticate, controller.capture);
router.get("/me", authenticate, controller.myCaptures);
router.get("/ranking", authenticate, controller.ranking);

export default router;
