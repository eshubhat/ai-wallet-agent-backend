import cron, { type ScheduledTask } from 'node-cron';
import { schedulerService } from './scheduler.service';
import { getSolPrice } from './price.oracle';

const executeJob = async () => {
    try {
        const pendingTasks = await schedulerService.getPendingTasksForJob();
        if (pendingTasks.length === 0) return;

        const currentSolPrice = await getSolPrice();
        const now = new Date();

        for (const task of pendingTasks) {
            let shouldTrigger = false;

            if (task.triggerType === 'time' && task.triggerAt) {
                if (now >= new Date(task.triggerAt)) {
                    shouldTrigger = true;
                }
            } else if (task.triggerType === 'price_gte' && task.triggerPrice !== null) {
                // Assuming triggerToken is SOL for now
                if (currentSolPrice && currentSolPrice >= task.triggerPrice) {
                    shouldTrigger = true;
                }
            } else if (task.triggerType === 'price_lte' && task.triggerPrice !== null) {
                if (currentSolPrice && currentSolPrice <= task.triggerPrice) {
                    shouldTrigger = true;
                }
            } else if (task.triggerType === 'idle' && task.idleHours) {
                // For 'idle', we check the user's latest transaction or simply fallback to last action
                // In a full prod app we'd query the DB for the user's latest transaction.
                // For demonstration, we'll mark this true if created > idleHours ago and still pending
                // because we assume if they were active they would have dismissed/cancelled it.
                const hoursSinceCreation = (now.getTime() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60);
                if (hoursSinceCreation >= task.idleHours) {
                    shouldTrigger = true;
                }
            }

            if (shouldTrigger) {
                await schedulerService.triggerTask(task);
                console.log(`[Scheduler] Triggered task ${task.id}: ${task.label}`);
            }
        }
    } catch (error) {
        console.error('[Scheduler] Error running job:', error);
    }
};

let job: ScheduledTask | null = null;

export const startSchedulerJob = () => {
    if (job) return;

    // Run every minute
    job = cron.schedule('* * * * *', executeJob);
    console.log('[Scheduler] Job started');

    // Also run once immediately on boot
    executeJob();
};

export const stopSchedulerJob = () => {
    if (job) {
        job.stop();
        job = null;
        console.log('[Scheduler] Job stopped');
    }
};
