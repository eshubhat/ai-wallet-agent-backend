import app from './app';
import dotenv from 'dotenv';
import { startSchedulerJob } from './modules/scheduler/scheduler.job';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 8080;

// Start the cron job for scheduled tasks
startSchedulerJob();

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
