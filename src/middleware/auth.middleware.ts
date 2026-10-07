import type { NextFunction, Request, Response } from 'express';

import { verifyToken } from '../utils/jwt.js';
import { sendError } from '../utils/response.js';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return sendError(res, 'Authentication required', 401, ['Bearer token is missing']);
  }

  const token = authorizationHeader.split(' ')[1];

  if (!token) {
    return sendError(res, 'Authentication required', 401, ['Bearer token is missing']);
  }

  try {
    const decoded = verifyToken(token);

    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };

    return next();
  } catch {
    return sendError(res, 'Invalid or expired token', 401, ['Authentication failed']);
  }
};
