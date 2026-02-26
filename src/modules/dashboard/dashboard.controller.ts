import { Request, Response } from 'express';
import { dashboardService } from './dashboard.service';

type RequestWithUser = Request & { user?: { userId: string } };

export const getDashboardMetrics = async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const metrics = await dashboardService.getAggregatedDashboard(userId);
        res.status(200).json(metrics);
    } catch (error: any) {
        console.error('Error fetching dashboard metrics:', error);
        res.status(500).json({ error: 'Failed to aggregate dashboard metrics' });
    }
};
