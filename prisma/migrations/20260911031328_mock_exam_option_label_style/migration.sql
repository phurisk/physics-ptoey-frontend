-- CreateEnum
CREATE TYPE "OptionLabelStyle" AS ENUM ('NUMBER', 'LETTER');

-- AlterTable
ALTER TABLE "MockExam" ADD COLUMN     "optionLabelStyle" "OptionLabelStyle" NOT NULL DEFAULT 'NUMBER';
