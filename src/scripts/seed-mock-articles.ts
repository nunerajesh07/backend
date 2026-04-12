/**
 * Insert or refresh realistic mock articles without wiping users.
 * Removes existing rows whose titles match the mock set, then inserts fresh documents.
 *
 *   npm run seed:mock
 *
 * Prerequisites: at least one MODERATOR per campus used in mocks (run `npm run seed` once).
 */
import mongoose from 'mongoose';
import config from '../config/env.config';
import User from '../models/User.model';
import Article from '../models/Article.model';
import { UserRole } from '../types/auth.types';
import { MOCK_ARTICLE_DEFINITIONS, type MockArticleDefinition } from '../data/mockArticleDefinitions';
import { buildArticleSeedDocuments, shuffleArray } from '../data/buildMockArticles';

async function main(): Promise<void> {
  await mongoose.connect(config.mongoUri);
  console.log('Connected to MongoDB.');

  const mods = await User.find({ role: UserRole.MODERATOR });
  if (mods.length === 0) {
    console.error('No MODERATOR users found. Run `npm run seed` first to create moderators.');
    await mongoose.disconnect();
    process.exit(1);
  }

  const campusToAuthor = new Map<string, mongoose.Types.ObjectId>();
  for (const m of mods) {
    campusToAuthor.set(m.campus, m._id as mongoose.Types.ObjectId);
  }

  const titles = MOCK_ARTICLE_DEFINITIONS.map((d: MockArticleDefinition) => d.title);
  const removed = await Article.deleteMany({ title: { $in: titles } });
  console.log(`Removed ${removed.deletedCount} existing article(s) with mock titles (if any).`);

  const shuffled = shuffleArray(MOCK_ARTICLE_DEFINITIONS);
  const docs = buildArticleSeedDocuments(shuffled, campusToAuthor, new Date());

  if (docs.length < MOCK_ARTICLE_DEFINITIONS.length) {
    console.warn(
      `Warning: only ${docs.length}/${MOCK_ARTICLE_DEFINITIONS.length} articles built — add moderators for missing campuses.`
    );
  }

  if (docs.length === 0) {
    console.error('No documents to insert.');
    await mongoose.disconnect();
    process.exit(1);
  }

  await Article.insertMany(docs);
  console.log(`Inserted ${docs.length} mock article(s).`);
  await mongoose.disconnect();
  console.log('Done.');
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
