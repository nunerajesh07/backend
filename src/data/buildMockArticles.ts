import mongoose from 'mongoose';
import { ArticleStatus } from '../types/article.types';
import { getCategoryImageUrl } from './categoryImages';
import type { MockArticleDefinition } from './mockArticleDefinitions';

export function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i] as T;
    copy[i] = copy[j] as T;
    copy[j] = tmp;
  }
  return copy;
}

function daysAgo(now: Date, n: number): Date {
  const d = new Date(now);
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(now: Date, n: number): Date {
  const d = new Date(now);
  d.setDate(d.getDate() + n);
  return d;
}

/**
 * Builds plain objects for `Article.insertMany` from mock definitions and moderator map.
 */
export function buildArticleSeedDocuments(
  definitions: MockArticleDefinition[],
  campusToAuthor: Map<string, mongoose.Types.ObjectId>,
  now: Date
): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  let i = 0;
  for (const def of definitions) {
    const authorId = campusToAuthor.get(def.campus);
    if (!authorId) {
      continue;
    }

    const imageUrl = getCategoryImageUrl(def.category);
    const viewCount = 12 + ((i * 37) % 400);
    i += 1;

    const base: Record<string, unknown> = {
      title: def.title,
      body: def.body,
      category: def.category,
      campus: def.campus,
      authorId,
      status: def.status,
      imageUrl,
      viewCount,
      lastEditedBy: authorId,
      lastEditedAt: daysAgo(now, (i % 14) + 1)
    };

    if (def.status === ArticleStatus.PUBLISHED) {
      base.publishedAt = daysAgo(now, (i % 30) + 1);
      base.scheduledPublishAt = null;
    } else if (def.status === ArticleStatus.DRAFT) {
      base.publishedAt = null;
      base.scheduledPublishAt = null;
    } else if (def.status === ArticleStatus.SCHEDULED) {
      base.publishedAt = null;
      base.scheduledPublishAt = daysFromNow(now, 3 + (i % 5));
    }

    out.push(base);
  }

  return out;
}
