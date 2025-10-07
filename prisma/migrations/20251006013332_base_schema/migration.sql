-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PROPONENT', 'MMT', 'REGULATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "OrganizationType" AS ENUM ('PROPONENT', 'MMT', 'REGULATOR', 'GOVERNMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "OrganizationMembershipRole" AS ENUM ('OWNER', 'MANAGER', 'CONTRIBUTOR', 'REVIEWER', 'OBSERVER');

-- CreateEnum
CREATE TYPE "ProjectAssignmentRole" AS ENUM ('PROPONENT_EDITOR', 'MMT_REVIEWER', 'REGULATOR_VIEWER');

-- CreateEnum
CREATE TYPE "ConditionType" AS ENUM ('ECC', 'EPEP', 'OTHER');

-- CreateEnum
CREATE TYPE "ComplianceCategory" AS ENUM ('AIR', 'WATER', 'NOISE', 'HAZARDOUS_WASTE', 'FINANCIAL', 'SOCIAL', 'INFRASTRUCTURE', 'BIODIVERSITY', 'OTHER');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REVISIONS_REQUIRED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ValidationStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'NEEDS_INFORMATION');

-- CreateEnum
CREATE TYPE "ValidationOutcome" AS ENUM ('APPROVED', 'CONDITIONALLY_APPROVED', 'REQUIRES_CORRECTION', 'REJECTED', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('CMR', 'CMVR', 'SUMMARY', 'OTHER');

-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('PHOTO', 'VIDEO', 'DOCUMENT', 'AUDIO', 'DATASET', 'OTHER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "supabaseId" TEXT NOT NULL,
    "email" TEXT,
    "displayName" TEXT,
    "phoneNumber" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'PROPONENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "OrganizationType" NOT NULL DEFAULT 'PROPONENT',
    "description" TEXT,
    "address" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserOrganization" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "role" "OrganizationMembershipRole" NOT NULL DEFAULT 'CONTRIBUTOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserOrganization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "province" TEXT,
    "municipality" TEXT,
    "barangay" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "eccNumber" TEXT,
    "epepReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectAssignment" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "ProjectAssignmentRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceCondition" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" "ConditionType" NOT NULL DEFAULT 'ECC',
    "code" TEXT,
    "description" TEXT NOT NULL,
    "frequency" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceCondition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "submittedById" TEXT,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "reportingFrom" TIMESTAMP(3),
    "reportingTo" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceRecord" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "conditionId" TEXT,
    "category" "ComplianceCategory" NOT NULL,
    "parameter" TEXT NOT NULL,
    "measuredValue" DECIMAL(12,4),
    "unit" TEXT,
    "baselineValue" DECIMAL(12,4),
    "limitValue" DECIMAL(12,4),
    "recordedAt" TIMESTAMP(3),
    "locationDescription" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT,
    "complianceRecordId" TEXT,
    "type" "EvidenceType" NOT NULL DEFAULT 'OTHER',
    "storageKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT,
    "fileSize" INTEGER,
    "capturedAt" TIMESTAMP(3),
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValidationSession" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "status" "ValidationStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "summary" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ValidationSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValidationEntry" (
    "id" TEXT NOT NULL,
    "validationId" TEXT NOT NULL,
    "complianceRecordId" TEXT,
    "status" "ValidationOutcome" NOT NULL DEFAULT 'APPROVED',
    "fieldValue" DECIMAL(12,4),
    "fieldUnit" TEXT,
    "comparisonData" JSONB,
    "notes" TEXT,
    "recommendation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ValidationEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT,
    "validationId" TEXT,
    "generatedById" TEXT,
    "reportType" "ReportType" NOT NULL,
    "storageKey" TEXT NOT NULL,
    "metadata" JSONB,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DigitalSignature" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "signedById" TEXT NOT NULL,
    "signatureUrl" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deviceInfo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DigitalSignature_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_supabaseId_key" ON "User"("supabaseId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserOrganization_userId_organizationId_key" ON "UserOrganization"("userId", "organizationId");

-- CreateIndex
CREATE INDEX "idx_project_organization" ON "Project"("organizationId");

-- CreateIndex
CREATE INDEX "idx_assignment_user" ON "ProjectAssignment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectAssignment_projectId_userId_role_key" ON "ProjectAssignment"("projectId", "userId", "role");

-- CreateIndex
CREATE INDEX "idx_condition_project" ON "ComplianceCondition"("projectId");

-- CreateIndex
CREATE INDEX "idx_submission_project" ON "Submission"("projectId");

-- CreateIndex
CREATE INDEX "idx_submission_author" ON "Submission"("submittedById");

-- CreateIndex
CREATE INDEX "idx_record_submission" ON "ComplianceRecord"("submissionId");

-- CreateIndex
CREATE INDEX "idx_record_condition" ON "ComplianceRecord"("conditionId");

-- CreateIndex
CREATE INDEX "idx_evidence_submission" ON "Evidence"("submissionId");

-- CreateIndex
CREATE INDEX "idx_evidence_record" ON "Evidence"("complianceRecordId");

-- CreateIndex
CREATE INDEX "idx_validation_submission" ON "ValidationSession"("submissionId");

-- CreateIndex
CREATE INDEX "idx_validation_reviewer" ON "ValidationSession"("reviewerId");

-- CreateIndex
CREATE INDEX "idx_validation_entry_session" ON "ValidationEntry"("validationId");

-- CreateIndex
CREATE INDEX "idx_validation_entry_record" ON "ValidationEntry"("complianceRecordId");

-- CreateIndex
CREATE INDEX "idx_report_submission" ON "Report"("submissionId");

-- CreateIndex
CREATE INDEX "idx_report_validation" ON "Report"("validationId");

-- CreateIndex
CREATE INDEX "idx_signature_report" ON "DigitalSignature"("reportId");

-- CreateIndex
CREATE INDEX "idx_signature_user" ON "DigitalSignature"("signedById");
