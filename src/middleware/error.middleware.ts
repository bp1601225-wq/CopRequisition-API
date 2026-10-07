import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../utils/app-error.js';

export const errorMiddleware = (
  error: Error & { statusCode?: number; errors?: unknown[] },
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const statusCode = error.statusCode ?? 500;
  const errors = error.errors ?? [];

  if (process.env.NODE_ENV !== 'production') {
    console.error(error);
  }

  if (error instanceof AppError) {
    return res.status(statusCode).json({
      success: false,
      message: error.message,
      errors,
    });
  }

  return res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? 'Internal server error' : error.message,
    errors: process.env.NODE_ENV === 'production' ? [] : [error.message],
  });
};
