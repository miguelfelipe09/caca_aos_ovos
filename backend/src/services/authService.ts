import { PrismaClient, Role, User } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export const register = async (data: {
  name: string;
  email: string;
  phone: string;
  password: string;
  role?: Role;
}): Promise<{ user: User; token: string }> => {
  const cleanPhone = data.phone.replace(/\D/g, "");
  if (!cleanPhone || cleanPhone.length < 10 || cleanPhone.length > 15) {
    throw new Error("Phone must contain 10 to 15 digits");
  }

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email: data.email }, { phone: cleanPhone }],
    },
  });
  if (existing?.email === data.email) throw new Error("Email already registered");
  if (existing?.phone === cleanPhone) throw new Error("Phone already registered");

  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      phone: cleanPhone,
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
