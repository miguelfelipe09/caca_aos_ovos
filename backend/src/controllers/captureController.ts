import { Response } from "express";
import * as service from "../services/captureService.js";
import { AuthRequest } from "../middleware/authMiddleware.js";

export const capture = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  const { arPointId } = req.body;
  try {
    const result = await service.recordCapture({
      userId: req.user.id,
      arPointId,
    });
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const myCaptures = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  const list = await service.userCaptures(req.user.id);
  res.json(list);
};

export const ranking = async (_req: AuthRequest, res: Response) => {
  const rank = await service.ranking();
  res.json(rank);
};
