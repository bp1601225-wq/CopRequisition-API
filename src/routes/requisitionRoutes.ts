import { Router } from 'express';
import { RequisitionController } from '../controllers/RequisitionController.js';
RequisitionController

export const RequisitionRouter = Router()

RequisitionRouter.get("/requisitions", RequisitionController.GetAllRequsitionController)


RequisitionRouter.post("/requisitions", RequisitionController.CreateRequisitionControllers)


RequisitionRouter.post("/toner-requisitions", RequisitionController.CreateTonerRequisitionControllers)


RequisitionRouter.put("/requisitions-update", RequisitionController.UpdateRequisitionController)



RequisitionRouter.post("/evidence-submission", RequisitionController.EvidenceSubmissionController)


RequisitionRouter.post("/requisitions-approval/:id", RequisitionController.ApproveRequisitionController)



RequisitionRouter.post("/stores-requisitions", RequisitionController.StoresOperationController)


RequisitionRouter.post("/finance-approval", RequisitionController.FinanceApprovalController)




RequisitionRouter.post("/stores-requisitions", RequisitionController.StoresOperationController)




RequisitionRouter.post("/audit-requisitions", RequisitionController.AuditVerificationController)



//  IT verification
RequisitionRouter.post("/it-verification-requisitions", RequisitionController.ITVerificationController)



RequisitionRouter.post("/issuiance-requisitions/:id", RequisitionController.ReccordIssuanceController)


