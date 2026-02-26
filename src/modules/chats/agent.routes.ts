import { Router } from 'express';
import { optionalAuthenticateUser, authenticateUser } from '../../middleware/auth.middleware';
import { handleAgentMessage, getChatHistory } from './agent.controller';

const router = Router();

// Protect agent routes with optional JWT authentication
router.use(optionalAuthenticateUser);

router.post('/message', handleAgentMessage);

// Explicitly require auth to fetch history
router.get('/history', authenticateUser, getChatHistory);

export default router;
