export interface ICampusRankingRow {
  rank: number;
  campus: string;
  count: number;
}

/** Global campus leaderboard + timeline for multi-series line chart. */
export interface ICampusLeaderboardData {
  rankings: ICampusRankingRow[];
  /** Rows: { label, sortKey, ...[campus]: count } */
  timeline: Array<Record<string, string | number>>;
  /** Campus names in rank order (used as line series keys). */
  campusKeys: string[];
  totalArticles: number;
}

