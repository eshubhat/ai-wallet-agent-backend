import prisma from '../../config/prisma';

export class TransactionsService {
    async createTransaction(userId: string, data: { signature: string; type: string; amount: number; token?: string; recipient?: string }) {
        return prisma.transaction.create({
            data: {
                userId,
                ...data,
            },
        });
    }

    async getTransactions(userId: string) {
        return prisma.transaction.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }
}

export const transactionsService = new TransactionsService();
