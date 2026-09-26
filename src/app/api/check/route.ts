import { serverDeps } from '@/app/api/deps';
import { createCheckHandler } from '@/server/endpoints';

export const runtime = 'nodejs';

/** Allows the 45 s model abort to fire before the platform kills the function. */
export const maxDuration = 60;

/** Checks the user's beliefs against the document in one batched model call. */
export const POST = createCheckHandler(serverDeps);
