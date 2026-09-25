import type { ReactNode } from 'react';

import styles from '@/components/document/document.module.css';
import { SampleList } from '@/components/document/SampleList';
import { type PagesHandler, PasteBox, UploadBox } from '@/components/document/SourceInputs';
import { VERDICT_ORDER, VerdictBadge, VERDICTS } from '@/components/VerdictBadge';
import type { SampleDocument } from '@/samples';

const HOW_IT_WORKS = [
  {
    title: 'Add the document',
    detail: 'Paste it, upload a PDF, or try a sample. It never leaves this session.',
  },
  {
    title: 'Say what you believe',
    detail: 'Answer three questions written for your document, and add what you were told.',
  },
  {
    title: 'See what the paper says',
    detail: 'Each belief gets a verdict with the exact words and page, checked by code.',
  },
] as const;

function HowItWorks(): ReactNode {
  return (
    <ol className={styles.how} aria-label="How it works">
      {HOW_IT_WORKS.map((item) => (
        <li key={item.title}>
          <strong>{item.title}</strong>
          <span>{item.detail}</span>
        </li>
      ))}
    </ol>
  );
}

/** The four answers Kasauti can give, shown up front so the report holds no surprises. */
function VerdictLegend(): ReactNode {
  return (
    <section className={styles.legend} aria-labelledby="legend-heading">
      <h3 id="legend-heading">The four answers you can get</h3>
      <ul className={styles.legendList}>
        {VERDICT_ORDER.map((verdict) => (
          <li key={verdict}>
            <VerdictBadge verdict={verdict} />
            <p>{VERDICTS[verdict].meaning}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

interface DocumentStepProps {
  readonly onDocument: PagesHandler;
  readonly onSample: (sample: SampleDocument) => void;
}

/** Step one: get the document in, and set expectations for what comes back. */
export function DocumentStep(props: DocumentStepProps): ReactNode {
  return (
    <section aria-labelledby="document-heading">
      <h2 id="document-heading">Start with the document</h2>
      <HowItWorks />
      <div className={styles.columns}>
        <div className="panel">
          <h3>Try a sample</h3>
          <p className={styles.sampleSummary}>Synthetic documents with the traps real signers meet.</p>
          <div className={styles.divider} aria-hidden="true" />
          <SampleList onSample={props.onSample} />
        </div>
        <div className="panel">
          <h3>Use your own</h3>
          <p className={styles.sampleSummary}>Read in your browser and never stored.</p>
          <div className={styles.divider} aria-hidden="true" />
          <PasteBox onPages={props.onDocument} />
          <div className={styles.divider}>or</div>
          <UploadBox onPages={props.onDocument} />
        </div>
      </div>
      <VerdictLegend />
    </section>
  );
}
