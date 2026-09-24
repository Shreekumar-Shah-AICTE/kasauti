# Security Policy

## Data handling

- Documents are parsed **in the browser**. Only extracted text is sent to the server, for one analysis request.
- Nothing is stored: no database, no logs of document text, no analytics on content.
- The Gemini API key lives only in server environment variables (`GEMINI_API_KEY`) and is never sent to the client.

## Threat model (summary)

- **Prompt injection inside uploaded documents**: document text is passed as delimited data, never as instructions,
  and every model-cited quote is verified by code against the source before display.
- **Abuse / cost**: input size limits and per-IP rate limiting on API routes.

## Reporting a vulnerability

Please open a private security advisory on this repository or email parzivalarts@gmail.com.
