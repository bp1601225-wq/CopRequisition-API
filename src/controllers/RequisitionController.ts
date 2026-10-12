import { Request, Response } from "express";
import { UserService } from "../services/userService.js";
import ResponseWork from "../handlers/Response.js";
import { RequisitionService } from "../services/RequisitionService.js";

export const RequisitionController = {

async GetAllRequsitionController(req: Request, res: Response) {
  try {


    // 3. Get all users
    const data = await RequisitionService.GetAllRequisition()

    // 4. Return the response
    return ResponseWork.SuccessResponse(
      200,
      "requisition loaded successfully",
      data,
      res
    );

  } catch (error: any) {
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
const incomingData = req.body

const {RequisitionId, hodId} = incomingData

const Updated = await RequisitionService.ApproveRequisition(
    RequisitionId, hodId
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


async AuditVerificationController(req:Request, res:Response){

try {
const incomingData = req.body

const {RequisitionId, hodId} = incomingData


const Updated = await RequisitionService.AuditVerification(
    RequisitionId, hodId
)

ResponseWork.SuccessResponse(200,
    "Auditor Approval succesfull",
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


async FinanceApprovalController(req:Request, res:Response){

try {
const incomingData = req.body

const {RequisitionId, financeId} = incomingData


const Updated = await RequisitionService.AuditVerification(
    RequisitionId, financeId
)

ResponseWork.SuccessResponse(200,
    "finance Approval succesfull",
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






}