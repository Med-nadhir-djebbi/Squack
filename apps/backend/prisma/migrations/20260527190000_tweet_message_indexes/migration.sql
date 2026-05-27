-- CreateIndex
CREATE INDEX "tweets_authorId_createdAt_idx" ON "tweets"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "messages_senderId_receiverId_createdAt_idx" ON "messages"("senderId", "receiverId", "createdAt");

-- CreateIndex
CREATE INDEX "messages_receiverId_senderId_createdAt_idx" ON "messages"("receiverId", "senderId", "createdAt");
