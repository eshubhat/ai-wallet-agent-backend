import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { contactsService } from './contacts.service';

export const createContact = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const { name, walletAddress } = req.body;

        if (!name || !walletAddress) {
            res.status(400).json({ error: 'Name and wallet address are required' });
            return;
        }

        const contact = await contactsService.createContact(userId, name, walletAddress);
        res.status(201).json(contact);
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};

export const getContacts = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const contacts = await contactsService.getContacts(userId);
        res.json(contacts);
    } catch (error: any) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const searchContacts = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const { q } = req.query;

        if (!q || typeof q !== 'string') {
            res.status(400).json({ error: 'Search query parameter "q" is required' });
            return;
        }

        const contacts = await contactsService.searchContacts(userId, q as string);
        res.json(contacts);
    } catch (error: any) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteContact = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const { id } = req.params;

        await contactsService.deleteContact(userId, id as string);
        res.json({ message: 'Contact deleted successfully' });
    } catch (error: any) {
        if (error.message === 'Contact not found or unauthorized') {
            res.status(404).json({ error: error.message });
            return;
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};
