import { serverDeps } from '@/app/api/deps';
import { createProbesHandler } from '@/server/endpoints';

export const runtime = 'nodejs';

/** Allows the 45 s model abort to fire before the platform kills the function. */
export const maxDuration = 60;

/** Generates role-specific teach-back questions for the submitted document. */
export const POST = createProbesHandler(serverDeps);
