import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const listUsers = async () => {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      totalScore: true,
      createdAt: true,
      _count: { select: { captures: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const deleteUser = async (id: string) => {
  await prisma.capture.deleteMany({ where: { userId: id } });
  return prisma.user.delete({ where: { id } });
};
