import { Router } from "express";
import { AuthController } from "./AuthenticationController.js";

export const AuthRoutes = Router()

AuthRoutes.post("/authenticate", AuthController.Login)