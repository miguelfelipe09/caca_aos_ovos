import { Request, Response } from "express";
import * as service from "../services/arPointService.js";
import { AuthRequest } from "../middleware/authMiddleware.js";

export const list = async (req: AuthRequest, res: Response) => {
  const points = await service.listPoints(req.user?.id);
  res.json(points);
};

export const get = async (req: Request, res: Response) => {
  const point = await service.getPoint(req.params.id);
  if (!point) return res.status(404).json({ message: "Not found" });
  res.json(point);
};

export const create = async (req: Request, res: Response) => {
  try {
    const point = await service.createPoint(req.body);
    res.status(201).json(point);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const point = await service.updatePoint(req.params.id, req.body);
    res.json(point);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    await service.deletePoint(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
