import prisma from '../../config/prisma';
import { Connection, PublicKey } from '@solana/web3.js';

const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

export const persistStakeAccount = async (
    userId: string,
    data: { stakeAccountPubkey: string, validatorVoteKey: string, amount: number }
) => {
    return await prisma.stakeAccount.create({
        data: {
            userId,
            stakeAccountPubkey: data.stakeAccountPubkey,
            validatorVoteKey: data.validatorVoteKey,
            amount: data.amount,
        },
    });
};

export const fetchUserStakeAccounts = async (userId: string) => {
    const stakes = await prisma.stakeAccount.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
    });

    const enrichedStakes = await Promise.all(
        stakes.map(async (stake) => {
            try {
                const pubkey = new PublicKey(stake.stakeAccountPubkey);
                const activation = await connection.getStakeActivation(pubkey);

                return {
                    id: stake.id,
                    stakeAccountPubkey: stake.stakeAccountPubkey,
                    amount: stake.amount,
                    validatorVoteKey: stake.validatorVoteKey,
                    activationState: activation.state,
                    activeLamports: activation.active,
                    createdAt: stake.createdAt,
                };
            } catch (error) {
                console.error(`Failed to fetch activation for ${stake.stakeAccountPubkey}:`, error);
                return {
                    id: stake.id,
                    stakeAccountPubkey: stake.stakeAccountPubkey,
                    amount: stake.amount,
                    validatorVoteKey: stake.validatorVoteKey,
                    activationState: 'unknown',
                    activeLamports: 0,
                    createdAt: stake.createdAt,
                };
            }
        })
    );

    return enrichedStakes;
};

export const queryStakeActivationState = async (stakeAccountPubkey: string) => {
    const pubkey = new PublicKey(stakeAccountPubkey);
    const activation = await connection.getStakeActivation(pubkey);
    return {
        stakeAccountPubkey,
        activationState: activation.state,
        activeLamports: activation.active,
    };
};
