-- CreateTable
CREATE TABLE "course_ratings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "course_ratings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "course_ratings_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "totalRatings" INTEGER NOT NULL DEFAULT 0,
    "averageRating" REAL NOT NULL DEFAULT 0,
    "totalCompletions" INTEGER NOT NULL DEFAULT 0,
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
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "course_ratings_userId_courseId_key" ON "course_ratings"("userId", "courseId");
