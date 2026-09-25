import type { ReactNode } from 'react';

import { CheckerApp } from '@/components/CheckerApp';
import { Hero, SiteFooter, SiteHeader } from '@/components/SiteChrome';

/** Home page: the promise, then straight into the checker. */
export default function HomePage(): ReactNode {
  return (
    <>
      <SiteHeader />
      <main id="main" className="container">
        <Hero />
        <CheckerApp />
      </main>
      <SiteFooter />
    </>
  );
}
