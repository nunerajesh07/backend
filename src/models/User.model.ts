import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole } from '../types/auth.types';

/**
 * User document shape (MongoDB):
 * - email: unique login id
 * - passwordHash: bcrypt hash (never store plaintext; assign plain password to this field on create
 *   so the pre-save hook can hash it — same pattern as seed scripts)
 * - role: ADMIN | MODERATOR
 * - campus: campus name for RBAC (moderators are scoped to this campus for articles)
 * - createdAt: set automatically
 */
export interface IUserDocument extends Document {
  email: string;
  passwordHash: string;
  role: UserRole;
  campus: string;
  createdAt: Date;
  comparePassword(plain: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: Object.values(UserRole), required: true },
  campus: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

UserSchema.pre<IUserDocument>('save', async function () {
  if (!this.isModified('passwordHash')) return;
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

UserSchema.methods.comparePassword = async function (plain: string): Promise<boolean> {
  return bcrypt.compare(plain, this.passwordHash);
};

export default mongoose.model<IUserDocument>('User', UserSchema);
