import { type Application } from 'express';
import adminController from '../controllers/admin.controller';
import { authenticate } from '../middleware/authenticate';
import { authorise, authorizeRoles } from '../middleware/authorise';
import { API_ENDPOINTS } from '../constants/app.constants';
import { Permission, UserRole } from '../types/auth.types';

const manage = [authenticate, authorise(Permission.MANAGE_MODERATORS), authorizeRoles(UserRole.ADMIN)];

export function registerAdminRoutes(app: Application): void {
  const moderatorsBase = `${API_ENDPOINTS.ADMIN}/moderators`;
  const createModeratorPath = `${API_ENDPOINTS.ADMIN}/create-moderator`;

  app.post(createModeratorPath, ...manage, adminController.createModerator.bind(adminController));
  app.post(moderatorsBase, ...manage, adminController.createModerator.bind(adminController));
  app.get(moderatorsBase, ...manage, adminController.getAllModerators.bind(adminController));
  app.get(`${API_ENDPOINTS.ADMIN}/students/count`, ...manage, adminController.getStudentCount.bind(adminController));
  app.delete(`${moderatorsBase}/:id`, ...manage, adminController.deleteModerator.bind(adminController));
}

