import mongoose, { Schema, Document } from 'mongoose';
import { ArticleStatus } from '../types/article.types';

export interface IArticleDocument extends Document {
  title: string;
  body: string;
  category: string;
  campus: string;
  authorId: mongoose.Types.ObjectId;
  status: ArticleStatus;
  imageUrl?: string;
  viewCount: number;
  scheduledPublishAt?: Date | null;
  publishedAt?: Date | null;
  lastEditedBy?: mongoose.Types.ObjectId;
  lastEditedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const ArticleSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    body: { type: String, required: true },
    category: { type: String, required: true },
    campus: { type: String, required: true, index: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: Object.values(ArticleStatus), required: true },
    imageUrl: { type: String, required: false },
    viewCount: { type: Number, default: 0, min: 0 },
    scheduledPublishAt: { type: Date, required: false },
    publishedAt: { type: Date, required: false },
    lastEditedBy: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    lastEditedAt: { type: Date, required: false }
  },
  { timestamps: true }
);

ArticleSchema.index({ campus: 1, status: 1, scheduledPublishAt: 1 });

export default mongoose.model<IArticleDocument>('Article', ArticleSchema);
