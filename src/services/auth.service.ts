import jwt from 'jsonwebtoken';
import User from '../models/User.model';
import config from '../config/env.config';
import { normalizeCampusName } from '../utils/campusName';
import { HttpStatus, ITokenPayload, IUser, UserRole } from '../types/auth.types';

interface AuthResult {
  token: string;
  user: IUser;
}

interface RegisterStudentInput {
  name: string;
  email: string;
  password: string;
  campus: string;
}

function toPublicUser(doc: {
  _id: unknown;
  name?: string;
  email: string;
  role: UserRole;
  campus?: string | null;
  createdAt: Date;
}): IUser {
  const out: IUser = {
    _id: String(doc._id),
    email: doc.email,
    role: doc.role,
    createdAt: doc.createdAt
  };
  if (doc.name) out.name = doc.name;
  if (doc.campus !== undefined) out.campus = doc.campus;
  return out;
}

export class AuthService {
  private signToken(userId: string, role: UserRole, campus?: string | null): string {
    const payload: ITokenPayload = { userId, role, campus: campus ?? null };
    return jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn as NonNullable<jwt.SignOptions['expiresIn']>
    });
  }

  async login(email: string, passwordPlain: string): Promise<AuthResult | null> {
    const userDoc = await User.findOne({ email: email.trim() });
    if (!userDoc) return null;

    const isMatch = await userDoc.comparePassword(passwordPlain);
    if (!isMatch) return null;

    const user = toPublicUser(userDoc);
    const token = this.signToken(user._id, user.role, user.campus);
    return { token, user };
  }

  async registerStudent(input: RegisterStudentInput): Promise<AuthResult> {
    const name = input.name.trim();
    const email = input.email.trim();
    const password = input.password;
    const campus = normalizeCampusName(input.campus);

    if (!name || !email || !password || !campus) {
      throw { statusCode: HttpStatus.BAD_REQUEST, message: 'Name, email, password, and campus are required' };
    }

    const existing = await User.findOne({ email });
    if (existing) {
      throw { statusCode: HttpStatus.CONFLICT, message: 'Email is already registered' };
    }

    const userDoc = await User.create({
      name,
      email,
      passwordHash: password,
      role: UserRole.STUDENT,
      campus
    });

    const user = toPublicUser(userDoc);
    const token = this.signToken(user._id, user.role, user.campus);
    return { token, user };
  }

  async getMe(userId: string): Promise<IUser | null> {
    const userDoc = await User.findById(userId);
    if (!userDoc) return null;
    return toPublicUser(userDoc);
  }
}

export default new AuthService();

