import prisma from '../../config/prisma';

export class DashboardService {
    async getAggregatedDashboard(userId: string) {
        const [transactions, stakes, contacts] = await Promise.all([
            prisma.transaction.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.stakeAccount.findMany({
                where: { userId },
            }),
            prisma.contact.findMany({
                where: { userId },
            })
        ]);

        let totalTransfers = 0;
        let totalTransferVolume = 0;
        let incomingVolume = 0;
        let outgoingVolume = 0;
        const transfersPerContactMap: Record<string, { contactName: string; walletAddress: string; totalAmount: number; count: number }> = {};
        const transferTimelineMap: Record<string, number> = {};

        const contactLookup = contacts.reduce((acc: Record<string, string>, contact: { walletAddress: string; name: string }) => {
            acc[contact.walletAddress] = contact.name;
            return acc;
        }, {} as Record<string, string>);

        // Currently we treat all 'transfer' transactions as outgoing. 
        // Real-world implementations would read sender vs recipient to categorize.
        // For the sake of this mock data flow, we'll assign transfer as outgoing and swaps as neutral (or omitted).
        // If we want incoming data, we assume standard incoming would be a 'receive' type.
        transactions.forEach((tx: any) => {
            if (tx.type === 'transfer') {
                totalTransfers++;
                totalTransferVolume += tx.amount;
                outgoingVolume += tx.amount;
            } else if (tx.type === 'receive') {
                incomingVolume += tx.amount;
            }

            if (tx.type === 'transfer') {

                // Transfers per contact
                const recipient = tx.recipient || 'Unknown';
                const contactName = contactLookup[recipient] || recipient;

                if (!transfersPerContactMap[recipient]) {
                    transfersPerContactMap[recipient] = {
                        contactName,
                        walletAddress: recipient,
                        totalAmount: 0,
                        count: 0
                    };
                }
                transfersPerContactMap[recipient].totalAmount += tx.amount;
                transfersPerContactMap[recipient].count++;

                // Transfer timeline (YYYY-MM-DD)
                const dateKey = tx.createdAt.toISOString().split('T')[0];
                transferTimelineMap[dateKey] = (transferTimelineMap[dateKey] || 0) + tx.amount;
            }
        });

        // Format raw stakes
        const formattedStakes = stakes.map((s: any) => ({
            stakeAccountPubkey: s.stakeAccountPubkey,
            amount: s.amount,
            activationState: 'active' // Simplified for requested structure
        }));

        // Convert maps to arrays
        const transfersPerContact = Object.values(transfersPerContactMap).sort((a, b) => b.totalAmount - a.totalAmount);

        const transferTimeline = Object.entries(transferTimelineMap)
            .map(([date, volume]) => ({ date, volume }))
            .sort((a, b) => a.date.localeCompare(b.date));

        // Format recent activity (Top 10)
        const recentActivity = transactions.slice(0, 10).map((tx: any) => ({
            id: tx.id,
            type: tx.type,
            amount: tx.amount,
            signature: tx.signature,
            date: tx.createdAt.toISOString(),
            recipient: tx.recipient ? (contactLookup[tx.recipient] || tx.recipient) : null
        }));

        return {
            totalTransfers,
            totalTransferVolume,
            netFlow: {
                incoming: incomingVolume,
                outgoing: outgoingVolume
            },
            stakes: formattedStakes,
            transfersPerContact,
            transferTimeline,
            recentActivity
        };
    }
}

export const dashboardService = new DashboardService();
