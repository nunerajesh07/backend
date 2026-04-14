/**
 * Express app entry: CORS â†’ JSON body â†’ routes â†’ MongoDB.
 * Typical request path: HTTP route â†’ controller â†’ service â†’ Mongoose model.
 */
import './types/auth.types';
import express from 'express';
import mongoose from 'mongoose';
import config from './config/env.config';
import authRoutes from './routes/auth.routes';
import { registerArticleRoutes } from './routes/article.routes';
import articleController from './controllers/article.controller';
import articleService from './services/article.service';
import { authenticate } from './middleware/authenticate';
import { authorise } from './middleware/authorise';
import { API_ENDPOINTS } from './constants/app.constants';
import { Permission } from './types/auth.types';
import { registerAdminRoutes } from './routes/admin.routes';

const app = express();

/** Behind Render / other reverse proxies (correct client IP, secure cookies if added later). */
if (process.env.NODE_ENV === 'production' || process.env.RENDER === 'true') {
  app.set('trust proxy', 1);
}

function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) {
    return true;
  }
  if (config.corsOrigins.includes(origin)) {
    return true;
  }
  try {
    const u = new URL(origin);
    return (
      (u.protocol === 'http:' || u.protocol === 'https:') &&
      (u.hostname === 'localhost' || u.hostname === '127.0.0.1')
    );
  } catch {
    return false;
  }
}

// CORS: always echo the *request* Origin when allowed (never a fixed entry from env â€” avoids 5173 vs 5174 mismatches).
app.use((req, res, next) => {
  const raw = req.headers.origin;
  const origin = typeof raw === 'string' ? raw.trim() : undefined;

  if (origin && isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.append('Vary', 'Origin');
  }

  if (req.method === 'OPTIONS') {
    const requested = req.headers['access-control-request-headers'];
    res.setHeader(
      'Access-Control-Allow-Headers',
      requested || 'authorization, content-type, x-requested-with'
    );
    res.append('Vary', 'Access-Control-Request-Headers');
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(204).send();
  }

  next();
});

app.use(express.json({ strict: false }));

app.get(API_ENDPOINTS.HEALTH, (_req, res) => {
  res.status(200).json({ ok: true, service: 'niat-insider-moderator-api' });
});

// Public analytics (no JWT)
app.post(
  `${API_ENDPOINTS.PUBLIC_ARTICLES}/:id/view`,
  articleController.recordPublicView.bind(articleController)
);

// Routes
app.use(API_ENDPOINTS.AUTH, authRoutes);

app.get(
  API_ENDPOINTS.LEADERBOARD,
  authenticate,
  authorise(Permission.READ),
  articleController.getLeaderboard.bind(articleController)
);

registerAdminRoutes(app);
registerArticleRoutes(app);

// Connect to MongoDB and start server
mongoose
  .connect(config.mongoUri)
  .then(() => {
    console.log('Successfully connected to MongoDB');
    app.listen(config.port, '0.0.0.0', () => {
      console.log(`Server is running on port ${config.port} in ${config.nodeEnv} mode`);
    });

    const runScheduledPublish = (): void => {
      articleService
        .publishDueScheduledArticles()
        .then((n) => {
          if (n > 0) {
            console.log(`Published ${n} scheduled article(s)`);
          }
        })
        .catch((e: unknown) => console.error('Scheduled publish error:', e));
    };

    runScheduledPublish();
    setInterval(runScheduledPublish, 30_000);
  })
  .catch((error: unknown) => {
    console.error('Error connecting to MongoDB:', error);
    const msg = error instanceof Error ? error.message : String(error);
    if (/bad auth|authentication failed|8000/i.test(msg)) {
      console.error(
        'Atlas auth failed: verify Database user + password in Atlas â†’ Database Access. If the password has @ # : / ? etc., URL-encode them in MONGODB_URI, or create a user with a simpler password.'
      );
    }
    process.exit(1);
  });

