import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/env.config';
import { HttpStatus, ITokenPayload } from '../types/auth.types';
import { JWT_CONSTANTS } from '../constants/app.constants';

/**
 * Verifies `Authorization: Bearer <token>` and attaches decoded payload to `req.user`.
 * All protected routes run this first so controllers can trust `req.user.campus` and `req.user.userId`.
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith(JWT_CONSTANTS.TOKEN_PREFIX)) {
    res.status(HttpStatus.UNAUTHORIZED).json({ success: false, message: 'Missing or invalid authentication token', statusCode: HttpStatus.UNAUTHORIZED });
    return;
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    res.status(HttpStatus.UNAUTHORIZED).json({ success: false, message: 'Token not provided in authorization header', statusCode: HttpStatus.UNAUTHORIZED });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as ITokenPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(HttpStatus.UNAUTHORIZED).json({ success: false, message: 'Invalid or expired token', statusCode: HttpStatus.UNAUTHORIZED });
  }
};

