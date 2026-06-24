-- AlterTable
ALTER TABLE "ArticleRevision" ADD COLUMN     "authorId" TEXT;

-- AlterTable
ALTER TABLE "EditorialComment" ADD COLUMN     "parentId" TEXT,
ADD COLUMN     "resolvedAt" TIMESTAMP(3),
ADD COLUMN     "resolverId" TEXT;

-- AddForeignKey
ALTER TABLE "ArticleRevision" ADD CONSTRAINT "ArticleRevision_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EditorialComment" ADD CONSTRAINT "EditorialComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "EditorialComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EditorialComment" ADD CONSTRAINT "EditorialComment_resolverId_fkey" FOREIGN KEY ("resolverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
