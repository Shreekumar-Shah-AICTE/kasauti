'use client';

import { type ReactNode, useState } from 'react';

import checker from '@/components/checker.module.css';

type Status = 'idle' | 'copied' | 'failed';

const MESSAGES: Readonly<Record<Status, string>> = {
  idle: '',
  copied: 'Copied. Paste it into an email or a message.',
  failed: 'Copying failed. Select the text and copy it, or use Print.',
};

async function copy(text: string, setStatus: (status: Status) => void): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    setStatus('copied');
  } catch {
    setStatus('failed');
  }
}

/** Copies plain text and says, in a live region, whether it worked. */
export function CopyButton({ text, label }: { readonly text: string; readonly label: string }): ReactNode {
  const [status, setStatus] = useState<Status>('idle');
  return (
    <>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => {
          void copy(text, setStatus);
        }}
      >
        {label}
      </button>
      <span aria-live="polite" className={checker.meta}>
        {MESSAGES[status]}
      </span>
    </>
  );
}
