import { Router } from 'express';
import { authenticateUser } from '../../middleware/auth.middleware';
import * as schedulerController from './scheduler.controller';

const router = Router();

// Apply authentication middleware to all routes in this module
router.use(authenticateUser);

router.get('/', schedulerController.getUserTasks);
router.post('/', schedulerController.createTask);
router.delete('/:id', schedulerController.cancelTask);
router.patch('/:id/dismiss', schedulerController.dismissTask);

export default router;
