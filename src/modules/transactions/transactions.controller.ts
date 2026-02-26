import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { transactionsService } from './transactions.service';

export const createTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const { signature, type, amount, token, recipient } = req.body;

        if (!signature || !type || amount === undefined) {
            res.status(400).json({ error: 'Signature, type, and amount are required' });
            return;
        }

        const transaction = await transactionsService.createTransaction(userId, { signature, type, amount: Number(amount), token, recipient });
        res.status(201).json(transaction);
    } catch (error: any) {
        console.error('Error creating transaction:', error);
        res.status(500).json({ error: 'Internal server error while creating transaction' });
    }
};

export const getTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const transactions = await transactionsService.getTransactions(userId);
        res.status(200).json(transactions);
    } catch (error: any) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: 'Internal server error while fetching transactions' });
    }
};
