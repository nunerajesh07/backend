/**
 * All article business rules and database access live here.
 * Controllers stay thin: they validate HTTP input and call these methods.
 */
import mongoose from 'mongoose';
import Article from '../models/Article.model';
import type { IArticleDocument } from '../models/Article.model';
import ArticleView from '../models/ArticleView.model';
import ArticleEditLog from '../models/ArticleEditLog.model';
import {
  ArticleEditAction,
  ArticleStatus,
  type IArticle,
  type IArticleEditLogEntry,
  type IEditSnapshot
} from '../types/article.types';
import type { ICampusLeaderboardData } from '../types/leaderboard.types';
import { HttpStatus } from '../types/auth.types';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export type PublishIntent = 'draft' | 'now' | 'schedule';

function parseScheduledDate(raw: string | undefined | null): Date | undefined {
  if (!raw || typeof raw !== 'string') return undefined;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return undefined;
  return d;
}

export class ArticleService {
  private snapshotFromDoc(doc: IArticleDocument): IEditSnapshot {
    const snap: IEditSnapshot = {
      title: doc.title,
      body: doc.body,
      category: doc.category,
      status: doc.status,
      scheduledPublishAt: doc.scheduledPublishAt ? doc.scheduledPublishAt.toISOString() : null
    };
    const img = doc.imageUrl?.trim();
    if (img) snap.imageUrl = img;
    return snap;
  }

  private async appendEditLog(
    articleId: mongoose.Types.ObjectId,
    campus: string,
    editedBy: string,
    action: ArticleEditAction,
    snapshot: IEditSnapshot
  ): Promise<void> {
    await ArticleEditLog.create({
      articleId,
      campus,
      editedBy: new mongoose.Types.ObjectId(editedBy),
      editedAt: new Date(),
      action,
      snapshot
    });
  }

  private mapLeanToIArticle(doc: Record<string, unknown>, viewsLast7Days: number): IArticle {
    const id = doc._id as mongoose.Types.ObjectId;
    const authorId = doc.authorId as mongoose.Types.ObjectId;
    const lastEditedByRaw = doc.lastEditedBy as
      | { _id?: mongoose.Types.ObjectId; email?: string }
      | mongoose.Types.ObjectId
      | undefined
      | null;

    let lastEditedById: string | undefined;
    let lastEditedByEmail: string | undefined;
    if (lastEditedByRaw && typeof lastEditedByRaw === 'object' && 'email' in lastEditedByRaw) {
      const le = lastEditedByRaw as { _id: mongoose.Types.ObjectId; email?: string };
      lastEditedById = le._id.toString();
      lastEditedByEmail = le.email;
    } else if (lastEditedByRaw) {
      lastEditedById = (lastEditedByRaw as mongoose.Types.ObjectId).toString();
    }

    const publishedAt = doc.publishedAt as Date | null | undefined;
    const scheduledPublishAt = doc.scheduledPublishAt as Date | null | undefined;
    const lastEditedAt = doc.lastEditedAt as Date | undefined;
    const createdAt = doc.createdAt as Date;
    const updatedAt = (doc.updatedAt as Date) ?? createdAt;

    const base: IArticle = {
      _id: id.toString(),
      title: doc.title as string,
      body: doc.body as string,
      category: doc.category as string,
      campus: doc.campus as string,
      authorId: authorId.toString(),
      status: (doc.status as ArticleStatus | undefined) ?? ArticleStatus.PUBLISHED,
      viewCount: typeof doc.viewCount === 'number' ? doc.viewCount : 0,
      viewsLast7Days,
      createdAt,
      updatedAt
    };
    const img = typeof doc.imageUrl === 'string' ? doc.imageUrl.trim() : '';
    if (img) base.imageUrl = img;
    if (publishedAt != null) base.publishedAt = publishedAt.toISOString();
    if (scheduledPublishAt != null) base.scheduledPublishAt = scheduledPublishAt.toISOString();
    if (lastEditedById) {
      base.lastEditedBy = lastEditedById;
      if (lastEditedByEmail) base.lastEditedByEmail = lastEditedByEmail;
    }
    if (lastEditedAt) base.lastEditedAt = lastEditedAt.toISOString();
    return base;
  }

  private async getViewsLast7DaysForArticleIds(ids: string[]): Promise<Map<string, number>> {
    if (ids.length === 0) return new Map();
    const since = new Date(Date.now() - SEVEN_DAYS_MS);
    const oids = ids.map((i) => new mongoose.Types.ObjectId(i));
    const rows = await ArticleView.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
      { $match: { articleId: { $in: oids }, createdAt: { $gte: since } } },
      { $group: { _id: '$articleId', count: { $sum: 1 } } }
    ]);
    const map = new Map<string, number>();
    for (const row of rows) {
      map.set(row._id.toString(), row.count);
    }
    return map;
  }

  async createArticle(
    input: {
      title: string;
      body: string;
      category: string;
      imageUrl?: string;
      publishIntent: PublishIntent;
      scheduledPublishAt?: string | null;
    },
    campus: string,
    authorId: string
  ): Promise<IArticle> {
    const title = input.title.trim();
    const body = input.body.trim();
    const category = input.category.trim();
    if (!title || !body || !category) {
      throw { statusCode: HttpStatus.BAD_REQUEST, message: 'Title, body, and category are required' };
    }

    let imageUrl: string | undefined;
    if (input.imageUrl !== undefined) {
      const trimmed = input.imageUrl.trim();
      imageUrl = trimmed === '' ? undefined : trimmed;
    }

    const scheduleDate = parseScheduledDate(input.scheduledPublishAt ?? undefined);
    let status: ArticleStatus;
    let scheduled: Date | undefined;
    let publishedAt: Date | undefined;

    if (input.publishIntent === 'draft') {
      status = ArticleStatus.DRAFT;
    } else if (input.publishIntent === 'schedule') {
      if (!scheduleDate) {
        throw { statusCode: HttpStatus.BAD_REQUEST, message: 'scheduledPublishAt is required when scheduling' };
      }
      if (scheduleDate.getTime() <= Date.now()) {
        throw { statusCode: HttpStatus.BAD_REQUEST, message: 'Scheduled time must be in the future' };
      }
      status = ArticleStatus.SCHEDULED;
      scheduled = scheduleDate;
    } else {
      status = ArticleStatus.PUBLISHED;
      publishedAt = new Date();
    }

    const createPayload: Record<string, unknown> = {
      title,
      body,
      category,
      campus,
      authorId: new mongoose.Types.ObjectId(authorId),
      status,
      viewCount: 0,
      lastEditedBy: new mongoose.Types.ObjectId(authorId),
      lastEditedAt: new Date()
    };
    if (imageUrl !== undefined) createPayload.imageUrl = imageUrl;
    if (scheduled !== undefined) createPayload.scheduledPublishAt = scheduled;
    if (publishedAt !== undefined) createPayload.publishedAt = publishedAt;

    const doc = await Article.create(createPayload);

    await this.appendEditLog(doc._id, campus, authorId, ArticleEditAction.CREATE, this.snapshotFromDoc(doc));

    const populated = await Article.findById(doc._id).populate('lastEditedBy', 'email').lean();
    if (!populated) {
      throw { statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to load created article' };
    }
    const viewsMap = await this.getViewsLast7DaysForArticleIds([doc._id.toString()]);
    return this.mapLeanToIArticle(populated as unknown as Record<string, unknown>, viewsMap.get(doc._id.toString()) ?? 0);
  }

  async getArticlesByCampus(campus: string): Promise<IArticle[]> {
    const c = campus.trim();
    const docs = await Article.find({ campus: c })
      .populate('lastEditedBy', 'email')
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean();
    const ids = docs.map((d) => d._id.toString());
    const viewsMap = await this.getViewsLast7DaysForArticleIds(ids);
    return docs.map((d) =>
      this.mapLeanToIArticle(d as unknown as Record<string, unknown>, viewsMap.get(d._id.toString()) ?? 0)
    );
  }

  async getArticleById(id: string, campus: string): Promise<IArticle | null> {
    const doc = await Article.findOne({ _id: id, campus }).populate('lastEditedBy', 'email').lean();
    if (!doc) return null;
    const viewsMap = await this.getViewsLast7DaysForArticleIds([id]);
    return this.mapLeanToIArticle(doc as unknown as Record<string, unknown>, viewsMap.get(id) ?? 0);
  }

  async updateArticle(
    id: string,
    campus: string,
    editorId: string,
    updates: Partial<{
      title: string;
      body: string;
      category: string;
      imageUrl: string;
      publishIntent: PublishIntent;
      scheduledPublishAt: string | null;
    }>
  ): Promise<IArticle> {
    const article = await Article.findById(id);
    if (!article) {
      throw { statusCode: HttpStatus.NOT_FOUND, message: 'Article not found' };
    }

    if (article.campus !== campus) {
      throw { statusCode: HttpStatus.FORBIDDEN, message: 'Not allowed to update articles from another campus' };
    }

    if (updates.title !== undefined) article.title = updates.title;
    if (updates.body !== undefined) article.body = updates.body;
    if (updates.category !== undefined) article.category = updates.category;
    if (updates.imageUrl !== undefined) {
      const trimmed = updates.imageUrl.trim();
      article.set('imageUrl', trimmed === '' ? undefined : trimmed);
    }

    let action: ArticleEditAction = ArticleEditAction.UPDATE;

    if (updates.publishIntent !== undefined) {
      const scheduleDate = parseScheduledDate(updates.scheduledPublishAt ?? undefined);

      if (updates.publishIntent === 'draft') {
        article.status = ArticleStatus.DRAFT;
        article.scheduledPublishAt = null;
        article.publishedAt = null;
        action = ArticleEditAction.DRAFT;
      } else if (updates.publishIntent === 'now') {
        article.status = ArticleStatus.PUBLISHED;
        article.scheduledPublishAt = null;
        article.publishedAt = new Date();
        action = ArticleEditAction.PUBLISH;
      } else if (updates.publishIntent === 'schedule') {
        if (!scheduleDate) {
          throw { statusCode: HttpStatus.BAD_REQUEST, message: 'scheduledPublishAt is required when scheduling' };
        }
        if (scheduleDate.getTime() <= Date.now()) {
          throw { statusCode: HttpStatus.BAD_REQUEST, message: 'Scheduled time must be in the future' };
        }
        article.status = ArticleStatus.SCHEDULED;
        article.scheduledPublishAt = scheduleDate;
        article.publishedAt = null;
        action = ArticleEditAction.SCHEDULE;
      }
    }

    article.lastEditedBy = new mongoose.Types.ObjectId(editorId);
    article.lastEditedAt = new Date();

    await article.save();

    await this.appendEditLog(article._id, campus, editorId, action, this.snapshotFromDoc(article));

    const populated = await Article.findById(article._id).populate('lastEditedBy', 'email').lean();
    if (!populated) {
      throw { statusCode: HttpStatus.NOT_FOUND, message: 'Article not found' };
    }
    const viewsMap = await this.getViewsLast7DaysForArticleIds([article._id.toString()]);
    return this.mapLeanToIArticle(populated as unknown as Record<string, unknown>, viewsMap.get(article._id.toString()) ?? 0);
  }

  async deleteArticle(id: string, campus: string): Promise<void> {
    const article = await Article.findById(id);
    if (!article) {
      throw { statusCode: HttpStatus.NOT_FOUND, message: 'Article not found' };
    }

    if (article.campus !== campus) {
      throw { statusCode: HttpStatus.FORBIDDEN, message: 'Not allowed to delete articles from another campus' };
    }

    const oid = article._id;
    await ArticleEditLog.deleteMany({ articleId: oid });
    await ArticleView.deleteMany({ articleId: oid });
    await Article.deleteOne({ _id: oid });
  }

  async recordView(articleId: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(articleId)) {
      throw { statusCode: HttpStatus.BAD_REQUEST, message: 'Invalid article id' };
    }
    const article = await Article.findById(articleId);
    if (!article || article.status !== ArticleStatus.PUBLISHED) {
      throw { statusCode: HttpStatus.NOT_FOUND, message: 'Article not found' };
    }
    await ArticleView.create({ articleId: article._id, createdAt: new Date() });
    article.viewCount = (article.viewCount ?? 0) + 1;
    await article.save();
  }

  async getArticleEditHistory(articleId: string, campus: string): Promise<IArticleEditLogEntry[]> {
    const article = await Article.findById(articleId);
    if (!article || article.campus !== campus) {
      throw { statusCode: HttpStatus.NOT_FOUND, message: 'Article not found' };
    }

    const logs = await ArticleEditLog.find({ articleId })
      .sort({ editedAt: -1 })
      .limit(50)
      .populate('editedBy', 'email')
      .lean();

    return logs.map((log) => {
      const eb = log.editedBy as { _id?: mongoose.Types.ObjectId; email?: string } | mongoose.Types.ObjectId;
      let editedById: string;
      let editedByEmail: string | undefined;
      if (eb && typeof eb === 'object' && 'email' in eb) {
        const o = eb as { _id: mongoose.Types.ObjectId; email?: string };
        editedById = o._id.toString();
        editedByEmail = o.email;
      } else {
        editedById = (eb as mongoose.Types.ObjectId).toString();
      }

      const entry: IArticleEditLogEntry = {
        _id: log._id.toString(),
        editedAt: log.editedAt.toISOString(),
        action: log.action as ArticleEditAction,
        editedBy: editedById,
        snapshot: log.snapshot as IEditSnapshot
      };
      if (editedByEmail !== undefined) entry.editedByEmail = editedByEmail;
      return entry;
    });
  }

  /**
   * Global leaderboard: all articles, grouped by campus (for cross-campus ranking).
   * Includes a per-day, per-campus timeline for the line chart.
   */
  async getGlobalCampusLeaderboard(): Promise<ICampusLeaderboardData> {
    const agg = await Article.aggregate<{ _id: string; count: number }>([
      { $group: { _id: '$campus', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const rankings = agg.map((row, i) => ({
      rank: i + 1,
      campus: String(row._id ?? '').trim() || 'Unknown',
      count: row.count
    }));

    const campusKeys = rankings.map((r) => r.campus);

    const docs = await Article.find({}, { campus: 1, createdAt: 1 }).lean();
    const totalArticles = docs.length;

    const dayMap = new Map<string, Map<string, number>>();
    for (const doc of docs) {
      const c = String(doc.campus ?? '').trim() || 'Unknown';
      const created = doc.createdAt ? new Date(doc.createdAt) : new Date();
      const sk = this.toIsoDay(created);
      if (!dayMap.has(sk)) dayMap.set(sk, new Map());
      const m = dayMap.get(sk)!;
      m.set(c, (m.get(c) ?? 0) + 1);
    }

    const days = Array.from(dayMap.keys()).sort();
    const timeline: Array<Record<string, string | number>> = days.map((sk) => {
      const row: Record<string, string | number> = {
        label: this.formatLeaderboardDayLabel(sk),
        sortKey: sk
      };
      for (const campus of campusKeys) {
        row[campus] = dayMap.get(sk)?.get(campus) ?? 0;
      }
      return row;
    });

    return { rankings, timeline, campusKeys, totalArticles };
  }

  private toIsoDay(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private formatLeaderboardDayLabel(isoDay: string): string {
    const parts = isoDay.split('-').map(Number);
    const y = parts[0] ?? 1970;
    const mo = parts[1] ?? 1;
    const da = parts[2] ?? 1;
    const dt = new Date(y, mo - 1, da);
    return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  /** Promote SCHEDULED articles whose time has passed to PUBLISHED. */
  async publishDueScheduledArticles(): Promise<number> {
    const now = new Date();
    const due = await Article.find({
      status: ArticleStatus.SCHEDULED,
      scheduledPublishAt: { $lte: now }
    });

    let count = 0;
    for (const article of due) {
      const when = article.scheduledPublishAt ?? now;
      article.status = ArticleStatus.PUBLISHED;
      article.publishedAt = when;
      article.scheduledPublishAt = null;
      article.lastEditedAt = new Date();
      await article.save();

      await this.appendEditLog(
        article._id,
        article.campus,
        article.authorId.toString(),
        ArticleEditAction.PUBLISH,
        this.snapshotFromDoc(article)
      );
      count += 1;
    }
    return count;
  }
}

export default new ArticleService();
