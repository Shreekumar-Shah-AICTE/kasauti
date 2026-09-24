'use client';

import { type ReactNode, useState } from 'react';

import styles from '@/components/checker.module.css';

type Status = 'idle' | 'copied' | 'failed';

const MESSAGES: Readonly<Record<Status, string>> = {
  idle: '',
  copied: 'Report copied. Paste it into an email or a note.',
  failed: 'Copying failed. Use Print instead, or select the report and copy it.',
};

async function copy(text: string, setStatus: (status: Status) => void): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    setStatus('copied');
  } catch {
    setStatus('failed');
  }
}

/**
 * The report is only useful if it leaves the browser. Copy produces plain text that pastes
 * into any email; Print uses the browser's own dialogue, so a PDF needs no extra code.
 */
export function ExportButton({ text }: { readonly text: string }): ReactNode {
  const [status, setStatus] = useState<Status>('idle');
  return (
    <div className={styles.exportBar}>
      <button
        type="button"
        className={styles.secondary}
        onClick={() => {
          void copy(text, setStatus);
        }}
      >
        Copy report
      </button>
      <button
        type="button"
        className={styles.secondary}
        onClick={() => {
          globalThis.print();
        }}
      >
        Print or save as PDF
      </button>
      <p aria-live="polite" className={styles.status}>
        {MESSAGES[status]}
      </p>
    </div>
  );
}
