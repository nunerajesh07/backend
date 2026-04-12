import { Request, Response, NextFunction } from 'express';
import { HttpStatus, UserRole } from '../types/auth.types';
import Article from '../models/Article.model';

/**
 * Ensures the logged-in user has one of the allowed roles (e.g. MODERATOR only).
 */
export const authorise = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(HttpStatus.UNAUTHORIZED).json({ success: false, message: 'User not authenticated', statusCode: HttpStatus.UNAUTHORIZED });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(HttpStatus.FORBIDDEN).json({ success: false, message: 'Insufficient permissions', statusCode: HttpStatus.FORBIDDEN });
      return;
    }

    next();
  };
};

/**
 * For PUT/PATCH/DELETE on a single article: load the article and ensure it belongs to the moderator's campus.
 * Stops someone from guessing another campus's article ID.
 */
export const scopeToCampus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(HttpStatus.UNAUTHORIZED).json({ success: false, message: 'User not authenticated', statusCode: HttpStatus.UNAUTHORIZED });
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

    if (article.campus !== req.user.campus) {
      res.status(HttpStatus.FORBIDDEN).json({ success: false, message: 'Not allowed to modify articles from another campus', statusCode: HttpStatus.FORBIDDEN });
      return;
    }

    next();
  } catch {
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Error checking scope', statusCode: HttpStatus.INTERNAL_SERVER_ERROR });
  }
};
