# School Web and Server API alignment

The local Demo mode remains available with in-memory sample data. Production is built with `VITE_APP_MODE=live` and uses the existing same-origin PHP endpoints under `/api/auth/school/` and `/api/school/`. Endpoint fields and actions follow `Server/docs/openapi-school.json` and the implementation under `Server/includes/school/`; no API secret is sent to the browser. See [deployment.md](deployment.md) for the current server and future domain setup.

## API coverage

| Web area | Existing Server operations |
| --- | --- |
| Sign-in and account | login, session, logout, password |
| School settings | profile, logo upload |
| Recipients | directory, paged student search |
| Notices | paged list, create, edit, revoke, history |
| Terms | create, edit, list |
| Timetable | paged class lists, detail, base upload, temporary whole-week replace/cancel, history, restore |
| Calendar | history, full version upload, restore, original file download |
| Ad review | paged list, decision, withdraw, resubmit, history |
| Dashboard | authoritative API metrics and sparse seven-day review trend |

API calls are same-origin, omit browser ambient credentials, use a short-lived Bearer token, and follow all result pages. A 409 refreshes current state before retry. Session tokens are stored in session storage unless “remember me” selects local storage; plaintext passwords are never persisted. Changing a password revokes all administrator sessions.

Notice editing preserves the entire structured recipient selector until the operator changes scope. Temporary timetable files replace whole selected weeks. A temporary calendar arrangement is merged into the current original ICS and uploaded as a complete new version because Server has no separate arrangement endpoint. Account and logo updates use the existing profile endpoints.

## File import

Import is shared across notices, timetable/calendar ICS, and school logos. It validates file size, extension, content signatures and parseable structure before displaying a preview. The user must explicitly apply or submit the imported content.

DOCX conversion runs in the browser with external file access disabled. Paragraphs, lists, links and tables convert to Markdown; HTML is rendered through a sanitized Markdown renderer. Embedded images are not uploaded or rendered and are reported in the preview. `.docx`, Markdown and UTF-8 text are supported. Legacy binary `.doc` must be opened in Word/LibreOffice and saved as `.docx`; renaming `.doc` does not convert it. ICS structure is checked before Server performs authoritative recurrence, timezone and week validation. Logo content is checked by image signature and dimensions.

## Remaining boundaries

- The IP-only deployment is HTTP pending a domain and trusted TLS certificate; do not use routine administration over an untrusted network until HTTPS is enabled.
- Advertising history is fetched explicitly to avoid unnecessary paged requests. Unavailable exposure, click, live-user and revenue metrics remain unavailable rather than simulated.
- Old student credentials remain separate from `school_admin_accounts`.
- `npm run build`, `npm run lint`, and the Node test suite validate the Web client. PHP deployment validation and limitations are recorded in the Server handoff and validation documents.
