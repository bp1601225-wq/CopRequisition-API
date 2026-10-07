import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';

import { env } from '../config/env.js';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export const generateToken = (user: { id: string; email: string; role: string }): string => {
  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, env.jwtSecret as Secret, {
    expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'],
  });
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.jwtSecret as Secret) as JwtPayload;
};
