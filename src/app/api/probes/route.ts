import { serverDeps } from '@/app/api/deps';
import { createProbesHandler } from '@/server/endpoints';

export const runtime = 'nodejs';

/** Generates role-specific teach-back questions for the submitted document. */
export const POST = createProbesHandler(serverDeps);
