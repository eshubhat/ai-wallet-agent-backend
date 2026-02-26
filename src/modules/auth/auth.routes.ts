import { Router } from 'express';
import { signup, signin, googleLogin } from './auth.controller';

const router = Router();

router.post('/signup', signup);
router.post('/signin', signin);
router.post('/google', googleLogin);

export default router;
