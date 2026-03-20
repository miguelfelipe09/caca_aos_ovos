-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "totalScore" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ARPoint" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "targetIndex" INTEGER,
    "targetName" TEXT,
    "modelUrl" TEXT NOT NULL,
    "posX" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "posY" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "posZ" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rotX" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rotY" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rotZ" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "scaleX" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "scaleY" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "scaleZ" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "points" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ARPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Capture" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "arPointId" TEXT NOT NULL,
    "earnedPoints" INTEGER NOT NULL,
    "totalScoreAfter" INTEGER NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Capture_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ARPoint_slug_key" ON "ARPoint"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Capture_userId_arPointId_key" ON "Capture"("userId", "arPointId");

-- AddForeignKey
ALTER TABLE "Capture" ADD CONSTRAINT "Capture_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Capture" ADD CONSTRAINT "Capture_arPointId_fkey" FOREIGN KEY ("arPointId") REFERENCES "ARPoint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
