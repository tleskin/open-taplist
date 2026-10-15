# OpenTapList

An open-source tap list display for homebrewers. Put it on a TV in the garage,
manage what's on tap from your phone.

## Features

- **TV-friendly tap list** (`/`) — big, high-contrast tap cards with beer name,
  style, ABV, IBU, and tasting notes. Polls for updates every 30 seconds, so the
  display stays fresh with no refresh button mashing.
- **Admin panel** (`/admin`) — add, edit, delete, and toggle beers on/off tap.
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

# 3. Run migrations + seed sample beers (needs a local DATABASE_URL)
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

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FYOUR_USERNAME%2Fopen-taplist)

> **Note:** the button above uses the placeholder repo URL
> `https://github.com/YOUR_USERNAME/open-taplist`. After pushing this project to
> GitHub, replace `YOUR_USERNAME/open-taplist` with your real repo path.

When deploying on Vercel, attach a Postgres database for `DATABASE_URL` —
[Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) or
[Neon](https://neon.tech) both work. Set `NEXT_PUBLIC_BREWERY_NAME` to your
brewery's name. Then run the migration once against your production database:

```bash
DATABASE_URL="<your-production-url>" npm run db:migrate
npm run db:seed   # optional: sample beers to start with
```

## Environment variables

| Variable                 | Required | Description                                              |
| ------------------------ | -------- | -------------------------------------------------------- |
| `DATABASE_URL`           | Yes      | Postgres connection string                               |
| `NEXT_PUBLIC_BREWERY_NAME` | No     | Brewery name shown in the tap list header (default: "My Home Brewery") |
| `POSTGRES_USER`          | No       | Docker Compose only — Postgres user (default: `taplist`) |
| `POSTGRES_PASSWORD`      | No       | Docker Compose only — Postgres password                  |
| `POSTGRES_DB`            | No       | Docker Compose only — Postgres database (default: `taplist`) |

## Database

- Schema lives in `db/schema.ts`; migrations in `drizzle/`.
- `npm run db:generate` — generate a migration from schema changes
- `npm run db:migrate` — apply migrations (`DATABASE_URL` must be set)
- `npm run db:seed` — insert 4 sample homebrew beers

## Contributing

Issues and pull requests are welcome. The roadmap is simple: keep the tap list
great, and add features homebrewers actually ask for — batch tracking,
fermentation logging, Untappd-style check-ins, you name it. Open an issue first
if you're planning something big so we don't duplicate work.

## License

MIT — see [LICENSE](LICENSE).
