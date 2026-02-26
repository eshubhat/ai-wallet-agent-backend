import { Router } from 'express';
import { authenticateUser } from '../../middleware/auth.middleware';
import * as stakesController from './stakes.controller';

const router = Router();

// Apply authentication middleware to all routes in this module
router.use(authenticateUser);

router.post('/', stakesController.createStakeAccount);
router.get('/', stakesController.getUserStakeAccounts);
router.get('/:stakeAccountPubkey/status', stakesController.getStakeAccountStatus);

export default router;
