-- Enable Row Level Security (RLS) and define baseline policies for MineComply tables
-- This script is safe to re-run; existing policies are dropped before creation.

begin;

-- Helper expression note: auth.uid() returns UUID, while we store Supabase IDs as text.
-- Always compare using auth.uid()::text when matching against the "supabaseId" column.

-- 1. User table policies ---------------------------------------------------
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their profile" ON "User";
CREATE POLICY "Users can read their profile"
  ON "User"
  FOR SELECT
  TO authenticated
  USING ("supabaseId" = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update their profile" ON "User";
CREATE POLICY "Users can update their profile"
  ON "User"
  FOR UPDATE
  TO authenticated
  USING ("supabaseId" = auth.uid()::text)
  WITH CHECK ("supabaseId" = auth.uid()::text);

-- Inserts and deletes are limited to privileged keys (service role / backend),
-- so no explicit policy is created for them.

-- 2. Organization & membership --------------------------------------------
ALTER TABLE "Organization" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Organization" FORCE ROW LEVEL SECURITY;
ALTER TABLE "UserOrganization" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserOrganization" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members read organizations" ON "Organization";
CREATE POLICY "Members read organizations"
  ON "Organization"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM "UserOrganization" uo
      JOIN "User" u ON uo."userId" = u."id"
      WHERE uo."organizationId" = "Organization"."id"
        AND u."supabaseId" = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Members read membership" ON "UserOrganization";
CREATE POLICY "Members read membership"
  ON "UserOrganization"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM "User" u
      WHERE u."id" = "UserOrganization"."userId"
        AND u."supabaseId" = auth.uid()::text
    )
    OR EXISTS (
      SELECT 1
      FROM "UserOrganization" uo
      JOIN "User" u ON uo."userId" = u."id"
      WHERE uo."organizationId" = "UserOrganization"."organizationId"
        AND u."supabaseId" = auth.uid()::text
    )
  );

-- 3. Projects & assignments ------------------------------------------------
ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Project" FORCE ROW LEVEL SECURITY;
ALTER TABLE "ProjectAssignment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProjectAssignment" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members read projects" ON "Project";
CREATE POLICY "Members read projects"
  ON "Project"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM "ProjectAssignment" pa
      JOIN "User" u ON pa."userId" = u."id"
      WHERE pa."projectId" = "Project"."id"
        AND u."supabaseId" = auth.uid()::text
    )
    OR EXISTS (
      SELECT 1
      FROM "UserOrganization" uo
      JOIN "User" u ON uo."userId" = u."id"
      WHERE uo."organizationId" = "Project"."organizationId"
        AND u."supabaseId" = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Assignments visible to members" ON "ProjectAssignment";
CREATE POLICY "Assignments visible to members"
  ON "ProjectAssignment"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM "User" u
      WHERE u."id" = "ProjectAssignment"."userId"
        AND u."supabaseId" = auth.uid()::text
    )
    OR EXISTS (
      SELECT 1
      FROM "Project" p
      JOIN "ProjectAssignment" pa ON pa."projectId" = p."id"
      JOIN "User" u ON pa."userId" = u."id"
      WHERE p."id" = "ProjectAssignment"."projectId"
        AND u."supabaseId" = auth.uid()::text
    )
  );

-- 4. Compliance conditions & records --------------------------------------
ALTER TABLE "ComplianceCondition" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ComplianceCondition" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Submission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Submission" FORCE ROW LEVEL SECURITY;
ALTER TABLE "ComplianceRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ComplianceRecord" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members read conditions" ON "ComplianceCondition";
CREATE POLICY "Members read conditions"
  ON "ComplianceCondition"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM "Project" p
      JOIN "ProjectAssignment" pa ON pa."projectId" = p."id"
      JOIN "User" u ON pa."userId" = u."id"
      WHERE p."id" = "ComplianceCondition"."projectId"
        AND u."supabaseId" = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Members read submissions" ON "Submission";
CREATE POLICY "Members read submissions"
  ON "Submission"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM "ProjectAssignment" pa
      JOIN "User" u ON pa."userId" = u."id"
      WHERE pa."projectId" = "Submission"."projectId"
        AND u."supabaseId" = auth.uid()::text
    )
    OR EXISTS (
      SELECT 1
      FROM "User" u
      WHERE u."id" = "Submission"."submittedById"
        AND u."supabaseId" = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Members read compliance records" ON "ComplianceRecord";
CREATE POLICY "Members read compliance records"
  ON "ComplianceRecord"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM "Submission" s
      JOIN "ProjectAssignment" pa ON pa."projectId" = s."projectId"
      JOIN "User" u ON pa."userId" = u."id"
      WHERE s."id" = "ComplianceRecord"."submissionId"
        AND u."supabaseId" = auth.uid()::text
    )
  );

-- 5. Evidence --------------------------------------------------------------
ALTER TABLE "Evidence" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Evidence" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members read evidence" ON "Evidence";
CREATE POLICY "Members read evidence"
  ON "Evidence"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM "Submission" s
      JOIN "ProjectAssignment" pa ON pa."projectId" = s."projectId"
      JOIN "User" u ON pa."userId" = u."id"
      WHERE "Evidence"."submissionId" IS NOT NULL
        AND s."id" = "Evidence"."submissionId"
        AND u."supabaseId" = auth.uid()::text
    )
    OR EXISTS (
      SELECT 1
      FROM "ComplianceRecord" cr
      JOIN "Submission" s ON cr."submissionId" = s."id"
      JOIN "ProjectAssignment" pa ON pa."projectId" = s."projectId"
      JOIN "User" u ON pa."userId" = u."id"
      WHERE "Evidence"."complianceRecordId" IS NOT NULL
        AND cr."id" = "Evidence"."complianceRecordId"
        AND u."supabaseId" = auth.uid()::text
    )
  );

-- 6. Validation workflow ---------------------------------------------------
ALTER TABLE "ValidationSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ValidationSession" FORCE ROW LEVEL SECURITY;
ALTER TABLE "ValidationEntry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ValidationEntry" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members read validation sessions" ON "ValidationSession";
CREATE POLICY "Members read validation sessions"
  ON "ValidationSession"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM "Submission" s
      JOIN "ProjectAssignment" pa ON pa."projectId" = s."projectId"
      JOIN "User" u ON pa."userId" = u."id"
      WHERE s."id" = "ValidationSession"."submissionId"
        AND u."supabaseId" = auth.uid()::text
    )
    OR EXISTS (
      SELECT 1
      FROM "User" u
      WHERE u."id" = "ValidationSession"."reviewerId"
        AND u."supabaseId" = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Members read validation entries" ON "ValidationEntry";
CREATE POLICY "Members read validation entries"
  ON "ValidationEntry"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM "ValidationSession" vs
      JOIN "Submission" s ON vs."submissionId" = s."id"
      JOIN "ProjectAssignment" pa ON pa."projectId" = s."projectId"
      JOIN "User" u ON pa."userId" = u."id"
      WHERE vs."id" = "ValidationEntry"."validationId"
        AND u."supabaseId" = auth.uid()::text
    )
  );

-- 7. Reports & digital signatures -----------------------------------------
ALTER TABLE "Report" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Report" FORCE ROW LEVEL SECURITY;
ALTER TABLE "DigitalSignature" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DigitalSignature" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members read reports" ON "Report";
CREATE POLICY "Members read reports"
  ON "Report"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM "Submission" s
      JOIN "ProjectAssignment" pa ON pa."projectId" = s."projectId"
      JOIN "User" u ON pa."userId" = u."id"
      WHERE s."id" = "Report"."submissionId"
        AND u."supabaseId" = auth.uid()::text
    )
    OR EXISTS (
      SELECT 1
      FROM "ValidationSession" vs
      JOIN "Submission" s ON vs."submissionId" = s."id"
      JOIN "ProjectAssignment" pa ON pa."projectId" = s."projectId"
      JOIN "User" u ON pa."userId" = u."id"
      WHERE vs."id" = "Report"."validationId"
        AND u."supabaseId" = auth.uid()::text
    )
    OR EXISTS (
      SELECT 1
      FROM "User" u
      WHERE u."id" = "Report"."generatedById"
        AND u."supabaseId" = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Members read signatures" ON "DigitalSignature";
CREATE POLICY "Members read signatures"
  ON "DigitalSignature"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM "Report" r
      JOIN "Submission" s ON r."submissionId" = s."id"
      JOIN "ProjectAssignment" pa ON pa."projectId" = s."projectId"
      JOIN "User" u ON pa."userId" = u."id"
      WHERE r."id" = "DigitalSignature"."reportId"
        AND u."supabaseId" = auth.uid()::text
    )
    OR EXISTS (
      SELECT 1
      FROM "User" u
      WHERE u."id" = "DigitalSignature"."signedById"
        AND u."supabaseId" = auth.uid()::text
    )
  );

commit;
