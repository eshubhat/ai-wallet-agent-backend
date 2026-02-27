import prisma from '../../config/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT = `
You are an AI Agent operating a Solana wallet. Your job is to parse a user's natural language intent into a structured JSON array of actions.
The action type MUST be one of: "transfer", "swap", "balance", "stake", or "unknown".

If the user requests multiple actions (e.g. "Send 1 SOL and stake 2 SOL"), extract EACH supported action into the "actions" array.
If an action is completely unsupported, use "type": "unknown" and provide a brief helpful "message" explaining what you CAN do.

Return ONLY valid JSON matching this structure:
{
  "actions": [
    {
      "type": "transfer" | "swap" | "balance" | "stake" | "unknown",
      "amount": number (optional, the amount of token to move or stake),
      "useMax": boolean (optional, true if the user wants to spend or swap ALL of their present balance),
      "token": string (optional, token symbol like SOL, USDC),
      "sourceToken": string (optional, for swap, e.g., SOL),
      "destinationToken": string (optional, for swap, e.g., USDC),
      "recipient": string (optional, base58 Solana address),
      "message": string (optional, used to explain limitations or unknown requests),
      "schedule": { (optional, include this if the user asks to do the action LATER or on a CONDITION)
         "type": "time" | "price_gte" | "price_lte" | "idle",
         "isoDate": string (iso 8601 string, REQUIRED if type=time, e.g tomorrow 5pm),
         "token": string (REQUIRED if type=price_gte or price_lte, e.g. "SOL"),
         "priceUsd": number (REQUIRED if type=price_gte or price_lte, the target price),
         "hours": number (REQUIRED if type=idle, e.g. 24)
      }
    }
  ]
}

Examples:
"Send 0.1 SOL to 7Zbk..." -> {"actions": [{"type":"transfer", "amount":0.1, "token":"SOL", "recipient":"7Zbk..."}]}
"Swap 0.5 SOL for USDC" -> {"actions": [{"type":"swap", "amount":0.5, "sourceToken":"SOL", "destinationToken":"USDC"}]}
"Swap all my SOL for USDC" -> {"actions": [{"type":"swap", "useMax":true, "sourceToken":"SOL", "destinationToken":"USDC"}]}
"What's my balance?" -> {"actions": [{"type":"balance"}]}
"Stake 5 SOL" -> {"actions": [{"type":"stake", "amount":5, "token":"SOL"}]}
"Send 0.1 SOL to 56Fx... tomorrow morning" -> {"actions": [{"type":"transfer", "amount":0.1, "token":"SOL", "recipient":"56Fx...", "schedule": {"type":"time", "isoDate":"2026-02-27T09:00:00Z"}}]}
"Swap 1 SOL to USDC when SOL reaches 250" -> {"actions": [{"type":"swap", "amount":1, "sourceToken":"SOL", "destinationToken":"USDC", "schedule": {"type":"price_gte", "token":"SOL", "priceUsd": 250}}]}
"Send 0.1 SOL to 56Fxr9k2dqLL3NdMDpbp4xxe1MNAMGGkzCEtywxTnLC and stake 2 SOL" -> {"actions": [{"type":"transfer", "amount":0.1, "token":"SOL", "recipient":"56Fxr9k2dqLL3NdMDpbp4xxe1MNAMGGkzCEtywxTnLC"}, {"type":"stake", "amount":2, "token":"SOL"}]}
"Deploy a smart contract" -> {"actions": [{"type":"unknown", "message":"I can only help with transfers, swaps, staking, and checking balances right now."}]}
"Hello!" -> {"actions": [{"type":"unknown", "message":"Hi! I'm your Solana AI Agent. I can help you transfer SOL, swap tokens, stake, or check your balance."}]}

User Intent:
`;

export class AgentService {
    async processMessage(content: string, userId?: string, providerQuery?: string, userApiKey?: string) {
        let chat;
        let userMessage;

        // 1. Only create/find chats if we have an authenticated user
        if (userId) {
            chat = await prisma.chat.findFirst({
                where: { userId },
                orderBy: { createdAt: 'desc' },
            });

            if (!chat) {
                chat = await prisma.chat.create({
                    data: { userId },
                });
            }

            // 2. Persist the user's message
            userMessage = await prisma.message.create({
                data: {
                    chatId: chat.id,
                    role: 'user',
                    content,
                },
            });
        }

        // 3. Call AI agent dynamically based on provider
        let parsedIntent: { actions: any[], rawResponse: string } = { actions: [], rawResponse: '' };
        let agentResponseContent = '';
        const provider = providerQuery?.toLowerCase() || 'gemini';

        try {
            const prompt = SYSTEM_PROMPT + content;
            let textResponse = '';

            if (provider === 'gemini') {
                const apiKey = userApiKey || process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
                if (!apiKey) throw new Error('Google Gemini API Key is missing. Please provide it in settings or the server .env.');
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
                const result = await model.generateContent(prompt);
                textResponse = result.response.text();
            } else if (provider === 'openai') {
                const apiKey = userApiKey || process.env.OPENAI_API_KEY;
                if (!apiKey) throw new Error('OpenAI API Key is missing. Please provide it in settings or the server .env.');
                const openai = new OpenAI({ apiKey });
                const completion = await openai.chat.completions.create({
                    messages: [{ role: 'user', content: prompt }],
                    model: 'gpt-4o-mini',
                });
                textResponse = completion.choices[0]?.message?.content || '';
            } else if (provider === 'anthropic') {
                const apiKey = userApiKey || process.env.ANTHROPIC_API_KEY;
                if (!apiKey) throw new Error('Anthropic API Key is missing. Please provide it in settings or the server .env.');
                const anthropic = new Anthropic({ apiKey });
                const msg = await anthropic.messages.create({
                    model: 'claude-3-haiku-20240307',
                    max_tokens: 1024,
                    messages: [{ role: 'user', content: prompt }]
                });
                // @ts-ignore - Handle anthropic content block types
                textResponse = msg.content[0]?.text || '';
            } else {
                throw new Error(`Unsupported provider: ${provider}`);
            }

            agentResponseContent = textResponse;
            parsedIntent.rawResponse = textResponse;

            // Clean up optional markdown blocks injected by the LLMs
            const sanitizedJSON = textResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(sanitizedJSON);
            parsedIntent.actions = parsed.actions || [];
        } catch (error: any) {
            console.error(`AI Intent Parsing Error (${provider}):`, error);
            agentResponseContent = error.message;
            parsedIntent = {
                actions: [{
                    type: 'unknown',
                    message: error.message || `Failed to parse natural language intent from ${provider}.`
                }],
                rawResponse: error.message
            };
        }

        // 4. Persist the agent's response if there's an active chat
        let agentMessage;
        if (chat) {
            agentMessage = await prisma.message.create({
                data: {
                    chatId: chat.id,
                    role: 'agent',
                    content: agentResponseContent,
                },
            });
        }

        // 5. Return the agent's response including actions for the frontend to process
        return {
            chatId: chat?.id,
            userMessage,
            agentMessage,
            actions: parsedIntent.actions,
            rawResponse: parsedIntent.rawResponse,
        };
    }

    async getChatHistory(userId: string) {
        const chat = await prisma.chat.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' },
                },
            },
        });

        if (!chat) return [];

        return chat.messages;
    }
}

export const agentService = new AgentService();
