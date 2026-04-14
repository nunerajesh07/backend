import mongoose, { Schema, type Document } from 'mongoose';

export interface IArticleViewDocument extends Document {
  articleId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const ArticleViewSchema = new Schema(
  {
    articleId: { type: Schema.Types.ObjectId, ref: 'Article', required: true, index: true },
    createdAt: { type: Date, default: Date.now, index: true }
  },
  { timestamps: false }
);

ArticleViewSchema.index({ articleId: 1, createdAt: -1 });

export default mongoose.model<IArticleViewDocument>('ArticleView', ArticleViewSchema);

