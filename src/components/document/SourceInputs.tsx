'use client';

import { type ReactNode, useId, useState } from 'react';

import checker from '@/components/checker.module.css';
import styles from '@/components/document/document.module.css';
import { LIMITS } from '@/core/constants';
import { extractPdfPages } from '@/lib/pdf/extractPages';

/** Receives a document's name and page texts once they are readable. */
export type PagesHandler = (name: string, pages: readonly string[]) => void;

const SCANNED_HELP =
  'This PDF has no selectable text, so it is probably a scan or a photo. Open it, copy the text, and paste it above.';
const UNREADABLE_HELP = 'That file could not be read as a PDF. Try pasting the text instead.';
const NOT_PDF_HELP = 'Only PDF files can be read. For anything else, paste the text above.';
const PDF_TYPE = 'application/pdf';

/** Reads a PDF in the browser, reporting progress and problems in plain words. */
async function readPdf(
  file: File,
  setStatus: (message: string) => void,
  onPages: PagesHandler,
): Promise<void> {
  if (file.type !== PDF_TYPE && !file.name.toLowerCase().endsWith('.pdf')) {
    setStatus(NOT_PDF_HELP);
    return;
  }
  setStatus(`Reading ${file.name}\u2026`);
  try {
    const result = await extractPdfPages(file);
    if (result.empty) {
      setStatus(SCANNED_HELP);
      return;
    }
    setStatus(result.truncated ? `Only the first ${String(LIMITS.maxPages)} pages were read.` : '');
    onPages(file.name, result.pages);
  } catch {
    setStatus(UNREADABLE_HELP);
  }
}

/** Pasting always works, costs nothing to explain, and keeps the document on the device. */
export function PasteBox({ onPages }: { readonly onPages: PagesHandler }): ReactNode {
  const pasteId = useId();
  const [text, setText] = useState('');
  return (
    <div>
      <label className={checker.label} htmlFor={pasteId}>
        Paste the document text
      </label>
      <textarea
        id={pasteId}
        className={checker.textarea}
        rows={7}
        maxLength={LIMITS.maxDocumentChars}
        value={text}
        aria-describedby={`${pasteId}-count`}
        placeholder="Paste your rent agreement, offer letter or contract here\u2026"
        onChange={(event) => {
          setText(event.target.value);
        }}
      />
      <div className={styles.row}>
        <span id={`${pasteId}-count`} className={checker.meta}>
          {text.length.toLocaleString('en-IN')} of {LIMITS.maxDocumentChars.toLocaleString('en-IN')}{' '}
          characters
        </span>
        <button
          type="button"
          className="btn btn-primary"
          disabled={text.trim().length === 0}
          onClick={() => {
            onPages('Pasted text', [text]);
          }}
        >
          Use this text
        </button>
      </div>
    </div>
  );
}

/**
 * A PDF picker that also accepts a dropped file. The native input is stretched, transparent,
 * over the whole zone, so dropping and keyboard use both go through the browser's own control.
 */
export function UploadBox({ onPages }: { readonly onPages: PagesHandler }): ReactNode {
  const fileId = useId();
  const [status, setStatus] = useState('');
  return (
    <div>
      <div className={styles.drop}>
        <input
          id={fileId}
          className={styles.fileInput}
          type="file"
          accept={PDF_TYPE}
          aria-describedby={`${fileId}-hint`}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file !== undefined) {
              void readPdf(file, setStatus, onPages);
            }
          }}
        />
        <label htmlFor={fileId} className={styles.dropTitle}>
          Upload a PDF
        </label>
        <span id={`${fileId}-hint`} className={styles.dropHint}>
          Choose a file or drop it here. Text PDFs up to {LIMITS.maxPages} pages, read in your browser.
        </span>
      </div>
      <p className={checker.meta} role="status">
        {status}
      </p>
    </div>
  );
}
