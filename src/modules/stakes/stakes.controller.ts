import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import * as stakesService from './stakes.service';

export const createStakeAccount = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const { stakeAccountPubkey, validatorVoteKey, amount } = req.body;

        if (!stakeAccountPubkey || !validatorVoteKey || amount === undefined) {
            res.status(400).json({ error: 'stakeAccountPubkey, validatorVoteKey, and amount are required' });
            return;
        }

        const newStake = await stakesService.persistStakeAccount(userId, {
            stakeAccountPubkey,
            validatorVoteKey,
            amount: Number(amount)
        });

        res.status(201).json(newStake);
    } catch (error: any) {
        console.error('Error creating stake account:', error);
        res.status(500).json({ error: 'Internal server error while creating stake record' });
    }
};

export const getUserStakeAccounts = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const stakes = await stakesService.fetchUserStakeAccounts(userId);
        res.status(200).json(stakes);
    } catch (error: any) {
        console.error('Error fetching user stake accounts:', error);
        res.status(500).json({ error: 'Internal server error while fetching stakes' });
    }
};

export const getStakeAccountStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { stakeAccountPubkey } = req.params;

        if (!stakeAccountPubkey) {
            res.status(400).json({ error: 'stakeAccountPubkey is required' });
            return;
        }

        const status = await stakesService.queryStakeActivationState(stakeAccountPubkey as string);
        res.status(200).json(status);
    } catch (error: any) {
        console.error('Error getting stake account status:', error);
        res.status(500).json({ error: 'Internal server error fetching activation status' });
    }
};
