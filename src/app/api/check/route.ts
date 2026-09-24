import { serverDeps } from '@/app/api/deps';
import { createCheckHandler } from '@/server/endpoints';

export const runtime = 'nodejs';

/** Checks the user's beliefs against the document in one batched model call. */
export const POST = createCheckHandler(serverDeps);
