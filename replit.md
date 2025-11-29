# BINGO MAX - Multiplayer Bingo Game

## Overview

BINGO MAX is a real-time multiplayer bingo game built with a modern web stack. The application allows hosts to create games with customizable win patterns, players to join with multiple cards, and supports real-time gameplay with number calling, card marking, and winner detection. The system includes chat functionality, developer mode for testing, and handles game state synchronization across all connected clients.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript and Vite build system

**UI Components**: Radix UI primitives with custom Tailwind CSS styling using the shadcn/ui component library. Design system features custom BINGO color schemes (B/I/N/G/O letter colors) and uses Fredoka font for headings, Outfit for UI text.

**State Management**: Context API-based game state provider (`GameProvider`) that manages all game logic, player data, card state, and real-time updates. State is persisted in sessionStorage for page refresh recovery.

**Routing**: Wouter for lightweight client-side routing with two main routes:
- `/` - Home page for creating or joining games
- `/game/:gameId` - Game room for active gameplay

**Key Design Decisions**:
- Single-page application with no page reloads during gameplay
- Real-time state updates through periodic polling (no WebSockets)
- Client-side game logic for card validation and win detection
- Responsive design supporting mobile and desktop viewports

### Backend Architecture

**Runtime**: Node.js with Express.js framework

**API Design**: RESTful API with the following endpoints:
- `POST /api/games` - Create new game
- `POST /api/games/:gameId/join` - Join existing game
- `POST /api/games/:gameId/start` - Start game (host only)
- `POST /api/games/:gameId/call` - Call next number (host only)
- `POST /api/games/:gameId/mark` - Mark card number
- `POST /api/games/:gameId/bingo` - Claim bingo
- `GET /api/games/:gameId` - Get current game state

**Data Layer**: PostgreSQL database accessed through Drizzle ORM with the following schema:
- `games` - Game metadata, status, called numbers, win pattern
- `players` - Player information and card counts
- `cards` - Individual bingo cards with numbers and marked positions
- `winners` - Winner records with pattern information
- `messages` - Chat messages

**Key Design Decisions**:
- Stateless API design - all state persisted in database
- Game code generation for easy player joining (6-character alphanumeric)
- Cascade deletes for data cleanup when games/players are removed
- JSON fields for arrays (called numbers, card numbers, marked positions)

### Game Logic

**Card Generation**: Random number generation following traditional bingo rules:
- Column B: 1-15
- Column I: 16-30
- Column N: 31-45 (with free space at center)
- Column G: 46-60
- Column O: 61-75

**Win Patterns Supported**:
- Line: Any row, column, or diagonal
- Diagonal: Single diagonal only
- Cross: Both diagonals (X pattern)
- Box: Outer border (20 numbers)
- Corners: Four corner squares only
- Rows: All 5 rows filled
- Columns: All 5 columns filled
- Full Card: All 25 numbers marked

**Developer Mode**: Special role activated by typing "dev123" in chat, allowing number staging for testing without random calling.

### Deployment Architecture

**Production Setup**: Designed for separated frontend/backend deployment:
- Frontend: Vercel (static hosting)
- Backend: Railway (Node.js with PostgreSQL)
- Environment variable `VITE_API_URL` connects frontend to backend

**Development Setup**: Integrated Vite dev server with Express backend on single port (5000) for local development.

## External Dependencies

### Core Framework Dependencies
- **React 18** - UI framework
- **Express.js** - Backend web framework
- **Vite** - Build tool and dev server
- **TypeScript** - Type safety

### Database & ORM
- **PostgreSQL** - Primary database (required via `DATABASE_URL` environment variable)
- **Drizzle ORM** - Database query builder and migrations
- **@neondatabase/serverless** - Serverless Postgres client

### UI Component Libraries
- **Radix UI** - Headless accessible components (@radix-ui/react-*)
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library
- **Vaul** - Drawer component (mobile)
- **cmdk** - Command palette component
- **embla-carousel-react** - Carousel component

### State & Data Management
- **@tanstack/react-query** - Server state management and caching
- **Wouter** - Lightweight routing library
- **Zod** - Schema validation (with drizzle-zod)

### Utilities
- **date-fns** - Date manipulation
- **clsx** & **tailwind-merge** - Class name utilities
- **class-variance-authority** - Component variant management

### Development Tools
- **@replit/vite-plugin-*** - Replit-specific development enhancements
- **esbuild** - Production backend bundling

### Platform Services
- **Vercel** - Frontend hosting platform (free tier)
- **Railway** - Backend hosting with PostgreSQL (free tier with $5 credit)

**Note**: The application requires a PostgreSQL database connection. While Drizzle ORM is used, the specific database could be any PostgreSQL-compatible service (Neon, Railway, Supabase, etc.) as long as `DATABASE_URL` is configured.