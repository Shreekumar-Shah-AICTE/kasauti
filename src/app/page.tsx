import type { ReactNode } from 'react';

/** Landing page. The interactive checker is added in later slices. */
export default function HomePage(): ReactNode {
  return (
    <main id="main" className="container">
      <h1>Kasauti</h1>
      <p className="tagline">Test what you believe about a legal document before you sign it.</p>
      <p>
        Tell Kasauti what you believe, and what you were promised. It checks each belief against your actual
        document and marks it <strong>Backed</strong>, <strong>Contradicted</strong> or{' '}
        <strong>Document is silent</strong>, with a quote and page number verified by code.
      </p>
      <p className="notice">Kasauti gives information, not legal advice. Nothing you upload is stored.</p>
    </main>
  );
}
