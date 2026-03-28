import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/authMiddleware.js";
import * as controller from "../controllers/userController.js";

const router = Router();

router.get("/", authenticate, requireAdmin, controller.list);
router.delete("/:id", authenticate, requireAdmin, controller.remove);

export default router;
