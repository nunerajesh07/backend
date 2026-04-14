import { Request, Response } from 'express';
import authService from '../services/auth.service';
import { HttpStatus } from '../types/auth.types';

function sendServiceError(res: Response, error: unknown): void {
  const err = error as { statusCode?: number; message?: string };
  const statusCode = err.statusCode ?? HttpStatus.INTERNAL_SERVER_ERROR;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    statusCode
  });
}

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body as Record<string, unknown>;
      const email = typeof body.email === 'string' ? body.email : '';
      const password = typeof body.password === 'string' ? body.password : '';

      if (!email || !password) {
        res.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          message: 'Email and password are required',
          statusCode: HttpStatus.UNAUTHORIZED
        });
        return;
      }

      const result = await authService.login(email, password);
      if (!result) {
        res.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          message: 'Invalid credentials',
          statusCode: HttpStatus.UNAUTHORIZED
        });
        return;
      }

      res.status(HttpStatus.OK).json({ success: true, data: result });
    } catch (error: unknown) {
      sendServiceError(res, error);
    }
  }

  async register(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body as Record<string, unknown>;
      const name = typeof body.name === 'string' ? body.name : '';
      const email = typeof body.email === 'string' ? body.email : '';
      const password = typeof body.password === 'string' ? body.password : '';
      const campus = typeof body.campus === 'string' ? body.campus : '';

      const result = await authService.registerStudent({ name, email, password, campus });
      res.status(HttpStatus.CREATED).json({ success: true, data: result });
    } catch (error: unknown) {
      sendServiceError(res, error);
    }
  }

  async getMe(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(HttpStatus.UNAUTHORIZED).json({ success: false, message: 'Not authenticated', statusCode: HttpStatus.UNAUTHORIZED });
        return;
      }

      const user = await authService.getMe(req.user.userId);
      if (!user) {
        res.status(HttpStatus.NOT_FOUND).json({ success: false, message: 'User not found', statusCode: HttpStatus.NOT_FOUND });
        return;
      }

      res.status(HttpStatus.OK).json({ success: true, data: { user } });
    } catch (error: unknown) {
      sendServiceError(res, error);
    }
  }
}

export default new AuthController();

