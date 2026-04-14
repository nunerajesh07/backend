import { Request, Response } from 'express';
import articleService, { type ArticleActor, type PublishIntent } from '../services/article.service';
import { HttpStatus, UserRole } from '../types/auth.types';
import { ArticleStatus } from '../types/article.types';

/**
 * Article HTTP layer: each method reads `req`, calls `articleService`, sends JSON.
 * Campus scoping uses `req.user.campus` from the JWT â€” never trust campus from the request body.
 */

function parsePublishIntent(raw: unknown): PublishIntent | undefined {
  if (typeof raw !== 'string') return undefined;
  if (raw === 'draft' || raw === 'now' || raw === 'schedule') return raw;
  return undefined;
}

function actorFromRequest(req: Request): ArticleActor {
  const u = req.user!;
  return {
    userId: u.userId,
    role: u.role,
    campus: u.campus ?? ''
  };
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
  async getAllArticlesAdmin(req: Request, res: Response): Promise<void> {
    try {
      const campus = typeof req.query.campus === 'string' ? req.query.campus : undefined;
      const { articles, total } = await articleService.listAllArticlesForAdmin(campus);
      res.status(HttpStatus.OK).json({ success: true, data: { articles, total } });
    } catch (error: unknown) {
      sendServiceError(res, error);
    }
  }

  async getArticleCountAdmin(_req: Request, res: Response): Promise<void> {
    try {
      const data = await articleService.getArticleCountSummary();
      res.status(HttpStatus.OK).json({ success: true, data });
    } catch (error: unknown) {
      sendServiceError(res, error);
    }
  }

  async createArticle(req: Request, res: Response): Promise<void> {
    try {
      const b = req.body as Record<string, unknown>;
      const actor = actorFromRequest(req);

      if (actor.role === UserRole.ADMIN) {
        const statusRaw = b.status;
        const campusRaw = b.campus;
        const titleA = typeof b.title === 'string' ? b.title : '';
        const bodyA = typeof b.body === 'string' ? b.body : '';
        const categoryA = typeof b.category === 'string' ? b.category : '';
        if (
          (statusRaw === ArticleStatus.PUBLISHED || statusRaw === ArticleStatus.DRAFT) &&
          typeof campusRaw === 'string' &&
          campusRaw.trim() !== '' &&
          titleA.trim() &&
          bodyA.trim() &&
          categoryA.trim()
        ) {
          const article = await articleService.createArticleAdmin(
            {
              title: titleA,
              body: bodyA,
              category: categoryA,
              campus: campusRaw,
              status: statusRaw as ArticleStatus
            },
            actor.userId
          );
          res.status(HttpStatus.CREATED).json({
            success: true,
            message: 'Article created successfully',
            article
          });
          return;
        }
      }

      const title = typeof b.title === 'string' ? b.title : '';
      const body = typeof b.body === 'string' ? b.body : '';
      const category = typeof b.category === 'string' ? b.category : '';
      const imageUrlRaw = typeof b.imageUrl === 'string' ? b.imageUrl : undefined;
      const publishIntent = parsePublishIntent(b.publishIntent) ?? 'now';
      const scheduledPublishAt =
        typeof b.scheduledPublishAt === 'string' || b.scheduledPublishAt === null ? b.scheduledPublishAt : undefined;
      const createInput: Parameters<typeof articleService.createArticleForActor>[0] = {
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

      let adminTargetCampus: string | undefined;
      if (actor.role === UserRole.ADMIN) {
        const rawCampus = b.campus;
        adminTargetCampus = typeof rawCampus === 'string' ? rawCampus : undefined;
      }

      const article = await articleService.createArticleForActor(createInput, actor, adminTargetCampus);
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
      const articles = await articleService.listArticlesForActor(actorFromRequest(req));
      res.status(HttpStatus.OK).json({ success: true, data: articles });
    } catch (error: unknown) {
      sendServiceError(res, error);
    }
  }

  async getArticleEditHistory(req: Request, res: Response): Promise<void> {
    try {
      const history = await articleService.getArticleEditHistoryForActor(req.params.id as string, actorFromRequest(req));
      res.status(HttpStatus.OK).json({ success: true, data: history });
    } catch (error: unknown) {
      sendServiceError(res, error);
    }
  }

  async getArticle(req: Request, res: Response): Promise<void> {
    try {
      const article = await articleService.getArticleForActor(req.params.id as string, actorFromRequest(req));
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
      const actor = actorFromRequest(req);
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

      const updatedArticle = await articleService.updateArticleForActor(req.params.id as string, actor, updates);
      res.status(HttpStatus.OK).json({ success: true, data: updatedArticle });
    } catch (error: unknown) {
      sendServiceError(res, error);
    }
  }

  async deleteArticle(req: Request, res: Response): Promise<void> {
    try {
      await articleService.deleteArticleForActor(req.params.id as string, actorFromRequest(req));
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

