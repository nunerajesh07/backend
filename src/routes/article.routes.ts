import { type Application } from 'express';
import articleController from '../controllers/article.controller';
import { authenticate } from '../middleware/authenticate';
import { authorise, authorizeRoles, scopeToCampus } from '../middleware/authorise';
import { API_ENDPOINTS } from '../constants/app.constants';
import { Permission, UserRole } from '../types/auth.types';

/**
 * Register all /api/articles routes on the Express app.
 *
 * Do NOT use `app.use('/api/articles', router)` for a Router that only defines GET/PUT/DELETE â€”
 * in Express 5, that mount can take precedence over `app.post('/api/articles', ...)` for POST
 * requests, so POST hits the Router (which has no POST handler) â†’ "Cannot POST /api/articles" (404).
 *
 * Register POST and GET as separate `app.post` / `app.get` calls (two Route layers). Chaining
 * `app.route(path).post(...).get(...)` can leave POST unmatched in Express 5 while GET still works.
 */
export function registerArticleRoutes(app: Application): void {
  const base = API_ENDPOINTS.ARTICLES;

  const adminOnly = [authenticate, authorise(Permission.MANAGE_MODERATORS), authorizeRoles(UserRole.ADMIN)];

  app.get(`${base}/all`, ...adminOnly, articleController.getAllArticlesAdmin.bind(articleController));

  app.get(`${base}/count`, ...adminOnly, articleController.getArticleCountAdmin.bind(articleController));

  app.post(base, authenticate, authorise(Permission.WRITE), articleController.createArticle.bind(articleController));

  app.get(base, authenticate, authorise(Permission.READ), articleController.getArticles.bind(articleController));

  app.get(
    `${base}/:id/history`,
    authenticate,
    authorise(Permission.WRITE),
    articleController.getArticleEditHistory.bind(articleController)
  );

  app.get(`${base}/:id`, authenticate, authorise(Permission.READ), articleController.getArticle.bind(articleController));

  app.put(
    `${base}/:id`,
    authenticate,
    authorise(Permission.WRITE),
    scopeToCampus,
    articleController.updateArticle.bind(articleController)
  );

  app.patch(
    `${base}/:id`,
    authenticate,
    authorise(Permission.WRITE),
    scopeToCampus,
    articleController.updateArticle.bind(articleController)
  );

  app.delete(
    `${base}/:id`,
    authenticate,
    authorise(Permission.DELETE),
    scopeToCampus,
    articleController.deleteArticle.bind(articleController)
  );
}

