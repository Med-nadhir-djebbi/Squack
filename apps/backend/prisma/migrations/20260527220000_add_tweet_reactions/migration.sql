-- CreateTable
CREATE TABLE "tweet_reactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kind" TEXT NOT NULL,
    "tweetId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tweet_reactions_tweetId_fkey" FOREIGN KEY ("tweetId") REFERENCES "tweets" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "tweet_reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "tweets_authorId_createdAt_idx" ON "tweets"("authorId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "tweet_reactions_tweetId_userId_key" ON "tweet_reactions"("tweetId", "userId");

-- CreateIndex
CREATE INDEX "tweet_reactions_tweetId_kind_idx" ON "tweet_reactions"("tweetId", "kind");

-- CreateIndex
CREATE INDEX "tweet_reactions_userId_idx" ON "tweet_reactions"("userId");
