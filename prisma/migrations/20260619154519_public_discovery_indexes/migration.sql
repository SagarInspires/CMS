-- CreateIndex
CREATE INDEX "Article_status_publishedAt_deletedAt_idx" ON "Article"("status", "publishedAt", "deletedAt");

-- CreateIndex
CREATE INDEX "Article_categoryId_idx" ON "Article"("categoryId");

-- CreateIndex
CREATE INDEX "Article_authorId_idx" ON "Article"("authorId");
