import { Request, Response } from 'express';
import articleService, { type PublishIntent } from '../services/article.service';
import { HttpStatus } from '../types/auth.types';

/**
 * Article HTTP layer: each method reads `req`, calls `articleService`, sends JSON.
 * Campus scoping uses `req.user.campus` from the JWT — never trust campus from the request body.
 */

function parsePublishIntent(raw: unknown): PublishIntent | undefined {
  if (typeof raw !== 'string') return undefined;
  if (raw === 'draft' || raw === 'now' || raw === 'schedule') return raw;
  return undefined;
}

/** Campus always comes from the JWT — trim so it matches DB values (no accidental spaces). */
function campusFromUser(req: Request): string {
  return (req.user?.campus ?? '').trim();
}

/** Turn service errors (with optional statusCode) into a JSON response. */
function sendServiceError(res: Response, error: unknown): void {
  const err = error as { statusCode?: number; message?: string };
  const statusCode = err.statusCode ?? HttpStatus.INTERNAL_SERVER_ERROR;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Server error',
    statusCode
  });
}

export class ArticleController {
  async createArticle(req: Request, res: Response): Promise<void> {
    try {
      const b = req.body as Record<string, unknown>;
      const title = typeof b.title === 'string' ? b.title : '';
      const body = typeof b.body === 'string' ? b.body : '';
      const category = typeof b.category === 'string' ? b.category : '';
      const imageUrlRaw = typeof b.imageUrl === 'string' ? b.imageUrl : undefined;
      const publishIntent = parsePublishIntent(b.publishIntent) ?? 'now';
      const scheduledPublishAt =
        typeof b.scheduledPublishAt === 'string' || b.scheduledPublishAt === null ? b.scheduledPublishAt : undefined;

      const campus = campusFromUser(req);
      const authorId = req.user!.userId;

      const createInput: Parameters<typeof articleService.createArticle>[0] = {
        title,
        body,
        category,
        publishIntent
      };
      if (scheduledPublishAt !== undefined) {
        createInput.scheduledPublishAt = scheduledPublishAt === null ? null : scheduledPublishAt;
      }
      if (imageUrlRaw !== undefined) {
        createInput.imageUrl = imageUrlRaw;
      }

      const article = await articleService.createArticle(createInput, campus, authorId);
      res.status(HttpStatus.CREATED).json({
        success: true,
        message: 'Article created successfully',
        article
      });
    } catch (error: unknown) {
      sendServiceError(res, error);
    }
  }

  async getLeaderboard(_req: Request, res: Response): Promise<void> {
    try {
      const data = await articleService.getGlobalCampusLeaderboard();
      res.status(HttpStatus.OK).json({ success: true, data });
    } catch (error: unknown) {
      sendServiceError(res, error);
    }
  }

  async getArticles(req: Request, res: Response): Promise<void> {
    try {
      const campus = campusFromUser(req);
      const articles = await articleService.getArticlesByCampus(campus);
      res.status(HttpStatus.OK).json({ success: true, data: articles });
    } catch (error: unknown) {
      sendServiceError(res, error);
    }
  }

  async getArticleEditHistory(req: Request, res: Response): Promise<void> {
    try {
      const campus = campusFromUser(req);
      const history = await articleService.getArticleEditHistory(req.params.id as string, campus);
      res.status(HttpStatus.OK).json({ success: true, data: history });
    } catch (error: unknown) {
      sendServiceError(res, error);
    }
  }

  async getArticle(req: Request, res: Response): Promise<void> {
    try {
      const campus = campusFromUser(req);
      const article = await articleService.getArticleById(req.params.id as string, campus);
      if (!article) {
        res.status(HttpStatus.NOT_FOUND).json({ success: false, message: 'Article not found', statusCode: HttpStatus.NOT_FOUND });
        return;
      }
      res.status(HttpStatus.OK).json({ success: true, data: article });
    } catch (error: unknown) {
      sendServiceError(res, error);
    }
  }

  async updateArticle(req: Request, res: Response): Promise<void> {
    try {
      const campus = campusFromUser(req);
      const editorId = req.user!.userId;
      const b = req.body as Record<string, unknown>;
      const updates: Partial<{
        title: string;
        body: string;
        category: string;
        imageUrl: string;
        publishIntent: PublishIntent;
        scheduledPublishAt: string | null;
      }> = {};
      if (typeof b.title === 'string') updates.title = b.title;
      if (typeof b.body === 'string') updates.body = b.body;
      if (typeof b.category === 'string') updates.category = b.category;
      if (typeof b.imageUrl === 'string') updates.imageUrl = b.imageUrl;
      const pi = parsePublishIntent(b.publishIntent);
      if (pi !== undefined) updates.publishIntent = pi;
      if (typeof b.scheduledPublishAt === 'string') updates.scheduledPublishAt = b.scheduledPublishAt;
      if (b.scheduledPublishAt === null) updates.scheduledPublishAt = null;

      const updatedArticle = await articleService.updateArticle(req.params.id as string, campus, editorId, updates);
      res.status(HttpStatus.OK).json({ success: true, data: updatedArticle });
    } catch (error: unknown) {
      sendServiceError(res, error);
    }
  }

  async deleteArticle(req: Request, res: Response): Promise<void> {
    try {
      const campus = campusFromUser(req);
      await articleService.deleteArticle(req.params.id as string, campus);
      res.status(HttpStatus.OK).json({ success: true, data: null });
    } catch (error: unknown) {
      sendServiceError(res, error);
    }
  }

  /** Public view counter (student app / shared links). No login required. */
  async recordPublicView(req: Request, res: Response): Promise<void> {
    try {
      await articleService.recordView(req.params.id as string);
      res.status(HttpStatus.NO_CONTENT).send();
    } catch (error: unknown) {
      sendServiceError(res, error);
    }
  }
}

export default new ArticleController();
