/**
 * Vercel serverless entry point.
 * Exports the Express app as the default handler — Vercel wraps it per-request.
 * The traditional server.ts (using app.listen) is kept for local development.
 */
import app from './app';

export default app;
