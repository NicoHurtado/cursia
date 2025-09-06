/*
  Warnings:

  - You are about to drop the `certificates` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `subscriptions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `checksum` on the `chunks` table. All the data in the column will be lost.
  - You are about to drop the column `chunkId` on the `chunks` table. All the data in the column will be lost.
  - You are about to drop the column `content1` on the `chunks` table. All the data in the column will be lost.
  - You are about to drop the column `content2` on the `chunks` table. All the data in the column will be lost.
  - You are about to drop the column `content3` on the `chunks` table. All the data in the column will be lost.
  - You are about to drop the column `content4` on the `chunks` table. All the data in the column will be lost.
  - You are about to drop the column `totalChunks` on the `chunks` table. All the data in the column will be lost.
  - You are about to alter the column `durationSeconds` on the `generation_logs` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Int`.
  - You are about to drop the column `concepts` on the `modules` table. All the data in the column will be lost.
  - You are about to drop the column `moduleId` on the `modules` table. All the data in the column will be lost.
  - You are about to drop the column `objective` on the `modules` table. All the data in the column will be lost.
  - You are about to drop the column `practicalExercise` on the `modules` table. All the data in the column will be lost.
  - You are about to drop the column `resources` on the `modules` table. All the data in the column will be lost.
  - You are about to drop the column `summary` on the `modules` table. All the data in the column will be lost.
  - You are about to drop the column `videoData` on the `modules` table. All the data in the column will be lost.
  - You are about to drop the column `correctAnswer` on the `quizzes` table. All the data in the column will be lost.
  - You are about to drop the column `explanation` on the `quizzes` table. All the data in the column will be lost.
  - You are about to drop the column `options` on the `quizzes` table. All the data in the column will be lost.
  - You are about to drop the column `question` on the `quizzes` table. All the data in the column will be lost.
  - You are about to drop the column `lastAccessed` on the `user_progress` table. All the data in the column will be lost.
  - You are about to drop the column `startedAt` on the `user_progress` table. All the data in the column will be lost.
  - You are about to drop the column `monthlyUsage` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `chunkId` on the `videos` table. All the data in the column will be lost.
  - You are about to drop the column `embedUrl` on the `videos` table. All the data in the column will be lost.
  - You are about to drop the column `thumbnailUrl` on the `videos` table. All the data in the column will be lost.
  - You are about to drop the column `videoId` on the `videos` table. All the data in the column will be lost.
  - You are about to drop the column `viewCount` on the `videos` table. All the data in the column will be lost.
  - You are about to alter the column `duration` on the `videos` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - Made the column `content` on table `chunks` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `quizOrder` to the `quizzes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `quizzes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `quizzes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `user_progress` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `moduleId` to the `videos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `videoOrder` to the `videos` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "certificates_verificationCode_key";

-- DropIndex
DROP INDEX "certificates_certificateId_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "certificates";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "subscriptions";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "quiz_questions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quizId" TEXT NOT NULL,
    "questionOrder" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "options" TEXT NOT NULL,
    "correctAnswer" INTEGER NOT NULL,
    "explanation" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "quiz_questions_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "quizzes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_chunks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "moduleId" TEXT NOT NULL,
    "chunkOrder" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "videoData" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "chunks_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_chunks" ("chunkOrder", "content", "createdAt", "id", "moduleId", "title", "updatedAt") SELECT "chunkOrder", "content", "createdAt", "id", "moduleId", "title", "updatedAt" FROM "chunks";
DROP TABLE "chunks";
ALTER TABLE "new_chunks" RENAME TO "chunks";
CREATE UNIQUE INDEX "chunks_moduleId_chunkOrder_key" ON "chunks"("moduleId", "chunkOrder");
CREATE TABLE "new_courses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userPrompt" TEXT NOT NULL,
    "userLevel" TEXT NOT NULL,
    "userInterests" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'GENERATING_METADATA',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    "deletedAt" DATETIME,
    "publishedAt" DATETIME,
    "title" TEXT,
    "description" TEXT,
    "prerequisites" TEXT NOT NULL DEFAULT '[]',
    "totalModules" INTEGER NOT NULL DEFAULT 4,
    "moduleList" TEXT NOT NULL DEFAULT '[]',
    "topics" TEXT NOT NULL DEFAULT '[]',
    "introduction" TEXT,
    "finalProjectData" TEXT,
    "totalSizeEstimate" TEXT,
    "language" TEXT NOT NULL DEFAULT 'es',
    CONSTRAINT "courses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_courses" ("completedAt", "courseId", "createdAt", "deletedAt", "description", "finalProjectData", "id", "introduction", "language", "moduleList", "prerequisites", "publishedAt", "status", "title", "topics", "totalModules", "totalSizeEstimate", "updatedAt", "userId", "userInterests", "userLevel", "userPrompt") SELECT "completedAt", "courseId", "createdAt", "deletedAt", "description", "finalProjectData", "id", "introduction", "language", "moduleList", "prerequisites", "publishedAt", "status", "title", "topics", "totalModules", "totalSizeEstimate", "updatedAt", "userId", "userInterests", "userLevel", "userPrompt" FROM "courses";
DROP TABLE "courses";
ALTER TABLE "new_courses" RENAME TO "courses";
CREATE UNIQUE INDEX "courses_courseId_key" ON "courses"("courseId");
CREATE TABLE "new_generation_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "durationSeconds" INTEGER,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "generation_logs_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_generation_logs" ("action", "courseId", "createdAt", "details", "durationSeconds", "id", "message") SELECT "action", "courseId", "createdAt", "details", "durationSeconds", "id", "message" FROM "generation_logs";
DROP TABLE "generation_logs";
ALTER TABLE "new_generation_logs" RENAME TO "generation_logs";
CREATE TABLE "new_modules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "moduleOrder" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "modules_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_modules" ("courseId", "createdAt", "description", "id", "moduleOrder", "title", "updatedAt") SELECT "courseId", "createdAt", "description", "id", "moduleOrder", "title", "updatedAt" FROM "modules";
DROP TABLE "modules";
ALTER TABLE "new_modules" RENAME TO "modules";
CREATE UNIQUE INDEX "modules_courseId_moduleOrder_key" ON "modules"("courseId", "moduleOrder");
CREATE TABLE "new_quizzes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "moduleId" TEXT NOT NULL,
    "quizOrder" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "quizzes_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_quizzes" ("createdAt", "id", "moduleId") SELECT "createdAt", "id", "moduleId" FROM "quizzes";
DROP TABLE "quizzes";
ALTER TABLE "new_quizzes" RENAME TO "quizzes";
CREATE UNIQUE INDEX "quizzes_moduleId_quizOrder_key" ON "quizzes"("moduleId", "quizOrder");
CREATE TABLE "new_user_progress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "currentModuleId" TEXT,
    "currentChunkId" TEXT,
    "completedChunks" TEXT NOT NULL DEFAULT '[]',
    "completedModules" TEXT NOT NULL DEFAULT '[]',
    "quizAttempts" TEXT NOT NULL DEFAULT '[]',
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "user_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_progress_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_user_progress" ("completedAt", "completedChunks", "courseId", "currentChunkId", "currentModuleId", "id", "userId") SELECT "completedAt", "completedChunks", "courseId", "currentChunkId", "currentModuleId", "id", "userId" FROM "user_progress";
DROP TABLE "user_progress";
ALTER TABLE "new_user_progress" RENAME TO "user_progress";
CREATE UNIQUE INDEX "user_progress_userId_courseId_key" ON "user_progress"("userId", "courseId");
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "interests" TEXT NOT NULL DEFAULT '[]',
    "level" TEXT NOT NULL DEFAULT 'BEGINNER',
    "plan" TEXT NOT NULL DEFAULT 'FREE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_users" ("createdAt", "email", "id", "name", "passwordHash", "plan", "updatedAt") SELECT "createdAt", "email", "id", "name", "passwordHash", "plan", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
CREATE TABLE "new_videos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "moduleId" TEXT NOT NULL,
    "videoOrder" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "duration" INTEGER,
    "url" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "videos_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_videos" ("createdAt", "duration", "id", "title", "updatedAt", "url") SELECT "createdAt", "duration", "id", "title", "updatedAt", "url" FROM "videos";
DROP TABLE "videos";
ALTER TABLE "new_videos" RENAME TO "videos";
CREATE UNIQUE INDEX "videos_moduleId_videoOrder_key" ON "videos"("moduleId", "videoOrder");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "quiz_questions_quizId_questionOrder_key" ON "quiz_questions"("quizId", "questionOrder");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");
