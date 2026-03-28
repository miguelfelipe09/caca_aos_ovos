import { Request, Response } from "express";
import * as service from "../services/userService.js";
import { AuthRequest } from "../middleware/authMiddleware.js";

export const list = async (_req: Request, res: Response) => {
  const users = await service.listUsers();
  res.json({ users });
};

export const remove = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  if (req.user?.id === id) {
    return res.status(400).json({ message: "Você não pode excluir o próprio usuário logado." });
  }

  try {
    await service.deleteUser(id);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ message: error?.message || "Não foi possível excluir o usuário." });
  }
};
