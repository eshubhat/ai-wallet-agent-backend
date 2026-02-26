import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';

export const errorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    // Log error for debugging, but only include stack trace in development
    if (config.isProduction && statusCode === 500) {
        console.error(`[Error] ${err.name}: ${err.message}`);
    } else {
        console.error(`[Error]`, err);
    }

    res.status(statusCode).json({
        error: {
            message: config.isProduction && statusCode === 500 ? 'Internal Server Error' : message,
            ...(config.isProduction ? {} : { stack: err.stack }),
        },
    });
};
