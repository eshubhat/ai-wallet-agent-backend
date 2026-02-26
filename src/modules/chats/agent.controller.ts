import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { agentService } from './agent.service';

export const handleAgentMessage = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { message, provider, apiKey } = req.body;

        if (!message || typeof message !== 'string') {
            res.status(400).json({ error: 'Message content is required and must be a string' });
            return;
        }

        // Process the message using the AgentService
        const result = await agentService.processMessage(message, userId, provider, apiKey);

        res.status(200).json(result);
    } catch (error: any) {
        console.error('Error handling agent message:', error);
        res.status(500).json({ error: 'Internal server error while processing message' });
    }
};

export const getChatHistory = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized: User ID is required to fetch history.' });
            return;
        }

        const history = await agentService.getChatHistory(userId);
        res.status(200).json(history);
    } catch (error: any) {
        console.error('Error fetching chat history:', error);
        res.status(500).json({ error: 'Internal server error while fetching chat history' });
    }
};
