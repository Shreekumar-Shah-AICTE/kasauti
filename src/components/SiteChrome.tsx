import Link from 'next/link';
import type { ReactNode } from 'react';

import styles from '@/components/chrome.module.css';

const REPO_URL = 'https://github.com/Shreekumar-Shah-AICTE/kasauti';

/** The three promises the product keeps, repeated on every screen so trust is never implied. */
const PROMISES = ['Quotes checked by code', 'Nothing stored', 'Information, not legal advice'] as const;

/**
 * Brand mark: a touchstone (kasauti) with the gold streak a jeweller reads against it.
 * Decorative, so it is hidden from assistive technology; the word mark carries the name.
 */
function Touchstone(): ReactNode {
  return (
    <svg aria-hidden="true" width="30" height="30" viewBox="0 0 32 32" focusable="false">
      <rect x="2" y="2" width="28" height="28" rx="8" fill="#0b1628" stroke="#3a5476" />
      <path d="M8 22 L24 9" stroke="#e0b340" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M9 25 L16 19" stroke="#e0b340" strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

/** Site header: brand and the standing promises. */
export function SiteHeader(): ReactNode {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link className={styles.brand} href="/">
          <Touchstone />
          Kasauti{' '}
          <span className={styles.native} lang="hi">
            कसौटी
          </span>
        </Link>
        <ul className={styles.trust} aria-label="What Kasauti promises">
          {PROMISES.map((promise) => (
            <li key={promise}>{promise}</li>
          ))}
        </ul>
      </div>
    </header>
  );
}

/** The page's single h1 and the one-sentence promise. */
export function Hero(): ReactNode {
  return (
    <div className={styles.hero}>
      <h1>
        Test what you believe <span className={styles.accent}>before you sign.</span>
      </h1>
      <p className={styles.lead}>
        Say what you think your rent agreement, offer letter or contract says, and what you were promised.
        Kasauti checks each belief against the document itself and shows the exact words and page, found in
        your text by code rather than written by the AI.
      </p>
    </div>
  );
}

/** Footer: the legal boundary, stated plainly, and where to read the source. */
export function SiteFooter(): ReactNode {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <p>Kasauti gives information, not legal advice. Documents are never stored.</p>
        <p>
          Built with Google Gemini. <a href={REPO_URL}>Source code and how it works</a>
        </p>
      </div>
    </footer>
  );
}
