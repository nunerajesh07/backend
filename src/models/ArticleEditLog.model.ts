import mongoose, { Schema, type Document } from 'mongoose';
import { ArticleEditAction } from '../types/article.types';

export interface IEditSnapshot {
  title: string;
  body: string;
  category: string;
  status: string;
  imageUrl?: string;
  scheduledPublishAt?: string | null;
}

export interface IArticleEditLogDocument extends Document {
  articleId: mongoose.Types.ObjectId;
  campus: string;
  editedBy: mongoose.Types.ObjectId;
  editedAt: Date;
  action: ArticleEditAction;
  snapshot: IEditSnapshot;
}

const ArticleEditLogSchema = new Schema(
  {
    articleId: { type: Schema.Types.ObjectId, ref: 'Article', required: true, index: true },
    campus: { type: String, required: true, index: true },
    editedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    editedAt: { type: Date, default: Date.now, index: true },
    action: { type: String, enum: Object.values(ArticleEditAction), required: true },
    snapshot: { type: Schema.Types.Mixed, required: true }
  },
  { timestamps: false }
);

ArticleEditLogSchema.index({ articleId: 1, editedAt: -1 });

export default mongoose.model<IArticleEditLogDocument>('ArticleEditLog', ArticleEditLogSchema);
