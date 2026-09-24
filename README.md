# Kasauti — test what you believe before you sign

> **Kasauti** (कसौटी) is the touchstone used to test whether gold is real.

Most people sign rent agreements, offer letters and service contracts based on what they _believe_ the document says.
Kasauti takes those beliefs, plus anything you were promised verbally, and checks each one against the actual document:

- **Backed**: the document supports it, with a verified quote and page number
- **Contradicted**: the document says otherwise, and it shows you where
- **Document is silent**: nothing in it protects you, so get it in writing
- **Needs review**: the model could not produce a verifiable quote, so Kasauti refuses to guess

Every quote the AI cites is **re-checked by deterministic code** against your document before it is shown.

_Kasauti gives information, not legal advice._

## Status

🚧 Under active development. Foundation and verified-evidence core are complete.

## Development

```bash
npm install
npm run verify   # typecheck, lint, format, tests (100% core coverage), build
npm run dev
```

Requires Node 24. Copy `.env.example` to `.env.local` and set `GEMINI_API_KEY`.

## License

MIT
