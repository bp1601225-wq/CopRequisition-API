import { Request, Response } from "express";
import { UserService } from "../services/userService.js";
import ResponseWork from "../handlers/Response.js";

export const UserController = {

async GetAllUsers(req: Request, res: Response) {
  try {


    // 3. Get all users
    const data = await UserService.GetAllUsers();

    // 4. Return the response
    return ResponseWork.SuccessResponse(
      200,
      "Users loaded successfully",
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

async CreateUsers(req:Request, res:Response){

    try {
const incomingData = req.body

const OutgoingData = await UserService.CreateUsers(incomingData)

ResponseWork.SuccessResponse(201,
"User created successfully",
OutgoingData,
res    
)
    } catch (error:any){
        console.log(error)

ResponseWork.FailureResponse(500,
    error.message, 
    res
)
    }

  },

async UpdateUsers(req:Request, res:Response){

try {
const incomingData = req.body

const Updated = await UserService.UpdateUser(incomingData)

ResponseWork.SuccessResponse(200,
    "user updated succesfully",
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

async DeleteUser(req:Request, res:Response){
try {
const id = req.params.id as string

 await UserService.DeleteUser(id)
res.status(200).json({
    message:"user delated succesfully"
})


   } catch (error:any){
    console.log(error)

    ResponseWork.FailureResponse(500,
        error.message,
        res
    )
}
}





}