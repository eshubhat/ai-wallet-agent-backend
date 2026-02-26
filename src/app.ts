import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config/env';
import { errorHandler } from './middleware/error.middleware';

// Route imports
import authRoutes from './modules/auth/auth.routes';
import contactRoutes from './modules/contacts/contacts.routes';
import agentRoutes from './modules/chats/agent.routes';
import stakesRoutes from './modules/stakes/stakes.routes';
import transactionsRoutes from './modules/transactions/transactions.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';

const app: Express = express();

// --- Security & Production Middleware ---
// 1. Helmet helps secure Express apps by setting HTTP response headers
app.use(helmet());

// 2. CORS configuration tailored for production and dev
app.use(cors({
    origin: config.corsOrigin,
    credentials: true,
}));

// 3. Request Logging (dev/prod format)
app.use(morgan(config.isProduction ? 'combined' : 'dev'));

// 4. Rate Limiting to prevent brute-force/DDoS
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
});
// Apply to all API routes
app.use('/api', limiter);

// --- Standard Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic Health Route
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString(), env: config.env });
});

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/stakes', stakesRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/dashboard', dashboardRoutes);

// --- Error Handling Middleware ---
// Must be defined after all routes and other middleware
app.use(errorHandler);

export default app;
