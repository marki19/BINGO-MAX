# BINGO MAX Setup & Development

## Prerequisites
- Node.js 20+
- npm

## Installation

```bash
# Install dependencies
npm install

# Setup database (first time only)
npm run db:push
```

## Development

```bash
# Start dev server (frontend + backend)
npm run dev
```

Open http://localhost:5000 in your browser.

## Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
├── client/                 # React Frontend
│   ├── src/
│   │   ├── pages/         # Game pages
│   │   ├── components/    # React components
│   │   ├── lib/           # Game logic & state management
│   │   └── main.tsx
│   └── index.html
├── server/                # Node.js Backend
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Database operations
│   ├── db.ts              # Database connection
│   └── app.ts             # Express setup
├── shared/                # Shared types
│   └── schema.ts          # Database schema
├── package.json
└── vite.config.ts         # Vite configuration
```

## Features

✅ Multiplayer Bingo with 8 win patterns
✅ Real-time player sync
✅ Chat system
✅ Custom player limits (2-500)
✅ Developer mode for testing
✅ Responsive UI (desktop & mobile)

## Game Modes

- **Line:** 5 in a row (horizontal)
- **Diagonal:** 5 diagonal
- **Cross:** Diagonal + cross pattern
- **Box:** 4 corners
- **Corners:** All 4 corners
- **Rows:** All rows filled
- **Columns:** All columns filled
- **Full:** All 25 numbers

---

Made with ❤️ using React, Express, PostgreSQL
