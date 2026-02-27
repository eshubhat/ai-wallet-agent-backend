import axios from 'axios';

let currentSolPriceUsd: number | null = null;
let lastUpdateAt = 0;
const POLLING_INTERVAL_MS = 60_000; // 1 minute

export const getSolPrice = async (): Promise<number | null> => {
    const now = Date.now();

    // Return cached price if less than 60s old
    if (currentSolPriceUsd !== null && (now - lastUpdateAt) < POLLING_INTERVAL_MS) {
        return currentSolPriceUsd;
    }

    try {
        const res = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
            params: {
                ids: 'solana',
                vs_currencies: 'usd'
            }
        });

        currentSolPriceUsd = res.data.solana.usd;
        lastUpdateAt = now;

        return currentSolPriceUsd;
    } catch (error: any) {
        console.error('[Oracle] Failed to fetch SOL price from CoinGecko:', error.message);
        // Fall back to stale cache if available
        return currentSolPriceUsd;
    }
};
