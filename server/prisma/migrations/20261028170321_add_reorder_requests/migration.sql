-- CreateEnum
CREATE TYPE "ReorderStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'RECEIVED');

-- AlterTable
ALTER TABLE "InventoryItem" ADD COLUMN     "currentStockMinimumPlaceholder" TEXT;

-- CreateTable
CREATE TABLE "ReorderRequest" (
    "id" SERIAL NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "note" TEXT,
    "status" "ReorderStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),
    "inventoryItemId" INTEGER NOT NULL,
    "createdById" INTEGER NOT NULL,
    "reviewedById" INTEGER,
    "receivedById" INTEGER,

    CONSTRAINT "ReorderRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReorderRequest_inventoryItemId_idx" ON "ReorderRequest"("inventoryItemId");

-- CreateIndex
CREATE INDEX "ReorderRequest_status_idx" ON "ReorderRequest"("status");

-- CreateIndex
CREATE INDEX "ReorderRequest_createdById_idx" ON "ReorderRequest"("createdById");

-- AddForeignKey
ALTER TABLE "ReorderRequest" ADD CONSTRAINT "ReorderRequest_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReorderRequest" ADD CONSTRAINT "ReorderRequest_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReorderRequest" ADD CONSTRAINT "ReorderRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReorderRequest" ADD CONSTRAINT "ReorderRequest_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
