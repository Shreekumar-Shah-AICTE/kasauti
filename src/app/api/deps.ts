import { createServerDeps } from '@/server/serverDeps';

/** One shared set of dependencies per server instance, so both routes share a rate limiter. */
export const serverDeps = createServerDeps(process.env.GEMINI_API_KEY);
