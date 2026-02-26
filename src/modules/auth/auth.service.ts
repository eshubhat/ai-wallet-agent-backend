import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/prisma';

export const authService = {
    /**
     * Hashes a password using bcrypt
     */
    async hashPassword(password: string): Promise<string> {
        const saltRounds = 10;
        return await bcrypt.hash(password, saltRounds);
    },

    /**
     * Compares a plain text password with a hashed password
     */
    async comparePassword(password: string, hash: string): Promise<boolean> {
        return await bcrypt.compare(password, hash);
    },

    /**
     * Generates a JWT token for a given user ID
     */
    generateToken(userId: string): string {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('JWT_SECRET is completely missing from environment variables');
        }

        return jwt.sign(
            { userId },
            secret,
            { expiresIn: '7d' }
        );
    }
};
