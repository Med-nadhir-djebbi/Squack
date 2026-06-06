ALTER TABLE "notifications" ADD COLUMN "actorId" TEXT;

CREATE INDEX "notifications_userId_createdAt_idx"
ON "notifications"("userId", "createdAt");

CREATE INDEX "messages_senderId_receiverId_createdAt_idx"
ON "messages"("senderId", "receiverId", "createdAt");

CREATE INDEX "messages_receiverId_senderId_createdAt_idx"
ON "messages"("receiverId", "senderId", "createdAt");
