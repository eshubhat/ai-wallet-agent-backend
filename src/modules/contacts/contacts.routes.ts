import { Router } from 'express';
import { authenticateUser } from '../../middleware/auth.middleware';
import {
    createContact,
    getContacts,
    searchContacts,
    deleteContact,
} from './contacts.controller';

const router = Router();

// Protect all contact routes with JWT authentication
router.use(authenticateUser);

router.post('/', createContact);
router.get('/', getContacts);
router.get('/search', searchContacts);
router.delete('/:id', deleteContact);

export default router;
