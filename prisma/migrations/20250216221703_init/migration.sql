-- CreateTable
CREATE TABLE "Task" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Task_title_key" ON "Task"("title");
