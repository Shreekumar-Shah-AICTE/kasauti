import type { ReactNode } from 'react';

import { CheckerApp } from '@/components/CheckerApp';

/** Home page: a short promise, then straight into the checker. */
export default function HomePage(): ReactNode {
  return (
    <main id="main" className="container">
      <h1>Kasauti</h1>
      <p className="tagline">Test what you believe about a legal document before you sign it.</p>
      <p>
        Tell Kasauti what you believe, and what you were promised. It tests each belief against your actual
        document and answers <strong>You were right</strong>, <strong>The document says otherwise</strong> or{' '}
        <strong>The document never says</strong> — each one with a quote and page number that code found in
        your document, not a summary written for you.
      </p>
      <p className="help">
        Anything your document never says becomes a short list to ask for in writing. If the model cannot be
        reached, Kasauti still runs and says plainly that nothing was checked.
      </p>
      <CheckerApp />
      <p className="notice">Kasauti gives information, not legal advice. Nothing you upload is stored.</p>
    </main>
  );
}
