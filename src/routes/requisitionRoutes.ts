import { Router } from 'express';
import { RequisitionController } from '../controllers/RequisitionController.js';
RequisitionController

export const RequisitionRouter = Router()

RequisitionRouter.get("/requisitions", RequisitionController.GetAllRequsitionController)


RequisitionRouter.post("/requisitions", RequisitionController.CreateRequisitionControllers)

RequisitionRouter.put("/requisitions/:id", RequisitionController.UpdateRequisitionController)

RequisitionRouter.post("/requisitions/:id", RequisitionController.ApproveRequisitionController)

RequisitionRouter.post("/stores-requisitions", RequisitionController.StoresOperationController)


RequisitionRouter.post("/audit-requisitions", RequisitionController.AuditVerificationController)


RequisitionRouter.post("/finance-requisitions", RequisitionController.FinanceApprovalController)


RequisitionRouter.post("/issuiance-requisitions/:id", RequisitionController.ReccordIssuanceController)


