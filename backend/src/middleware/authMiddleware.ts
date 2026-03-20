import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: Role;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No token" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Invalid token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: string;
      role: Role;
    };
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) return res.status(401).json({ message: "User not found" });

    req.user = { id: user.id, role: user.role };
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ message: "Admin only" });
  }
  next();
};
