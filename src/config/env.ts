import dotenv from 'dotenv';
import path from 'path';

// Load .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '8000', 10),
    db: {
        url: process.env.DATABASE_URL,
    },
    jwtSecret: process.env.JWT_SECRET || 'secret',
    corsOrigin: process.env.CORS_ORIGIN || '*',
    isProduction: process.env.NODE_ENV === 'production',
};
