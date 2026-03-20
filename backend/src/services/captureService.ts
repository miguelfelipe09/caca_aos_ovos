import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const recordCapture = async ({
  userId,
  arPointId,
}: {
  userId: string;
  arPointId: string;
}) => {
  const point = await prisma.aRPoint.findUnique({ where: { id: arPointId } });
  if (!point || !point.isActive) {
    throw new Error("AR point not found or inactive");
  }

  const exists = await prisma.capture.findUnique({
    where: { userId_arPointId: { userId, arPointId } },
  });
  if (exists) {
    return {
      alreadyCaptured: true,
      earnedPoints: 0,
      totalScore: exists.totalScoreAfter,
      captureName: point.name,
    };
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { totalScore: { increment: point.points } },
  });

  const capture = await prisma.capture.create({
    data: {
      userId,
      arPointId,
      earnedPoints: point.points,
      totalScoreAfter: user.totalScore,
    },
  });

  return {
    success: true,
    alreadyCaptured: false,
    earnedPoints: point.points,
    totalScore: capture.totalScoreAfter,
    captureName: point.name,
  };
};

export const userCaptures = async (userId: string) => {
  return prisma.capture.findMany({
    where: { userId },
    include: { arPoint: { select: { name: true, points: true, slug: true } } },
    orderBy: { capturedAt: "desc" },
  });
};

export const ranking = async () => {
  return prisma.user.findMany({
    select: { id: true, name: true, totalScore: true },
    orderBy: { totalScore: "desc" },
    take: 20,
  });
};
