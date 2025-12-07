-- AlterTable: Make userId nullable to preserve audit logs when user is deleted
ALTER TABLE "AuditLog" ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable: Add result field for operation outcome tracking
ALTER TABLE "AuditLog" ADD COLUMN "result" TEXT;

-- Update foreign key constraint from CASCADE to SET NULL
-- First drop the existing constraint
ALTER TABLE "AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_userId_fkey";

-- Then add the new constraint with SET NULL behavior
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
