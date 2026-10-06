# GitHub + Vercel deployment

The frontend runs on Vercel. The existing Node API requires one long-running server with a persistent disk: it uses SQLite, uploaded files and background email retries. Do not deploy the API as a Vercel Function or put its data on an ephemeral disk.

## 1. GitHub

Use Node 22 (at least 22.13). Run `npm ci`, `npm test`, and `npm run build`. Push this repository to a new GitHub repository. GitHub Actions repeats tests and the build on Linux.

`.gitignore` excludes secrets, database files, local uploads/data, build output and temporary work. Never force-add `.env` or `data`. The protected LAST_DESIGN_BACKUP outside this repository must stay untouched.

## 2. Persistent backend

Deploy the included Dockerfile to a Docker host with persistent disk support and HTTPS. Use **one instance**, with the disk mounted at `/var/lib/liminal`; the Node user (UID 1000) needs write access. Internal port: 5180. Health check: `/healthz`.

Set these secrets/settings in the host's dashboard (not in GitHub):

| Variable | Value |
| --- | --- |
| SITE_ORIGIN | Exact public website origin, e.g. `https://your-site.vercel.app` |
| ADMIN_EMAIL | `itsazizsaidi@gmail.com` |
| ADMIN_NOTIFICATION_EMAIL | `itsazizsaidi@gmail.com` |
| MAIL_MODE | `resend` |
| RESEND_API_KEY | Your private Resend API key |
| MAIL_FROM | `LIMINAL <hello@your-verified-domain.com>` |

Docker already sets HOST, PORT, NODE_ENV and LIMINAL_DATA_DIR. The sender domain must be verified in Resend; its test sender cannot send confirmations to arbitrary visitors. Local mail mode is intentionally blocked on public hosts.

### Preserve the current content

Before launching publicly, stop the **local API/preview server** so SQLite and uploaded files are stable. Privately copy the **entire current `data` directory**, including the database, any journal files and `uploads`, into the persistent disk. Stop the destination backend during this transfer too. Preserve filenames and give UID 1000 write access. Restart both after copying. Never upload this directory to GitHub or Vercel.

This preserves the current projects, admin account, audience and inquiries. Starting with an empty disk creates a fresh installation, not the current portfolio. Keep separate private disk backups before deployments; never reuse the protected design fallback as a live data directory.

## 3. Vercel

Import the GitHub repository, choose Node **22.x**, and set `BACKEND_ORIGIN` to the backend HTTPS origin (e.g. `https://your-api.example.com`). No path or credentials. Framework preset: Other. Build command: `npm run build:vercel`. Disable the Output Directory override. `vercel.json` selects the build; it generates `.vercel/output` using the Build Output API, with API/uploads proxies before static assets and the SPA fallback. Delete the old `vercel.mjs` from GitHub; do not leave both configuration files.

Deploy, then set the backend SITE_ORIGIN to the exact production website origin. Use the same canonical domain for admin and forms. No Resend key belongs on Vercel. Missing BACKEND_ORIGIN fails configuration explicitly instead of publishing broken forms.

Preview deployments can show the design, but authenticated/form requests from a different preview origin are intentionally rejected by the backend's origin protection. Use a separate staging backend and SITE_ORIGIN for full interactive preview testing.

## 4. Check before announcing the site

- Open and refresh `/`, `/services`, `/work`, a project page, `/our-story`, `/contact`, `/lab` and `/admin` directly.
- Verify the current portfolio and uploaded images/video are present.
- Sign into admin, submit a test inquiry, and confirm the visitor and studio both receive mail.
- Check subscription confirmation and a project PDF receipt.
- Restart the backend and confirm data/uploads survive.
- Check both mobile and desktop. Update placeholder social URLs before launch.

Preparation is not a live deployment: a backend host, persistent disk, verified email sender and Vercel environment settings are still required.

References: [Vercel external rewrites](https://vercel.com/docs/routing/rewrites), [SQLite limitations](https://vercel.com/kb/guide/is-sqlite-supported-in-vercel), [programmatic configuration](https://vercel.com/docs/project-configuration/vercel-ts).
