import { PrismaClient, ARPoint } from "@prisma/client";

const prisma = new PrismaClient();
const normalizeModelKey = (value?: string | null) => value?.trim().toLowerCase() || "";

export const listPoints = async (userId?: string) => {
  const points = await prisma.aRPoint.findMany({
    orderBy: { createdAt: "desc" },
  });

  if (!userId) return points;

  const captured = await prisma.capture.findMany({
    where: { userId },
    include: {
      arPoint: {
        select: {
          id: true,
          modelUrl: true,
        },
      },
    },
  });
  const capturedIds = new Set(captured.map((c) => c.arPointId));
  const capturedModelKeys = new Set(captured.map((c) => normalizeModelKey(c.arPoint.modelUrl)));

  return points.map((p) => ({
    ...p,
    captured: capturedIds.has(p.id) || capturedModelKeys.has(normalizeModelKey(p.modelUrl)),
  }));
};

export const getPoint = async (id: string): Promise<ARPoint | null> => {
  return prisma.aRPoint.findUnique({ where: { id } });
};

export const createPoint = async (data: Partial<ARPoint>) => {
  return prisma.aRPoint.create({ data: data as any });
};

export const updatePoint = async (id: string, data: Partial<ARPoint>) => {
  return prisma.aRPoint.update({ where: { id }, data: data as any });
};

export const deletePoint = async (id: string) => {
  return prisma.aRPoint.delete({ where: { id } });
};
