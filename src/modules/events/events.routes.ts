import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { addClient, removeClient } from './sse.registry';

const router = Router();

/**
 * GET /api/events?token=<jwt>
 *
 * Opens a persistent Server-Sent Events stream for the authenticated user.
 * The Authorization header cannot be set by the browser's native EventSource API,
 * so we accept the JWT as a query parameter instead.
 */
router.get('/', (req: Request, res: Response) => {
    // ── 1. Authenticate via query param token ──────────────────────────────
    const token = req.query.token as string | undefined;

    if (!token) {
        res.status(401).json({ error: 'Unauthorized: token query param required' });
        return;
    }

    let userId: string;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string };
        userId = decoded.userId;
    } catch {
        res.status(401).json({ error: 'Unauthorized: invalid token' });
        return;
    }

    // ── 2. Set SSE headers ─────────────────────────────────────────────────
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    // Allow cross-origin streaming (CORS headers from app-level middleware already set,
    // but some proxies strip the Connection header — flush immediately)
    res.flushHeaders();

    // ── 3. Register this connection in the registry ────────────────────────
    addClient(userId, res);
    console.log(`[SSE] Client connected — userId: ${userId}`);

    // ── 4. Send initial handshake event ───────────────────────────────────
    res.write(`event: connected\ndata: ${JSON.stringify({ userId, ts: Date.now() })}\n\n`);

    // ── 5. Keep-alive heartbeat every 25 s (prevents proxy timeouts) ──────
    const heartbeatInterval = setInterval(() => {
        try {
            res.write(`: heartbeat\n\n`);   // SSE comment — ignored by EventSource, prevents timeout
        } catch {
            clearInterval(heartbeatInterval);
        }
    }, 25_000);

    // ── 6. Clean up when client disconnects ───────────────────────────────
    req.on('close', () => {
        clearInterval(heartbeatInterval);
        removeClient(userId, res);
        console.log(`[SSE] Client disconnected — userId: ${userId}`);
    });
});

export default router;
