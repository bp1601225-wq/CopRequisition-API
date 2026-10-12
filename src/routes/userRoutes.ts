import { Router } from 'express';
import { UserController } from '../controllers/useControlller.js';

export const UserRouter = Router()

UserRouter.get("/users", UserController.GetAllUsers)
UserRouter.post("/users", UserController.CreateUsers)
UserRouter.put("/users/:id", UserController.UpdateUsers)
UserRouter.delete("/users/:id", UserController.DeleteUser)