import { LIMITS } from '@/core/constants';
import { itemsToText } from '@/lib/pdf/layout';

/**
 * Text extracted from a PDF, one entry per page.
 *
 * `empty` is true when the file parsed but carried no selectable text, which almost always
 * means a scanned or photographed document. That is a different problem from a broken file,
 * so the UI says so instead of showing a generic failure.
 */
export interface PdfExtraction {
  readonly pages: readonly string[];
  readonly empty: boolean;
  readonly truncated: boolean;
}

/**
 * Extracts page text from a PDF in the browser. The document never leaves the device for
 * this step: pdf.js is loaded lazily on first use so the main bundle stays small.
 *
 * @param file - The user's PDF.
 * @returns Page texts, capped at `LIMITS.maxPages`. Complexity: O(total text length).
 */
export async function extractPdfPages(file: File): Promise<PdfExtraction> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString();
  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data, isEvalSupported: false }).promise;
  const limit = Math.min(doc.numPages, LIMITS.maxPages);
  const pages: string[] = [];
  for (let number = 1; number <= limit; number += 1) {
    const page = await doc.getPage(number);
    const content = await page.getTextContent();
    pages.push(itemsToText(content.items));
  }
  await doc.destroy();
  return {
    pages,
    empty: pages.every((page) => page.length === 0),
    truncated: doc.numPages > limit,
  };
}
