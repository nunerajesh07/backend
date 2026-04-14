import { Permission, UserRole } from '../types/auth.types';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [Permission.READ, Permission.WRITE, Permission.DELETE, Permission.MANAGE_MODERATORS],
  [UserRole.MODERATOR]: [Permission.READ, Permission.WRITE, Permission.DELETE],
  [UserRole.STUDENT]: [Permission.READ]
};

