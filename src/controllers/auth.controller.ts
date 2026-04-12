import { Request, Response } from 'express';
import authService from '../services/auth.service';
import { HttpStatus } from '../types/auth.types';

/**
 * Auth HTTP handlers: validate input, call authService, return JSON.
 */

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(HttpStatus.UNAUTHORIZED).json({ success: false, message: 'Email and password are required', statusCode: HttpStatus.UNAUTHORIZED });
        return;
      }

      const result = await authService.login(email, password);
      if (!result) {
        res.status(HttpStatus.UNAUTHORIZED).json({ success: false, message: 'Invalid credentials', statusCode: HttpStatus.UNAUTHORIZED });
        return;
      }

      res.status(HttpStatus.OK).json({ success: true, data: result });
    } catch (error: unknown) {
      console.error('Login error:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Internal server error', statusCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async getMe(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
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
      console.error('GetMe error:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Internal server error', statusCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }
}

export default new AuthController();
