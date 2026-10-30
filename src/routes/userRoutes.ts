import { Router } from 'express';
import { UserController } from '../controllers/useControlller.js';

export const UserRouter = Router();

UserRouter.get("/users", UserController.GetAllUsers);

UserRouter.post("/users", UserController.CreateUsers);

// Upload multiple users from Excel
UserRouter.post("/users-upload", UserController.UploadUsers);

UserRouter.put("/update-users", UserController.UpdateUsers);

UserRouter.delete("/users/:id", UserController.DeleteUser);