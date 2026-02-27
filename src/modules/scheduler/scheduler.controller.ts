import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { schedulerService } from './scheduler.service';

export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const task = await schedulerService.createTask(userId, req.body);
        res.status(201).json(task);
    } catch (error: any) {
        console.error('Error creating scheduled task:', error);
        res.status(500).json({ error: 'Failed to create scheduled task' });
    }
};

export const getUserTasks = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const tasks = await schedulerService.getUserTasks(userId);
        res.status(200).json(tasks);
    } catch (error: any) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
};

export const cancelTask = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const { id } = req.params;
        await schedulerService.cancelTask(id as string, userId);
        res.status(200).json({ success: true });
    } catch (error: any) {
        console.error('Error cancelling task:', error);
        res.status(500).json({ error: 'Failed to cancel task' });
    }
};

export const dismissTask = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const { id } = req.params;
        await schedulerService.dismissTask(id as string, userId);
        res.status(200).json({ success: true });
    } catch (error: any) {
        console.error('Error dismissing task:', error);
        res.status(500).json({ error: 'Failed to dismiss task' });
    }
};
