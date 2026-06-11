-- AlterTable
ALTER TABLE "tweets" ADD COLUMN     "imageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];
