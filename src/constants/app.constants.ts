export const API_ENDPOINTS = {
  /** GET — no auth; use to verify API is reachable (e.g. after Vite proxy). */
  HEALTH: '/api/health',
  AUTH: '/api/auth',
  ARTICLES: '/api/articles',
  /** GET — all campuses article counts (moderator/admin). */
  LEADERBOARD: '/api/leaderboard',
  /** POST `/api/public/articles/:id/view` — record view (no auth). */
  PUBLIC_ARTICLES: '/api/public/articles'
};

export const JWT_CONSTANTS = {
  TOKEN_PREFIX: 'Bearer'
};
