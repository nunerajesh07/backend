export enum ArticleStatus {
  PUBLISHED = 'PUBLISHED',
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED'
}

export enum ArticleEditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  PUBLISH = 'PUBLISH',
  SCHEDULE = 'SCHEDULE',
  UNSCHEDULE = 'UNSCHEDULE',
  DRAFT = 'DRAFT'
}

export interface IArticle {
  _id: string;
  title: string;
  body: string;
  category: string;
  campus: string;
  authorId: string;
  status: ArticleStatus;
  imageUrl?: string;
  /** Total recorded views (public / student hits). */
  viewCount: number;
  /** Views in the rolling last 7 days (from view log). */
  viewsLast7Days: number;
  /** When the post went (or will go) live. */
  publishedAt?: string;
  /** If status is SCHEDULED, when to auto-publish (ISO string). */
  scheduledPublishAt?: string;
  /** Last moderator who changed content or publish state. */
  lastEditedBy?: string;
  lastEditedByEmail?: string;
  lastEditedAt?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPaginatedArticles {
  articles: IArticle[];
  total: number;
  page: number;
}

export interface IEditSnapshot {
  title: string;
  body: string;
  category: string;
  status: string;
  imageUrl?: string;
  scheduledPublishAt?: string | null;
}

export interface IArticleEditLogEntry {
  _id: string;
  editedAt: string;
  action: ArticleEditAction;
  editedBy: string;
  editedByEmail?: string;
  snapshot: IEditSnapshot;
}
