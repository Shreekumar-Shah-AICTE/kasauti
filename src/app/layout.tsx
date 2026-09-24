import './globals.css';

import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Kasauti — test what you believe before you sign',
  description:
    'Kasauti checks what you believe about a rent agreement, offer letter or contract against what it actually says, with code-verified quotes and page numbers. Information, not legal advice.',
};

export const viewport: Viewport = { themeColor: '#1f3a5f' };

/** Root layout: sets the document language and a skip link for keyboard users. */
export default function RootLayout({ children }: Readonly<{ children: ReactNode }>): ReactNode {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
