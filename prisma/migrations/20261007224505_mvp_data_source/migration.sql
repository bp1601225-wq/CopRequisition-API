-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STAFF', 'HOD', 'STORES', 'AUDIT', 'FINANCE', 'ADMIN');

-- CreateEnum
CREATE TYPE "RequisitionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'HOD_APPROVED', 'AUDIT_CERTIFIED', 'FINANCE_APPROVED', 'ISSUED', 'COMPLETED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ApprovalDecision" AS ENUM ('APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AuditDecision" AS ENUM ('CERTIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "FinanceDecision" AS ENUM ('APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RequisitionAction" AS ENUM ('CREATED', 'SUBMITTED', 'HOD_APPROVED', 'HOD_REJECTED', 'AUDIT_CERTIFIED', 'AUDIT_REJECTED', 'FINANCE_APPROVED', 'FINANCE_REJECTED', 'ISSUED', 'RECEIVED', 'COMPLETED', 'REJECTED');

-- CreateTable
CREATE TABLE "Department" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STAFF',
    "departmentId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Requisition" (
    "id" UUID NOT NULL,
    "requisitionNo" TEXT NOT NULL,
    "departmentId" UUID NOT NULL,
    "createdById" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "RequisitionStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Requisition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequisitionItem" (
    "id" UUID NOT NULL,
    "requisitionId" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "quantityRequested" INTEGER NOT NULL,
    "quantityIssued" INTEGER,
    "unitCost" DECIMAL(12,2),
    "totalCost" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequisitionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequisitionApproval" (
    "id" UUID NOT NULL,
    "requisitionId" UUID NOT NULL,
    "approvedById" UUID NOT NULL,
    "decision" "ApprovalDecision" NOT NULL,
    "comment" TEXT,
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequisitionApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditVerification" (
    "id" UUID NOT NULL,
    "requisitionId" UUID NOT NULL,
    "auditorId" UUID NOT NULL,
    "decision" "AuditDecision" NOT NULL,
    "comment" TEXT,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceApproval" (
    "id" UUID NOT NULL,
    "requisitionId" UUID NOT NULL,
    "approvedById" UUID NOT NULL,
    "decision" "FinanceDecision" NOT NULL,
    "comment" TEXT,
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinanceApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequisitionIssuance" (
    "id" UUID NOT NULL,
    "requisitionId" UUID NOT NULL,
    "suppliedById" UUID NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequisitionIssuance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequisitionReceipt" (
    "id" UUID NOT NULL,
    "requisitionId" UUID NOT NULL,
    "recipientId" UUID NOT NULL,
    "signature" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequisitionReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequisitionHistory" (
    "id" UUID NOT NULL,
    "requisitionId" UUID NOT NULL,
    "performedById" UUID NOT NULL,
    "action" "RequisitionAction" NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequisitionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Department_name_key" ON "Department"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Requisition_requisitionNo_key" ON "Requisition"("requisitionNo");

-- CreateIndex
CREATE UNIQUE INDEX "RequisitionApproval_requisitionId_key" ON "RequisitionApproval"("requisitionId");

-- CreateIndex
CREATE UNIQUE INDEX "AuditVerification_requisitionId_key" ON "AuditVerification"("requisitionId");

-- CreateIndex
CREATE UNIQUE INDEX "FinanceApproval_requisitionId_key" ON "FinanceApproval"("requisitionId");

-- CreateIndex
CREATE UNIQUE INDEX "RequisitionIssuance_requisitionId_key" ON "RequisitionIssuance"("requisitionId");

-- CreateIndex
CREATE UNIQUE INDEX "RequisitionReceipt_requisitionId_key" ON "RequisitionReceipt"("requisitionId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Requisition" ADD CONSTRAINT "Requisition_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Requisition" ADD CONSTRAINT "Requisition_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequisitionItem" ADD CONSTRAINT "RequisitionItem_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "Requisition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequisitionApproval" ADD CONSTRAINT "RequisitionApproval_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "Requisition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequisitionApproval" ADD CONSTRAINT "RequisitionApproval_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditVerification" ADD CONSTRAINT "AuditVerification_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "Requisition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditVerification" ADD CONSTRAINT "AuditVerification_auditorId_fkey" FOREIGN KEY ("auditorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceApproval" ADD CONSTRAINT "FinanceApproval_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "Requisition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceApproval" ADD CONSTRAINT "FinanceApproval_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequisitionIssuance" ADD CONSTRAINT "RequisitionIssuance_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "Requisition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequisitionIssuance" ADD CONSTRAINT "RequisitionIssuance_suppliedById_fkey" FOREIGN KEY ("suppliedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequisitionReceipt" ADD CONSTRAINT "RequisitionReceipt_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "Requisition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequisitionReceipt" ADD CONSTRAINT "RequisitionReceipt_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequisitionHistory" ADD CONSTRAINT "RequisitionHistory_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "Requisition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequisitionHistory" ADD CONSTRAINT "RequisitionHistory_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
