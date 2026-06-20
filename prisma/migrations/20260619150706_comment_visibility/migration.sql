-- CreateEnum
CREATE TYPE "CommentVisibility" AS ENUM ('PUBLIC_TO_AUTHOR', 'INTERNAL');

-- AlterTable
ALTER TABLE "EditorialComment" ADD COLUMN     "visibility" "CommentVisibility" NOT NULL DEFAULT 'PUBLIC_TO_AUTHOR';
