import { Router } from "express";
import * as controller from "../controllers/arPointController.js";
import { authenticate, requireAdmin } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", authenticate, controller.list);
router.get("/:id", authenticate, controller.get);
router.post("/", authenticate, requireAdmin, controller.create);
router.put("/:id", authenticate, requireAdmin, controller.update);
router.delete("/:id", authenticate, requireAdmin, controller.remove);

export default router;
