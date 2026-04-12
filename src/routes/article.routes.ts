import { type Application } from 'express';
import articleController from '../controllers/article.controller';
import { authenticate } from '../middleware/authenticate';
import { authorise, scopeToCampus } from '../middleware/authorise';
import { API_ENDPOINTS } from '../constants/app.constants';
import { UserRole } from '../types/auth.types';

/**
 * Register all /api/articles routes on the Express app.
 *
 * Do NOT use `app.use('/api/articles', router)` for a Router that only defines GET/PUT/DELETE —
 * in Express 5, that mount can take precedence over `app.post('/api/articles', ...)` for POST
 * requests, so POST hits the Router (which has no POST handler) → "Cannot POST /api/articles" (404).
 *
 * Register POST and GET as separate `app.post` / `app.get` calls (two Route layers). Chaining
 * `app.route(path).post(...).get(...)` can leave POST unmatched in Express 5 while GET still works.
 */
export function registerArticleRoutes(app: Application): void {
  const base = API_ENDPOINTS.ARTICLES;

  app.post(
    base,
    authenticate,
    authorise([UserRole.MODERATOR]),
    articleController.createArticle.bind(articleController)
  );

  app.get(
    base,
    authenticate,
    authorise([UserRole.MODERATOR]),
    articleController.getArticles.bind(articleController)
  );

  app.get(
    `${base}/:id/history`,
    authenticate,
    authorise([UserRole.MODERATOR]),
    articleController.getArticleEditHistory.bind(articleController)
  );

  app.get(
    `${base}/:id`,
    authenticate,
    authorise([UserRole.MODERATOR]),
    articleController.getArticle.bind(articleController)
  );

  app.put(
    `${base}/:id`,
    authenticate,
    authorise([UserRole.MODERATOR]),
    scopeToCampus,
    articleController.updateArticle.bind(articleController)
  );

  app.patch(
    `${base}/:id`,
    authenticate,
    authorise([UserRole.MODERATOR]),
    scopeToCampus,
    articleController.updateArticle.bind(articleController)
  );

  app.delete(
    `${base}/:id`,
    authenticate,
    authorise([UserRole.MODERATOR]),
    scopeToCampus,
    articleController.deleteArticle.bind(articleController)
  );
}
