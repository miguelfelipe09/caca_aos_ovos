import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const normalizeModelKey = (value?: string | null) => value?.trim().toLowerCase() || "";
const MAX_CAPTURE_RETRIES = 2;

const findExistingCapture = async (userId: string, arPointId: string, modelUrl: string) => {
  const captures = await prisma.capture.findMany({
    where: { userId },
    include: {
      arPoint: {
        select: {
          modelUrl: true,
        },
      },
    },
    orderBy: { capturedAt: "desc" },
  });

  return captures.find(
    (capture) =>
      capture.arPointId === arPointId ||
      normalizeModelKey(capture.arPoint.modelUrl) === normalizeModelKey(modelUrl)
  );
};

const isCaptureConflictError = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  (error.code === "P2002" || error.code === "P2034");

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

  for (let attempt = 0; attempt < MAX_CAPTURE_RETRIES; attempt += 1) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const exists = await tx.capture.findUnique({
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

          const userCaptures = await tx.capture.findMany({
            where: { userId },
            include: {
              arPoint: {
                select: {
                  modelUrl: true,
                },
              },
            },
          });

          const duplicateModelCapture = userCaptures.find(
            (capture) => normalizeModelKey(capture.arPoint.modelUrl) === normalizeModelKey(point.modelUrl)
          );

          if (duplicateModelCapture) {
            return {
              alreadyCaptured: true,
              earnedPoints: 0,
              totalScore: duplicateModelCapture.totalScoreAfter,
              captureName: point.name,
            };
          }

          const user = await tx.user.update({
            where: { id: userId },
            data: { totalScore: { increment: point.points } },
          });

          const capture = await tx.capture.create({
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
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );
    } catch (error) {
      if (!isCaptureConflictError(error)) {
        throw error;
      }

      const existingCapture = await findExistingCapture(userId, arPointId, point.modelUrl);
      if (existingCapture) {
        return {
          alreadyCaptured: true,
          earnedPoints: 0,
          totalScore: existingCapture.totalScoreAfter,
          captureName: point.name,
        };
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034" &&
        attempt < MAX_CAPTURE_RETRIES - 1
      ) {
        continue;
      }

      throw error;
    }
  }

  throw new Error("Failed to record capture");
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

export const adjustScoreForTesting = async (userId: string, delta: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, totalScore: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const nextScore = Math.max(0, user.totalScore + delta);

  return prisma.user.update({
    where: { id: userId },
    data: { totalScore: nextScore },
    select: { id: true, name: true, totalScore: true },
  });
};

export const resetProgressForTesting = async (userId: string) => {
  await prisma.$transaction([
    prisma.capture.deleteMany({ where: { userId } }),
    prisma.user.update({
      where: { id: userId },
      data: { totalScore: 0 },
    }),
  ]);

  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, totalScore: true },
  });
};
