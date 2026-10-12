import { Router } from 'express';
import { RequisitionController } from '../controllers/RequisitionController.js';
RequisitionController

export const RequisitionRouter = Router()

RequisitionRouter.get("/requisitions", RequisitionController.GetAllRequsitionController)
RequisitionRouter.post("/requisitions", RequisitionController.CreateRequisitionControllers)

RequisitionRouter.put("/requisitions/:id", RequisitionController.UpdateRequisitionController)

RequisitionRouter.post("/requisitions/:id", RequisitionController.ApproveRequisitionController)

RequisitionRouter.post("/requisitions", RequisitionController.StoresOperationController)


RequisitionRouter.post("/requisitions", RequisitionController.AuditVerificationController)


