import { Response } from "express";

const ResponseWork = {

  // =========================
  // Success Response
  // =========================

  SuccessResponse(
    statusCode: number,
    message: string,
    data: any,
    res: Response
  ) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  },


  // =========================
  // Failure Response
  // =========================

  FailureResponse(
    statusCode: number,
    message: string,
    res: Response,
    error?: any
  ) {
    return res.status(statusCode).json({
      success: false,
      message,
      error,
    });
  },

};

export default ResponseWork;