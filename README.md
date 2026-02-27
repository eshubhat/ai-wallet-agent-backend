# AutoFi - Backend

This is the backend component of AutoFi. Built with Node.js, Express, and Prisma, it acts as the orchestration layer and background worker for the application.

## ✨ Features

- **NLP Orchestration:** Connects to Google's Gemini LLM to parse natural language (e.g., "Send 1 SOL to Alice") into structured JSON intents.
- **Scheduled Task Engine:** Uses `node-cron` to continuously monitor pending user tasks. It can trigger tasks based on time, token prices (via CoinGecko), or account inactivity.
- **Server-Sent Events (SSE):** Pushes real-time updates to the frontend dashboard when a scheduled task is triggered or when blockchain data updates.
- **Email Notifications:** Uses `nodemailer` to alert users via email when a condition-based task is ready to execute.
- **Postgres Database:** Uses Prisma and a local Aurora Postgres database for fast, lightweight tracking of users, transactions, stakes, and scheduled tasks.

## 🚀 Getting Started

### Prerequisites
- Node.js (v20.x or newer)
- [pnpm](https://pnpm.io/)

### Installation

1. Install dependencies:
```bash
pnpm install
```

2. Environment Configuration:
Copy the example environment file:
```bash
cp .env.example .env
```
Fill in the required keys, primarily:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"
JWT_SECRET="your-super-secret-jwt-key"
FRONTEND_URL="http://localhost:5173"
GEMINI_API_KEY="your-gemini-api-key"

# Optional: For email notifications when scheduled tasks trigger
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-16-char-app-password"
EMAIL_FROM="AutoFi <agent@autofi.work>"
```

### Database Setup

Initialize the Postgres database schema:
```bash
pnpm exec prisma db push
```

### Running the Server

Start the application in development mode:
```bash
pnpm run dev
```
The server will start on [http://localhost:8080](http://localhost:8080) (or the port defined in your environment). The background `cron` job will also begin running automatically.

## 📁 Key Directories

- `src/modules/chats`: Contains the core `agent.service.ts` logic that interacts with Gemini to interpret user prompts (including scheduling logic).
- `src/modules/scheduler`: Contains the engine for background tasks (`scheduler.job.ts`), the price oracle (`price.oracle.ts`), and email dispatcher (`email.service.ts`).
- `prisma`: Contains the `schema.prisma` file which defines User, Transaction, StakeAccount, Contact, and ScheduledTask models.
