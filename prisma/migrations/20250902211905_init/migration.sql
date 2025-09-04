-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'FREE',
    "monthlyUsage" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "startAt" DATETIME NOT NULL,
    "endAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userPrompt" TEXT NOT NULL,
    "userLevel" TEXT NOT NULL,
    "userInterests" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'generating_metadata',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    "title" TEXT,
    "description" TEXT,
    "prerequisites" JSONB NOT NULL,
    "totalModules" INTEGER NOT NULL DEFAULT 4,
    "moduleList" JSONB NOT NULL,
    "topics" JSONB NOT NULL,
    "introduction" TEXT,
    "finalProjectData" JSONB,
    "totalSizeEstimate" TEXT,
    "language" TEXT NOT NULL DEFAULT 'es',
    "deletedAt" DATETIME,
    "publishedAt" DATETIME,
    CONSTRAINT "courses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "modules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "moduleOrder" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "concepts" JSONB NOT NULL,
    "summary" TEXT,
    "practicalExercise" JSONB,
    "resources" JSONB,
    "videoData" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "modules_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "chunks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "moduleId" TEXT NOT NULL,
    "chunkId" TEXT NOT NULL,
    "chunkOrder" INTEGER NOT NULL,
    "totalChunks" INTEGER NOT NULL DEFAULT 6,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "content1" TEXT,
    "content2" TEXT,
    "content3" TEXT,
    "content4" TEXT,
    "checksum" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "chunks_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "videos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chunkId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "embedUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "videos_chunkId_fkey" FOREIGN KEY ("chunkId") REFERENCES "chunks" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "quizzes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "moduleId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "correctAnswer" INTEGER NOT NULL,
    "explanation" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "quizzes_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_progress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "currentModuleId" TEXT,
    "currentChunkId" TEXT,
    "completedChunks" JSONB NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAccessed" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "user_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_progress_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_progress_currentModuleId_fkey" FOREIGN KEY ("currentModuleId") REFERENCES "modules" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "user_progress_currentChunkId_fkey" FOREIGN KEY ("currentChunkId") REFERENCES "chunks" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "certificates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "certificateId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "issuedDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "courseTitle" TEXT NOT NULL,
    "userFullName" TEXT NOT NULL,
    "totalModules" INTEGER NOT NULL,
    "completedModules" INTEGER NOT NULL,
    "modulesInfo" JSONB NOT NULL,
    "verificationCode" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "pdfUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "certificates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "certificates_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "generation_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "details" JSONB,
    "durationSeconds" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "generation_logs_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "courses_courseId_key" ON "courses"("courseId");

-- CreateIndex
CREATE INDEX "courses_userId_createdAt_idx" ON "courses"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "modules_courseId_moduleOrder_key" ON "modules"("courseId", "moduleOrder");

-- CreateIndex
CREATE UNIQUE INDEX "chunks_moduleId_chunkOrder_key" ON "chunks"("moduleId", "chunkOrder");

-- CreateIndex
CREATE UNIQUE INDEX "chunks_chunkId_key" ON "chunks"("chunkId");

-- CreateIndex
CREATE UNIQUE INDEX "videos_chunkId_key" ON "videos"("chunkId");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_certificateId_key" ON "certificates"("certificateId");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_verificationCode_key" ON "certificates"("verificationCode");
