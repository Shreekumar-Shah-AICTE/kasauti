'use client';

import { type ReactNode, useId, useState } from 'react';

import styles from '@/components/checker.module.css';
import { LIMITS } from '@/core/constants';
import { extractPdfPages } from '@/lib/pdf/extractPages';
import { type SampleDocument, SAMPLES } from '@/samples';

type PagesHandler = (name: string, pages: readonly string[]) => void;

const SCANNED_HELP =
  'This PDF has no selectable text, so it is probably a scan or a photo. Open it, copy the text, and paste it below.';

const UNREADABLE_HELP = 'That file could not be read as a PDF. Try pasting the text instead.';

/** Reads a PDF in the browser, reporting progress and problems in plain words. */
async function readPdf(
  file: File,
  setStatus: (message: string) => void,
  onPages: PagesHandler,
): Promise<void> {
  setStatus(`Reading ${file.name}…`);
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

function PasteBox({ onPages }: { readonly onPages: PagesHandler }): ReactNode {
  const pasteId = useId();
  const [text, setText] = useState('');
  return (
    <>
      <label className={styles.label} htmlFor={pasteId}>
        Paste the document text
      </label>
      <textarea
        id={pasteId}
        className={styles.textarea}
        rows={10}
        maxLength={LIMITS.maxDocumentChars}
        value={text}
        placeholder="Paste your rent agreement, offer letter or contract here…"
        onChange={(event) => {
          setText(event.target.value);
        }}
      />
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.primary}
          disabled={text.trim().length === 0}
          onClick={() => {
            onPages('Pasted text', [text]);
          }}
        >
          Use this text
        </button>
      </div>
    </>
  );
}

function UploadBox({ onPages }: { readonly onPages: PagesHandler }): ReactNode {
  const fileId = useId();
  const [status, setStatus] = useState('');
  return (
    <>
      <label className={styles.label} htmlFor={fileId}>
        Or upload a PDF
      </label>
      <input
        id={fileId}
        className={styles.file}
        type="file"
        accept="application/pdf"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file !== undefined) {
            void readPdf(file, setStatus, onPages);
          }
        }}
      />
      <p className={styles.status} role="status">
        {status}
      </p>
    </>
  );
}

function SampleList({ onSample }: { readonly onSample: (sample: SampleDocument) => void }): ReactNode {
  return (
    <ul className={styles.samples}>
      {SAMPLES.map((sample) => (
        <li key={sample.id}>
          <button
            type="button"
            className={styles.sample}
            onClick={() => {
              onSample(sample);
            }}
          >
            <span className={styles.sampleTitle}>{sample.title}</span>
            <span className={styles.sampleSummary}>{sample.summary}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

interface DocumentStepProps {
  readonly onDocument: PagesHandler;
  readonly onSample: (sample: SampleDocument) => void;
}

/**
 * Step one: get the document in. Pasting is offered first because it always works, costs
 * nothing to explain, and keeps the document on the device.
 */
export function DocumentStep(props: DocumentStepProps): ReactNode {
  return (
    <section aria-labelledby="document-heading">
      <h2 id="document-heading">Start with the document</h2>
      <p className={styles.help}>
        Paste the text, or upload a PDF. Files are read in your browser and are never stored.
      </p>
      <PasteBox onPages={props.onDocument} />
      <UploadBox onPages={props.onDocument} />
      <h3>Or try a sample</h3>
      <SampleList onSample={props.onSample} />
    </section>
  );
}
