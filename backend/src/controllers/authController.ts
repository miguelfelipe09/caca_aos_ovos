import { Request, Response } from "express";
import * as authService from "../services/authService.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const register = async (req: Request, res: Response) => {
  const { name, email, phone, password } = req.body;
  try {
    const { user, token } = await authService.register({ name, email, phone, password });
    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        totalScore: user.totalScore,
      },
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const { user, token } = await authService.login({ email, password });
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        totalScore: user.totalScore,
      },
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const me = async (req: any, res: Response) => {
  const userId = req.user?.id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, phone: true, role: true, totalScore: true },
  });
  res.json({ user });
};
