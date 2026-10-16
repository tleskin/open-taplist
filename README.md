<img src="public/logo-lockup-light.png#gh-light-mode-only" alt="OpenTaplist" width="360" />
<img src="public/logo-lockup-dark.png#gh-dark-mode-only" alt="OpenTaplist" width="360" />

# OpenTapList

An open-source tap list display for homebrewers. Put it on a TV in the garage,
manage what's on tap from your phone.

## Live demo

Try it here: **https://open-taplist-demo.vercel.app**

No login needed — it's a public playground. Use the **Try the admin →**
link in the footer to poke around the dashboard: add a pour, restyle the
theme, cheer a beer. The demo reseeds itself with sample data whenever its
database is empty, so don't be surprised if your experiments vanish.

![Tap list on a TV](screenshots/taplist-tv.png)
![Admin dashboard](screenshots/admin.png)

## Features

- **TV-friendly tap list** (`/`) — big, high-contrast tap cards with pour name,
  style, ABV, IBU, and tasting notes. Polls for updates every 30 seconds, so the
  display stays fresh with no refresh button mashing.
- **Admin panel** (`/admin`) — add, edit, delete, and toggle pours on/off tap.
  Changes appear on the display automatically.
- **Custom brewery name** via the `NEXT_PUBLIC_BREWERY_NAME` env var.
- **One-step deploys** — a Vercel Deploy button for hosted use, and Docker
  Compose for self-hosting (including a Raspberry Pi in the garage).

## Tech stack

Next.js (App Router) · TypeScript · Tailwind CSS · Drizzle ORM · Postgres

## Quickstart — local with Docker (recommended)

```bash
# 1. Copy the env file and adjust if you like
cp .env.example .env

# 2. Start Postgres + the app
docker compose up --build -d

# 3. Run migrations + seed sample pours (needs a local DATABASE_URL)
export DATABASE_URL=postgres://taplist:taplist@localhost:5432/taplist
npm run db:migrate
npm run db:seed
```

Then open http://localhost:3000 for the tap list and
http://localhost:3000/admin to manage it.

## Quickstart — local dev (no Docker)

```bash
cp .env.example .env   # point DATABASE_URL at a Postgres you control
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Ftleskin%2Fopen-taplist&env=ADMIN_PASSWORD)

> **Note:** the button clones `tleskin/open-taplist`. If you fork the project,
> update the `repository-url` in the button link above to point at your fork.

When deploying on Vercel, attach a Postgres database for `DATABASE_URL` —
[Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) or
[Neon](https://neon.tech) both work. Set `NEXT_PUBLIC_BREWERY_NAME` to your
brewery's name. Then run the migration once against your production database:

```bash
DATABASE_URL="<your-production-url>" npm run db:migrate
npm run db:seed   # optional: sample pours to start with
```

## Environment variables

| Variable                 | Required | Description                                              |
| ------------------------ | -------- | -------------------------------------------------------- |
| `DATABASE_URL`           | Yes      | Postgres connection string                               |
| `NEXT_PUBLIC_BREWERY_NAME` | No     | Brewery name shown in the tap list header (default: "My Home Brewery") |
| `ADMIN_USERNAME`         | No       | Admin login username (default: `admin`)                  |
| `ADMIN_PASSWORD`         | No       | Admin login password — set this to protect `/admin` (see below) |
| `DEMO_MODE`              | No       | Set to `true` on a demo instance: skips admin auth, shows a Demo badge + admin link, and the Vercel build runs migrations + seeds sample data if the database is empty |
| `POSTGRES_USER`          | No       | Docker Compose only — Postgres user (default: `taplist`) |
| `POSTGRES_PASSWORD`      | No       | Docker Compose only — Postgres password                  |
| `POSTGRES_DB`            | No       | Docker Compose only — Postgres database (default: `taplist`) |

## Admin authentication

The admin dashboard (`/admin`) uses HTTP Basic Auth. Set `ADMIN_PASSWORD`
(and optionally `ADMIN_USERNAME`, default `admin`) and the browser will ask
for the login once, then remember it. This covers the dashboard and settings
writes. The tap list itself and the cheers button stay public — cheers have
their own rate limiting.

If `ADMIN_PASSWORD` is not set, the admin stays open — fine for a garage LAN,
but set a password for any publicly reachable deploy. The Vercel deploy
button above prompts for it.

## Database

- Schema lives in `db/schema.ts`; migrations in `drizzle/`.
- `npm run db:generate` — generate a migration from schema changes
- `npm run db:migrate` — apply migrations (`DATABASE_URL` must be set)
- `npm run db:seed` — insert sample homebrews (skips if any exist; `--force` to reseed)

## Contributing

Issues and pull requests are welcome. The roadmap is simple: keep the tap list
great, and add features homebrewers actually ask for — batch tracking,
fermentation logging, Untappd-style check-ins, you name it. Open an issue first
if you're planning something big so we don't duplicate work.

## License

MIT — see [LICENSE](LICENSE).
