import { Request, Response } from "express";
import { UserService } from "../services/userService.js";
import ResponseWork from "../handlers/Response.js";
import { RequisitionService } from "../services/RequisitionService.js";
import { RequisitionStatus } from "@prisma/client";

export const RequisitionController = {

async GetAllRequsitionController(req: Request, res: Response) {
  try {
    const user = res.locals.user;

    const statusParam = req.query.status;

const status = typeof statusParam === "string"
  ? statusParam.split(",") as RequisitionStatus[]
  : undefined;

console.log("Controller status:", status);

    const data = await RequisitionService.GetAllRequisition(
      user.id, status
    );



    return ResponseWork.SuccessResponse(
      200,
      "requisition loaded successfully",
      data,
      res
    );

  } catch (error: any) {

console.log(error)

    return ResponseWork.FailureResponse(
      500,
      error.message,
      res
    );
  }
},

async CreateRequisitionControllers(req: Request, res: Response) {
  try {

// console.log("REQ.USER:", req.user);
console.log("RES.LOCALS.USER:", res.locals.user);

const user = res.locals.user

    if (!user) {
      return ResponseWork.FailureResponse(
        401,
        "Unauthorized. Please log in.",
        res
      );
    }

    const incomingData = {
      ...req.body,
      createdById: user.id,
    };

    const OutgoingData =
      await RequisitionService.CreateRequisition(incomingData);

    return ResponseWork.SuccessResponse(
      201,
      "Request created successfully",
      OutgoingData,
      res
    );
  } catch (error: any) {
    console.log(error);

    return ResponseWork.FailureResponse(
      500,
      error.message,
      res
    );
  }
},

async UpdateRequisitionController(req:Request, res:Response){

try {
const incomingData = req.body

const Updated = await RequisitionService.UpdateRequisition(incomingData)

ResponseWork.SuccessResponse(200,
    "Requsition updated succesfully",
    Updated,
    res,
)

   } catch (error:any){
    console.log(error)

    ResponseWork.FailureResponse(500,
        error.message,
        res
    )
}

},

async ApproveRequisitionController(req:Request, res:Response){

try {

const user = res.locals.user

const RequisitionId = req.params.id as string

const Updated = await RequisitionService.ApproveRequisition(
    RequisitionId, user.id
)

ResponseWork.SuccessResponse(200,
    "Requsition Approved succesfully",
    Updated,
    res,
)

   } catch (error:any){
    console.log(error)

    ResponseWork.FailureResponse(500,
        error.message,
        res
    )
}

},


async StoresOperationController(req:Request, res:Response){

try {
const incomingData = req.body


const Updated = await RequisitionService.StoresOperation(
    incomingData
)

ResponseWork.SuccessResponse(200,
    "Stores Requisitions approved",
    Updated,
    res,
)

   } catch (error:any){
    console.log(error)

    ResponseWork.FailureResponse(500,
        error.message,
        res
    )
}

},



async AuditVerificationController(req: Request, res: Response) {
  try {
    const { RequisitionId, comment } = req.body;

    const user = res.locals.user;
    const auditorId = user.id;

    const Updated = await RequisitionService.AuditVeriification(
      RequisitionId,
      auditorId,
      comment
    );

    ResponseWork.SuccessResponse(
      200,
      "Audit verification completed successfully",
      Updated,
      res
    );
  } catch (error: any) {
    console.log(error);

    ResponseWork.FailureResponse(
      500,
      error.message,
      res
    );
  }
},


// Finance 


async FinanceApprovalController(req: Request, res: Response) {
  try {
    const { requisitionId, comment } = req.body;

    const user = res.locals.user;
    const approvedById = user.id;

    const Updated = await RequisitionService.FinanceApproval(
      requisitionId,
      approvedById,
      comment
    );

    ResponseWork.SuccessResponse(
      200,
      "Finace approval completed successfully",
      Updated,
      res
    );
  } catch (error: any) {
    console.log(error);

    ResponseWork.FailureResponse(
      500,
      error.message,
      res
    );
  }
},

async ReccordIssuanceController(req: Request, res: Response) {
  try {
    const requisitionId = req.params.id as string;

    const user = res.locals.user;
    const suppliedById = user.id;

    const Updated = await RequisitionService.RecordIssuance(
      requisitionId,
      suppliedById
    );

    ResponseWork.SuccessResponse(
      200,
      "Items issued out successfully",
      Updated,
      res
    );
  } catch (error: any) {
    console.log(error);

    ResponseWork.FailureResponse(
      500,
      error.message,
      res
    );
  }
}

}