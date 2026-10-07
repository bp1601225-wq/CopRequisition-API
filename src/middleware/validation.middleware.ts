import type { NextFunction, Request, Response } from 'express';
import type Joi from 'joi';

import { sendError } from '../utils/response.js';

export type ValidationTarget = 'body' | 'params' | 'query';

export const validate = (schema: Joi.ObjectSchema, target: ValidationTarget = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const payload = req[target];
    const { error, value } = schema.validate(payload, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return sendError(res, 'Validation failed', 400, errors);
    }

    req[target] = value;
    return next();
  };
};
