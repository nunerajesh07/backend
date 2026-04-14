import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole } from '../types/auth.types';

export interface IUserDocument extends Document {
  name?: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  campus?: string | null;
  createdAt: Date;
  comparePassword(plain: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema({
  name: { type: String },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: Object.values(UserRole), required: true },
  campus: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

UserSchema.pre<IUserDocument>('validate', function () {
  if (this.role === UserRole.MODERATOR && !(this.campus ?? '').trim()) {
    throw new Error('Campus is required for moderator accounts');
  }
  if (this.role !== UserRole.MODERATOR && (this.campus ?? '').trim() === '') {
    this.campus = null;
  }
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

