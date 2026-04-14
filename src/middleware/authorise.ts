import { Request, Response, NextFunction } from 'express';
import { HttpStatus, Permission, UserRole } from '../types/auth.types';
import { ROLE_PERMISSIONS } from '../constants/roles.constants';
import Article from '../models/Article.model';

export const authorizeRoles = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(HttpStatus.UNAUTHORIZED).json({ success: false, message: 'User not authenticated', statusCode: HttpStatus.UNAUTHORIZED });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(HttpStatus.FORBIDDEN).json({
        success: false,
        message: `Forbidden: role "${req.user.role}" cannot access this resource`,
        statusCode: HttpStatus.FORBIDDEN
      });
      return;
    }
    next();
  };
};

function hasPermission(role: UserRole, required: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(required);
}

export const authorise = (requiredPermission: Permission) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(HttpStatus.UNAUTHORIZED).json({ success: false, message: 'User not authenticated', statusCode: HttpStatus.UNAUTHORIZED });
      return;
    }

    const { role, campus } = req.user;
    if (!hasPermission(role, requiredPermission)) {
      res.status(HttpStatus.FORBIDDEN).json({
        success: false,
        message: `Forbidden: role "${role}" does not include permission "${requiredPermission}"`,
        statusCode: HttpStatus.FORBIDDEN
      });
      return;
    }

    if (role === UserRole.MODERATOR && !(campus ?? '').trim()) {
      res.status(HttpStatus.FORBIDDEN).json({
        success: false,
        message: 'Forbidden: moderator account has no campus assigned for scope checks',
        statusCode: HttpStatus.FORBIDDEN
      });
      return;
    }

    next();
  };
};

/**
 * Ensures moderators only mutate articles in their campus. Admins bypass campus checks entirely.
 * (Campus checks for the moderator role only — never applied when role === ADMIN.)
 */
export const scopeToCampus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(HttpStatus.UNAUTHORIZED).json({ success: false, message: 'User not authenticated', statusCode: HttpStatus.UNAUTHORIZED });
      return;
    }

    if (req.user.role === UserRole.ADMIN) {
      next();
      return;
    }

    const articleId = req.params.id as string;
    if (!articleId) {
      res.status(HttpStatus.NOT_FOUND).json({ success: false, message: 'Resource ID required for scope check', statusCode: HttpStatus.NOT_FOUND });
      return;
    }

    const article = await Article.findById(articleId);
    if (!article) {
      res.status(HttpStatus.NOT_FOUND).json({ success: false, message: 'Article not found', statusCode: HttpStatus.NOT_FOUND });
      return;
    }

    if (article.campus !== (req.user.campus ?? '').trim()) {
      res.status(HttpStatus.FORBIDDEN).json({
        success: false,
        message: 'Forbidden: cannot access articles from another campus',
        statusCode: HttpStatus.FORBIDDEN
      });
      return;
    }

    next();
  } catch {
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Error checking campus scope', statusCode: HttpStatus.INTERNAL_SERVER_ERROR });
  }
};

