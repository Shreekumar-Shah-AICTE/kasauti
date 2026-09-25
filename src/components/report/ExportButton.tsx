import type { ReactNode } from 'react';

import { CopyButton } from '@/components/report/CopyButton';
import styles from '@/components/report/report.module.css';

/**
 * The report is only useful if it leaves the browser. Copy produces plain text that pastes
 * into any email; Print uses the browser's own dialogue, so a PDF needs no extra code.
 */
export function ExportButton({ text }: { readonly text: string }): ReactNode {
  return (
    <div className={styles.bar}>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => {
          globalThis.print();
        }}
      >
        Print or save as PDF
      </button>
      <CopyButton text={text} label="Copy report" />
    </div>
  );
}
