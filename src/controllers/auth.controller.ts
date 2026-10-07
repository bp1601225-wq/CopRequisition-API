import type { NextFunction, Request, Response } from 'express';

import { authService } from '../services/auth.service.js';
import { sendSuccess } from '../utils/response.js';

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const result = await authService.login({ email, password });

    return sendSuccess(res, 'Login successful', result, 200);
  } catch (error) {
    return next(error);
  }
};
