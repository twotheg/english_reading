# English 10-Minute Reader

A mobile-first PWA for English 10-minute reading practice. Choose a level, pick a passage, and read with your finger. Touch a word to hear it, long-press a word to see its meaning and phonetic symbol, and use auto-play to listen word-by-word.

## Features

- **Level-based reading**: Beginner, Intermediate, Advanced — each with ~100 ten-minute passages.
- **Touch-to-speak**: Drag your finger across words and each word is spoken naturally via Web Speech API.
- **Long-press definitions**: Press and hold any word to open a popup with pronunciation, part of speech, and meanings.
- **Auto-play mode**: Listen to the passage word-by-word with live highlighting.
- **Offline-ready PWA**: Install on your phone from the browser. Service worker caches static assets and API responses.
- **Progress tracking**: Your last read word is saved locally via IndexedDB.
- **Dictionary caching**: Word definitions are cached in PostgreSQL and the browser for fast reuse.

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Drizzle ORM
- PostgreSQL (Neon)
- Web Speech API
- Free Dictionary API

## Local Development

```bash
# Install dependencies
npm install

# Set up your local database URL in .env
# DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db

# Apply database schema
npx drizzle-kit push

# Seed sample reading passages
npx tsx scripts/seed.ts

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Neon + Vercel

### 1. Create a Neon PostgreSQL database

1. Go to [https://neon.tech](https://neon.tech) and sign up.
2. Create a new project.
3. Copy the connection string. It looks like:
   ```
   postgresql://username:password@ep-....us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

### 2. Push this project to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/english-10min-reader.git
git push -u origin main
```

### 3. Deploy on Vercel

1. Go to [https://vercel.com](https://vercel.com) and import your GitHub repository.
2. Add environment variables:
   - `DATABASE_URL` = your Neon connection string
   - `SEED_TOKEN` = any secret token you choose (e.g. `my-secret-seed-token`)
3. Deploy.

### 4. Seed production database

After the first deploy, run the seed endpoint once:

```bash
curl "https://YOUR_VERCEL_DOMAIN/api/seed?token=YOUR_SEED_TOKEN"
```

Replace `YOUR_VERCEL_DOMAIN` and `YOUR_SEED_TOKEN` with your actual values.

### 5. Install PWA on your phone

- **iOS Safari**: Open the site → tap the Share button → "Add to Home Screen".
- **Android Chrome**: Open the site → tap the menu → "Add to Home Screen" / "Install app".

## API Routes

- `GET /api/levels` — list levels with passage counts
- `GET /api/passages?level=beginner&page=1&limit=20` — paginated passage list
- `GET /api/passages/[id]` — passage detail
- `GET /api/dictionary?word=hello` — word definition
- `GET /api/seed?token=...` — seed levels and passages

## Customizing Passages

Edit `src/lib/passage-generator.ts` to change topics, difficulty, or tone. Run the seed script again to update the database. The generator creates about 300 passages total across three levels.

## License

MIT
