import User from '../models/User.model';
import { normalizeCampusName } from '../utils/campusName';
import { HttpStatus, IUser, UserRole } from '../types/auth.types';

export interface CreateModeratorInput {
  email: string;
  password: string;
  campus: string;
}

function userToPublic(doc: {
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
  if (doc.name !== undefined) out.name = doc.name;
  if (doc.campus !== undefined) out.campus = doc.campus;
  return out;
}

export class AdminService {
  async createModerator(data: CreateModeratorInput): Promise<IUser> {
    const email = data.email.trim();
    const password = data.password;
    const campus = normalizeCampusName(data.campus);

    if (!email || !password || !campus) {
      throw { statusCode: HttpStatus.BAD_REQUEST, message: 'Email, password, and campus are required' };
    }

    const existing = await User.findOne({ email });
    if (existing) {
      throw { statusCode: HttpStatus.CONFLICT, message: 'A user with this email already exists' };
    }

    const doc = await User.create({ email, passwordHash: password, role: UserRole.MODERATOR, campus });
    return userToPublic(doc);
  }

  async getAllModerators(): Promise<IUser[]> {
    const docs = await User.find({ role: UserRole.MODERATOR }).sort({ createdAt: -1 }).lean();
    return docs.map((d) => {
      const source: { _id: unknown; name?: string; email: string; role: UserRole; campus?: string | null; createdAt: Date } = {
        _id: d._id,
        email: d.email,
        role: d.role as UserRole,
        createdAt: d.createdAt
      };
      if (d.name !== undefined) source.name = d.name;
      if (d.campus !== undefined) source.campus = d.campus;
      return userToPublic(source);
    });
  }

  async getStudentCount(): Promise<number> {
    return User.countDocuments({ role: UserRole.STUDENT });
  }

  async deleteModerator(id: string): Promise<void> {
    const doc = await User.findById(id);
    if (!doc) throw { statusCode: HttpStatus.NOT_FOUND, message: 'User not found' };
    if (doc.role !== UserRole.MODERATOR) {
      throw { statusCode: HttpStatus.BAD_REQUEST, message: 'Only moderator accounts can be removed via this endpoint' };
    }
    await User.deleteOne({ _id: doc._id });
  }
}

export default new AdminService();
