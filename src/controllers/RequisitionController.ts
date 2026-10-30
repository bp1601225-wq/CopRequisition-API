import { Request, Response } from "express";
import { UserService } from "../services/userService.js";
import ResponseWork from "../handlers/Response.js";
import { RequisitionService } from "../services/RequisitionService.js";
import { RequisitionStatus } from "@prisma/client";

export const RequisitionController = {

// GET ALL REQUISITIONS WITH SEARCH AND FILTERS
async GetAllRequsitionController(req: Request, res: Response) {
  try {
    const user = res.locals.user;

    // 1. Get search term from the frontend
    const searchParam = req.query.search;
    const search =
      typeof searchParam === "string" ? searchParam.trim() : undefined;

    // 2. Get date range from the frontend
    const dateRangeParam = req.query.dateRange;
    const dateRange =
      typeof dateRangeParam === "string" ? dateRangeParam : undefined;

    // 3. Get status from the frontend
    const statusParam = req.query.status;

    const status = typeof statusParam === "string"
      ? statusParam.split(",") as RequisitionStatus[]
      : undefined;

    console.log("Search:", search);
    console.log("Date range:", dateRange);
    console.log("Status:", status);

    // 4. Pass all filters to the service
    const data = await RequisitionService.GetAllRequisition(
      user.id,
      search,
      status,
      dateRange
    );

    return ResponseWork.SuccessResponse(
      200,
      "Requisition loaded successfully",
      data,
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



async CreateTonerRequisitionControllers(req: Request, res: Response) {
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
      await RequisitionService.TonerRquisition(incomingData);

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

const user = res.locals.user

const FinalData = {
  ...incomingData,
  createdById:user.id,
  requestedById:user.id
}

const Updated = await RequisitionService.UpdateRequisition(FinalData)

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



async EvidenceSubmissionController(req:Request, res:Response){

try {
const incomingData = req.body

const user = res.locals.user

const FinalData = {
  ...incomingData,
  submittedById:user.id
}

const Updated = await RequisitionService.EvidenceSubmission(FinalData)

ResponseWork.SuccessResponse(200,
    "Evidence submitted succesfully",
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


async ITVerificationController(req: Request, res: Response) {
  try {
    const user = res.locals.user;
    const incomingData = req.body;

    const FinalData = {
      ...incomingData,
      verifiedById: user.id,
    };

    // IMPORTANT: await the service
    const Verified = await RequisitionService.ITVerification(FinalData);

    return ResponseWork.SuccessResponse(
      200,
      "Requisition successfully verified by IT",
      Verified,
      res
    );
  } catch (error: any) {
    console.log("IT Verification Error:", error);

    return ResponseWork.FailureResponse(
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