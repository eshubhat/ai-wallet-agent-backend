import { Response } from 'express';

// Map of userId → Set of active SSE response objects
const clients = new Map<string, Set<Response>>();

/**
 * Register a new SSE client for a given user.
 */
export function addClient(userId: string, res: Response): void {
    if (!clients.has(userId)) {
        clients.set(userId, new Set());
    }
    clients.get(userId)!.add(res);
}

/**
 * Remove an SSE client (called when the connection closes).
 */
export function removeClient(userId: string, res: Response): void {
    const userClients = clients.get(userId);
    if (!userClients) return;
    userClients.delete(res);
    if (userClients.size === 0) {
        clients.delete(userId);
    }
}

/**
 * Push a Server-Sent Event to all open connections for a specific user.
 * The browser's EventSource will fire `addEventListener(eventName, ...)` on receipt.
 */
export function emitToUser(userId: string, eventName: string, data: unknown): void {
    const userClients = clients.get(userId);
    if (!userClients || userClients.size === 0) return;

    const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;

    for (const res of userClients) {
        try {
            res.write(payload);
        } catch (err) {
            // Connection may have closed without firing the 'close' event — clean up
            console.error(`[SSE] Failed to write to client for user ${userId}:`, err);
            userClients.delete(res);
        }
    }
}

/**
 * Returns the total number of active SSE connections (useful for debugging).
 */
export function getClientCount(): number {
    let count = 0;
    for (const set of clients.values()) count += set.size;
    return count;
}
