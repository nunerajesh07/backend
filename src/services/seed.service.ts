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

  const seedUsers: Array<{
    email: string;
    passwordHash: string;
    role: UserRole;
    campus: string;
  }> = [
    {
      email: 'admin@niat.ac.in',
      passwordHash: 'Admin@123',
      role: UserRole.ADMIN,
      campus: 'All Campuses'
    },
    {
      email: 'mod.hyderabad@niat.ac.in',
      passwordHash: 'Mod@123',
      role: UserRole.MODERATOR,
      campus: 'Hyderabad'
    },
    {
      email: 'mod.bangalore@niat.ac.in',
      passwordHash: 'Mod@123',
      role: UserRole.MODERATOR,
      campus: 'Bangalore'
    },
    {
      email: 'student@niat.ac.in',
      passwordHash: 'Student@123',
      role: UserRole.STUDENT,
      campus: 'General'
    }
  ];

  const createdDocs: IUserDocument[] = [];
  for (const u of seedUsers) {
    const user = new User(u);
    await user.save();
    createdDocs.push(user);
  }
  console.log('Created seed users (admin, moderators, student).');

  const campusToAuthor = new Map<string, mongoose.Types.ObjectId>();
  for (const doc of createdDocs) {
    if (doc.role === UserRole.MODERATOR) {
      if (doc.campus) {
        campusToAuthor.set(doc.campus, doc._id as mongoose.Types.ObjectId);
      }
    }
  }

  const shuffled = shuffleArray(MOCK_ARTICLE_DEFINITIONS);
  const articlesToCreate = buildArticleSeedDocuments(shuffled, campusToAuthor, new Date());

  await Article.insertMany(articlesToCreate);
  console.log(`Created ${articlesToCreate.length} mock articles (campuses with moderators only).`);

  console.log('Seeding completed successfully!');
};


