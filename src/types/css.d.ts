/**
 * Type declarations for stylesheet imports.
 *
 * Next.js generates an equivalent declaration in `next-env.d.ts`, but that file is generated
 * rather than committed, so a fresh clone (or CI) would type every CSS module as `any` and the
 * type-aware lint rules would fail. Declaring it here keeps `npm run verify` honest anywhere.
 */
declare module '*.module.css' {
  const classes: Readonly<Record<string, string>>;
  export default classes;
}

declare module '*.css';
