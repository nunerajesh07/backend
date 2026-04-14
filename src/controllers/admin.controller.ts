import { Request, Response } from 'express';
import adminService from '../services/admin.service';
import { HttpStatus } from '../types/auth.types';

function sendServiceError(res: Response, error: unknown): void {
  const err = error as { statusCode?: number; message?: string };
  const statusCode = err.statusCode ?? HttpStatus.INTERNAL_SERVER_ERROR;
  res.status(statusCode).json({ success: false, message: err.message || 'Server error', statusCode });
}

export class AdminController {
  async createModerator(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body as Record<string, unknown>;
      const email = typeof body.email === 'string' ? body.email : '';
      const password = typeof body.password === 'string' ? body.password : '';
      const campus = typeof body.campus === 'string' ? body.campus : '';

      const user = await adminService.createModerator({ email, password, campus });
      res.status(HttpStatus.CREATED).json({ success: true, message: 'Moderator created', data: { user } });
    } catch (error: unknown) {
      sendServiceError(res, error);
    }
  }

  async getAllModerators(_req: Request, res: Response): Promise<void> {
    try {
      const moderators = await adminService.getAllModerators();
      res.status(HttpStatus.OK).json({ success: true, data: moderators });
    } catch (error: unknown) {
      sendServiceError(res, error);
    }
  }

  async getStudentCount(_req: Request, res: Response): Promise<void> {
    try {
      const count = await adminService.getStudentCount();
      res.status(HttpStatus.OK).json({ success: true, data: { count } });
    } catch (error: unknown) {
      sendServiceError(res, error);
    }
  }

  async deleteModerator(req: Request, res: Response): Promise<void> {
    try {
      await adminService.deleteModerator(req.params.id as string);
      res.status(HttpStatus.OK).json({ success: true, message: 'Moderator deleted', data: null });
    } catch (error: unknown) {
      sendServiceError(res, error);
    }
  }
}

export default new AdminController();

