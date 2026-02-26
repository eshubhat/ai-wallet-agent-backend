import { Router } from 'express';
import { authenticateUser } from '../../middleware/auth.middleware';
import * as transactionsController from './transactions.controller';

const router = Router();

// Apply authentication middleware to all routes in this module
router.use(authenticateUser);

router.post('/', transactionsController.createTransaction);
router.get('/', transactionsController.getTransactions);

export default router;
