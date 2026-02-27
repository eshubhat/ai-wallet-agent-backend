import prisma from '../../config/prisma';
import { emitToUser } from '../events/sse.registry';
import { sendTaskTriggeredEmail } from './email.service';
import { getSolPrice } from './price.oracle';

export const schedulerService = {
    async createTask(userId: string, data: any) {
        return prisma.scheduledTask.create({
            data: {
                userId,
                status: 'pending',
                actionType: data.actionType,
                actionPayload: data.actionPayload,
                triggerType: data.triggerType,
                triggerAt: data.triggerAt ? new Date(data.triggerAt) : null,
                triggerPrice: data.triggerPrice,
                triggerToken: data.triggerToken,
                idleHours: data.idleHours,
                label: data.label,
            }
        });
    },

    async getUserTasks(userId: string) {
        return prisma.scheduledTask.findMany({
            where: {
                userId,
                // Only return tasks that are relevant to the user's dashboard (ignore cancelled)
                status: { in: ['pending', 'triggered'] }
            },
            orderBy: { createdAt: 'desc' }
        });
    },

    async cancelTask(id: string, userId: string) {
        return prisma.scheduledTask.updateMany({
            where: { id, userId },
            data: { status: 'cancelled' }
        });
    },

    async dismissTask(id: string, userId: string) {
        return prisma.scheduledTask.updateMany({
            where: { id, userId, status: 'triggered' },
            data: { status: 'dismissed' }
        });
    },

    /**
     * Used by the node-cron job to find all currently pending tasks
     */
    async getPendingTasksForJob() {
        return prisma.scheduledTask.findMany({
            where: { status: 'pending' },
            include: { user: { select: { email: true } } }
        });
    },

    /**
     * Used by the node-cron job when a condition is met
     */
    async triggerTask(task: any) {
        // 1. Mark in DB
        const updated = await prisma.scheduledTask.update({
            where: { id: task.id },
            data: { status: 'triggered' }
        });

        // 2. Emit SSE to frontend to show Banner immediately
        emitToUser(task.userId, 'task_triggered', {
            taskId: updated.id,
            label: updated.label,
            actionType: updated.actionType,
            actionPayload: updated.actionPayload
        });

        // 3. Send email to user
        if (task.user && task.user.email) {
            await sendTaskTriggeredEmail(task.user.email, updated.label);
        }
    }
};
