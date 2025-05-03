/*
  Warnings:

  - You are about to drop the column `note` on the `Visit` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN "address" TEXT;

-- CreateTable
CREATE TABLE "_VisitCompanions" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_VisitCompanions_A_fkey" FOREIGN KEY ("A") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_VisitCompanions_B_fkey" FOREIGN KEY ("B") REFERENCES "Visit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Visit" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "restaurantId" INTEGER NOT NULL,
    "review" TEXT,
    "rating" INTEGER,
    "price" TEXT,
    "visitedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Visit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Visit_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Visit" ("id", "price", "restaurantId", "review", "userId", "visitedAt") SELECT "id", "price", "restaurantId", "review", "userId", "visitedAt" FROM "Visit";
DROP TABLE "Visit";
ALTER TABLE "new_Visit" RENAME TO "Visit";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "_VisitCompanions_AB_unique" ON "_VisitCompanions"("A", "B");

-- CreateIndex
CREATE INDEX "_VisitCompanions_B_index" ON "_VisitCompanions"("B");
