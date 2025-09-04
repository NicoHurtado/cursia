/*
  Warnings:

  - A unique constraint covering the columns `[userId,courseId]` on the table `user_progress` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "user_progress_userId_courseId_key" ON "user_progress"("userId", "courseId");
