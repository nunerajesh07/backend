import mongoose from 'mongoose';
import config from '../config/env.config';
import User, { type IUserDocument } from '../models/User.model';
import Article from '../models/Article.model';
import ArticleView from '../models/ArticleView.model';
import ArticleEditLog from '../models/ArticleEditLog.model';
import { UserRole } from '../types/auth.types';
import { MOCK_ARTICLE_DEFINITIONS } from '../data/mockArticleDefinitions';
import { buildArticleSeedDocuments, shuffleArray } from '../data/buildMockArticles';

export const seedDatabase = async (): Promise<void> => {
  await mongoose.connect(config.mongoUri);
  console.log('Connected to MongoDB for seeding...');

  await User.deleteMany({});
  await Article.deleteMany({});
  await ArticleView.deleteMany({});
  await ArticleEditLog.deleteMany({});
  console.log('Cleared existing users and articles.');

  const mods = [
    {
      email: 'mod.chennai@niat.com',
      passwordHash: 'password123',
      role: UserRole.MODERATOR,
      campus: 'Chennai',
    },
    {
      email: 'mod.hyderabad@niat.com',
      passwordHash: 'password123',
      role: UserRole.MODERATOR,
      campus: 'Hyderabad',
    },
    {
      email: 'mod.pune@niat.com',
      passwordHash: 'pune123',
      role: UserRole.MODERATOR,
      campus: 'Pune',
    },
    {
      email: 'mod.noida@niat.com',
      passwordHash: 'noida123',
      role: UserRole.MODERATOR,
      campus: 'Noida',
    },
  ];

  const createdMods: IUserDocument[] = [];
  for (const mod of mods) {
    const user = new User(mod);
    await user.save();
    createdMods.push(user);
  }
  console.log('Created moderator users.');

  const campusToAuthor = new Map<string, mongoose.Types.ObjectId>();
  for (const mod of createdMods) {
    campusToAuthor.set(mod.campus, mod._id as mongoose.Types.ObjectId);
  }

  const shuffled = shuffleArray(MOCK_ARTICLE_DEFINITIONS);
  const articlesToCreate = buildArticleSeedDocuments(shuffled, campusToAuthor, new Date());

  await Article.insertMany(articlesToCreate);
  console.log(`Created ${articlesToCreate.length} mock articles (realistic content).`);

  console.log('Seeding completed successfully!');
};
