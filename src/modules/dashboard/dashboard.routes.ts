import { Router } from 'express';
import { authenticateUser } from '../../middleware/auth.middleware';
import * as dashboardController from './dashboard.controller';

const router = Router();

router.use(authenticateUser);

router.get('/', dashboardController.getDashboardMetrics);

export default router;
