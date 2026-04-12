import jwt from 'jsonwebtoken';
import User from '../models/User.model';
import config from '../config/env.config';
import { ITokenPayload, IUser, UserRole } from '../types/auth.types';

/**
 * Login and session helpers.
 * Passwords are never stored in plain text — the User model keeps a bcrypt hash and compares on login.
 */

export class AuthService {
  async login(email: string, passwordPlain: string): Promise<{ token: string; user: IUser } | null> {
    const userDoc = await User.findOne({ email });
    if (!userDoc) {
      return null;
    }

    // This dashboard login is for moderators only (student/admin flows could be added separately).
    if (userDoc.role !== UserRole.MODERATOR) {
      return null;
    }

    const isMatch = await userDoc.comparePassword(passwordPlain);
    if (!isMatch) {
      return null;
    }

    // JWT carries identity + campus so every later request can scope data without another DB lookup for role.
    const payload: ITokenPayload = {
      userId: userDoc._id.toString(),
      role: userDoc.role,
      campus: userDoc.campus
    };

    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn as NonNullable<jwt.SignOptions['expiresIn']> });

    const user: IUser = {
      _id: userDoc._id.toString(),
      email: userDoc.email,
      role: userDoc.role,
      campus: userDoc.campus,
      createdAt: userDoc.createdAt
    };

    return { token, user };
  }

  async getMe(userId: string): Promise<IUser | null> {
    const userDoc = await User.findById(userId);
    if (!userDoc) {
      return null;
    }

    return {
      _id: userDoc._id.toString(),
      email: userDoc.email,
      role: userDoc.role,
      campus: userDoc.campus,
      createdAt: userDoc.createdAt
    };
  }
}

export default new AuthService();
