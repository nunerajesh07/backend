import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.post('/login', authController.login.bind(authController));
router.get('/me', authenticate, authController.getMe.bind(authController));

export default router;
