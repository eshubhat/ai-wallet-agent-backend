import { Request, Response } from 'express';
import { prisma } from '../../config/prisma';
import { authService } from './auth.service';
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const signup = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password, name, walletAddress } = req.body;

        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }

        // Check if user already exists
        const existingEmail = await prisma.user.findUnique({ where: { email } });
        if (existingEmail) {
            res.status(409).json({ error: 'A user with this email already exists' });
            return;
        }

        if (walletAddress) {
            const existingWallet = await prisma.user.findUnique({ where: { walletAddress } });
            if (existingWallet) {
                res.status(409).json({ error: 'A user with this wallet address already exists' });
                return;
            }
        }

        // Hash password and create user
        const hashedPassword = await authService.hashPassword(password);

        const user = await prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
                walletAddress: walletAddress || null
            }
        });

        // Exclude password from response
        const { password: _, ...userWithoutPassword } = user;

        const token = authService.generateToken(user.id);

        res.status(201).json({ user: userWithoutPassword, token });
    } catch (error: any) {
        console.error('Error during signup:', error);
        res.status(500).json({ error: 'Internal server error during signup' });
    }
};

export const signin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }

        // Find user by email
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }

        // Compare input password with stored hash
        const isPasswordValid = await authService.comparePassword(password, user.password);
        if (!isPasswordValid) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }

        // Exclude password from response
        const { password: _, ...userWithoutPassword } = user;

        const token = authService.generateToken(user.id);

        res.status(200).json({ user: userWithoutPassword, token });
    } catch (error: any) {
        console.error('Error during signin:', error);
        res.status(500).json({ error: 'Internal server error during signin' });
    }
};

export const googleLogin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { idToken } = req.body;
        if (!idToken) {
            res.status(400).json({ error: 'Google ID Token is required' });
            return;
        }

        // Verify the token
        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            res.status(400).json({ error: 'Invalid Google payload' });
            return;
        }

        const email = payload.email;
        const name = payload.name || email.split('@')[0];

        // Find or create the user without requiring a password
        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    email,
                    name,
                    // Leaving password empty. If schema requires it, make it optional in prisma.
                    // Wait, schema was: password String? -> it is optional. Perfect.
                }
            });
        }

        const { password: _, ...userWithoutPassword } = user;
        const token = authService.generateToken(user.id);

        res.status(200).json({ user: userWithoutPassword, token });
    } catch (error: any) {
        console.error('Error during google login:', error);
        res.status(500).json({ error: 'Internal server error during Google authentication' });
    }
};
