# Community & client journey

Implemented 2026-10-03 in the existing LIMINAL site.

## Admin locations

- **Audience**: export confirmed subscribers or the whole active audience as UTF-8 CSV, including subscription status and consent dates. Unsubscribe and move contacts to Trash independently.
- **Corbeille**: restore contacts with their previous status. An unsubscribed contact stays unsubscribed. Existing 30-day cleanup and Empty Trash also cover contacts.
- **Liens & guide**: edit Instagram, Facebook and WhatsApp links; disable demo mode after adding real links. Add/edit/publish/hide/delete the guide's questions and approved answers in French, English and Arabic, with keywords, order and an optional internal link.
- **Retours du site**: read private feedback and mark it new, in progress or resolved.
- **Emails automatiques**: inspect queued confirmations, recipient, subject and delivery attempts. Failed messages can be retried. Sent means accepted by the transport, not confirmed inbox delivery.
- **Campagnes**: manually send studio news or offers to confirmed subscribers. Draft, preview, then explicitly confirm. This is separate from automatic form confirmations.

## Visitor experience

- Centered desktop navigation, a project CTA, Light/Dark/System preference, footer social icons and a small opt-in newsletter form.
- The guide retrieves only published studio-authored answers. Unknown questions lead to Contact. No model, AI API key or fabricated answers.
- `/feedback` accepts private bug reports, experience feedback and ideas without subscribing visitors.
- Project and collaboration forms queue branded acknowledgments. Project receipts include a PDF brief and a private download link on the success screen.
- Marks queue a branded welcome with a PNG containing the visitor's own mark and up to 23 approved marks. The visitor's pending mark is clearly presented as a private preview; other pending or rejected marks are excluded.
- Subscription requires an explicit opt-in and email confirmation. A separate welcome is queued once after confirmation. Deleting a contact invalidates old subscription links.
- Private receipt links expire after seven days and are not cached. Attachments are generated server-side; briefs are not stored in the public uploads directory.
- Automatic messages persist in SQLite, retry up to four times and preserve their first generated attachment across retries. The server must remain running to dispatch them.

## Before public launch

The current sender is `LIMINAL <onboarding@resend.dev>`, Resend's testing sender. It cannot send to arbitrary visitors. Verify a domain in Resend and set `MAIL_FROM` to a sender on that domain. Keep `itsazizsaidi@gmail.com` as the current contact and Reply-To. Set `SITE_ORIGIN` to the public HTTPS site URL so email links work outside this computer.

The social links are intentionally in demo mode and open Contact rather than another person's account. Replace them in Liens & guide. Initial guide answers describe the existing LIMINAL offer; edit them as needed.

## Verification

- Production build passed; existing non-blocking bundle size advisory remains.
- 22 automated tests passed, including authenticated CSV export, spreadsheet-formula escaping, unsubscribe/trash/restore, private PDF/PNG downloads, all collaboration receipt types, unknown/draft answer protection, feedback privacy, persistent mail retries and welcome idempotency.
- PDF pages visually reviewed, including Arabic and mixed Arabic/Latin text; PNG colors and typography reviewed.
- Browser checks: approved and unknown guide questions, theme selection, mobile layout at 390px, Arabic feedback form, a project confirmation with PDF link, admin answer creation and contact unsubscribe/delete/restore.
- Interactive submissions and admin mutation tests used a disposable local database and a captured email transport. No campaign or test message was sent to real subscribers.
