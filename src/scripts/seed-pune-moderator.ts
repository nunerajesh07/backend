/**
 * Idempotent seed: Pune campus moderator + optional sample articles.
 *
 * Run from server directory:
 *   npm run seed:pune
 *
 * - Creates mod.pune@niat.com if missing (password hashed by User model pre-save).
 * - Inserts sample Pune articles only when there are zero articles for campus "Pune".
 */
import mongoose from 'mongoose';
import config from '../config/env.config';
import User from '../models/User.model';
import Article from '../models/Article.model';
import { UserRole } from '../types/auth.types';
import { ArticleStatus } from '../types/article.types';

const PUNE_EMAIL = 'mod.pune@niat.com';
/** Plain password â€” assigned to `passwordHash` so the User pre-save hook bcrypt-hashes it. */
const PUNE_PASSWORD_PLAIN = 'pune123';

async function insertPuneSampleArticles(authorId: mongoose.Types.ObjectId): Promise<void> {
  const now = new Date();
  const rows = [
    {
      title: 'Welcome to NIAT Pune',
      body: 'We are glad to share campus news and announcements with students. Stay tuned for updates on events, placements, and academic highlights.',
      category: 'Announcements',
      campus: 'Pune',
      authorId,
      status: ArticleStatus.PUBLISHED,
      viewCount: 0,
      publishedAt: now,
      lastEditedBy: authorId,
      lastEditedAt: now
    },
    {
      title: 'Library hours extended this semester',
      body: 'The central library will remain open until 9 PM on weekdays. Please carry your ID cards. Group study rooms can be booked at the front desk.',
      category: 'Campus Life',
      campus: 'Pune',
      authorId,
      status: ArticleStatus.PUBLISHED,
      viewCount: 0,
      publishedAt: now,
      lastEditedBy: authorId,
      lastEditedAt: now
    },
    {
      title: 'Industry guest session â€” Cloud & DevOps',
      body: 'An interactive session with industry experts is scheduled next Friday. Registrations are open for final-year students via the placement portal.',
      category: 'Events',
      campus: 'Pune',
      authorId,
      status: ArticleStatus.PUBLISHED,
      viewCount: 0,
      publishedAt: now,
      lastEditedBy: authorId,
      lastEditedAt: now
    }
  ];

  await Article.insertMany(rows);
  console.log(`Inserted ${rows.length} sample article(s) for Pune.`);
}

async function ensurePuneSampleArticles(authorId: mongoose.Types.ObjectId): Promise<void> {
  const count = await Article.countDocuments({ campus: 'Pune' });
  if (count > 0) {
    console.log(`Pune already has ${count} article(s) â€” skipping sample article insert.`);
    return;
  }
  await insertPuneSampleArticles(authorId);
}

async function main(): Promise<void> {
  await mongoose.connect(config.mongoUri);
  console.log('Connected to MongoDB.');

  const existing = await User.findOne({ email: PUNE_EMAIL });
  const user =
    existing ??
    (await new User({
      email: PUNE_EMAIL,
      passwordHash: PUNE_PASSWORD_PLAIN,
      role: UserRole.MODERATOR,
      campus: 'Pune'
    }).save());

  if (!existing) {
    console.log(`Created moderator: ${PUNE_EMAIL} (campus: Pune). Password is stored as bcrypt hash.`);
  } else {
    console.log(`Moderator ${PUNE_EMAIL} already exists â€” skipping user insert.`);
  }

  const authorId = user._id as mongoose.Types.ObjectId;
  await ensurePuneSampleArticles(authorId);

  await mongoose.disconnect();
  console.log('Done.');
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});

