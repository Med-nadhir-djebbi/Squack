-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_tweets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "reactionCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "parentId" TEXT,
    CONSTRAINT "tweets_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "tweets_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "tweets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_tweets" ("authorId", "content", "createdAt", "id", "reactionCount", "updatedAt") SELECT "authorId", "content", "createdAt", "id", "reactionCount", "updatedAt" FROM "tweets";
DROP TABLE "tweets";
ALTER TABLE "new_tweets" RENAME TO "tweets";
CREATE INDEX "tweets_authorId_createdAt_idx" ON "tweets"("authorId", "createdAt");
CREATE INDEX "tweets_parentId_createdAt_idx" ON "tweets"("parentId", "createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
