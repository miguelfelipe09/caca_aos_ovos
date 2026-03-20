import { PrismaClient, Role, User } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export const register = async (data: {
  name: string;
  email: string;
  password: string;
  role?: Role;
}): Promise<{ user: User; token: string }> => {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new Error("Email already registered");

  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role || "USER",
    },
  });

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" }
  );

  return { user, token };
};

export const login = async (data: {
  email: string;
  password: string;
}): Promise<{ user: User; token: string }> => {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) throw new Error("Invalid credentials");

  const ok = await bcrypt.compare(data.password, user.passwordHash);
  if (!ok) throw new Error("Invalid credentials");

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" }
  );

  return { user, token };
};
