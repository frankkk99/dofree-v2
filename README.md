# DOFree v2 — Movie Discovery Web App

DOFree v2 is a modern movie discovery web application concept built as a portfolio project. The goal is to create a clean, cinematic, Netflix-inspired interface for browsing movies, searching titles, exploring categories, viewing details, and watching official trailers.

This repository is designed to demonstrate practical front-end and full-stack development skills, including UI architecture, responsive design, API integration planning, reusable components, and deployment-ready project structure.

> This project is intended for portfolio and educational purposes. It focuses on movie discovery, metadata, and official trailer presentation, not unauthorized streaming.

---

## Project Goals

- Build a polished movie discovery web app suitable for a programmer portfolio
- Recreate the cinematic feel of a premium streaming interface
- Keep the codebase modular, scalable, and easy to maintain
- Support mobile-first responsive design
- Prepare for safe API integration through server-side routes
- Use English movie titles as the primary display name while keeping Thai titles searchable in details
- Create a strong foundation for future features such as login, favorites, premium UI, admin tools, and analytics

---

## Key Features

### Current Planned Features

- Cinematic hero section
- Horizontal movie category rail under the hero
- Compact search input integrated into the category rail
- Movie rows by genre and popularity
- Responsive movie cards
- Movie detail modal
- Cast section optimized for mobile
- Official trailer player support
- Favorites concept
- Premium and login UI states
- Mobile-first navigation
- Glassmorphism UI elements

### Future Features

- TMDB API integration through secure server-side routes
- Advanced search and filters
- User authentication
- Favorite watchlist
- Admin dashboard for curated sections
- SEO-friendly movie detail pages
- Analytics dashboard
- PWA support

---

## Tech Stack

| Area | Technology |
|---|---|
| Framework | Next.js |
| Language | TypeScript |
| UI | React |
| Styling | Tailwind CSS |
| Deployment | Vercel |
| API Plan | Server-side route handler for TMDB |
| State/UI | Component-based architecture |

---

## Why This Project Matters

This project is built to showcase more than just visual design. It demonstrates how a real interface can be structured into maintainable parts:

- Components are separated by responsibility
- UI and data logic are planned independently
- API keys are intended to stay server-side
- Mobile layout is treated as a core experience
- The project can grow into a production-grade web app

---

## Suggested Architecture

```txt
app/
  layout.tsx
  page.tsx
  globals.css
  api/
    tmdb/
      route.ts

components/
  Header.tsx
  Hero.tsx
  CategoryRail.tsx
  SearchBox.tsx
  MovieRow.tsx
  MovieCard.tsx
  MovieModal.tsx
  Player.tsx
  CastGrid.tsx
  PremiumButton.tsx
  LoginButton.tsx

lib/
  tmdb.ts
  genres.ts
  movies.ts
  format.ts

types/
  movie.ts
```

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Run development server

```bash
npm run dev
```

Open the local development URL in your browser.

### 3. Build for production

```bash
npm run build
```

---

## Environment Variables

When API integration is added, use an environment variable instead of exposing keys in the browser.

```env
TMDB_ACCESS_TOKEN=your_tmdb_read_access_token
```

The token should only be used inside server-side route handlers such as:

```txt
app/api/tmdb/route.ts
```

---

## Portfolio Positioning

This project can be presented as:

**A cinematic movie discovery platform built with Next.js, TypeScript, and Tailwind CSS, designed with a mobile-first UX, scalable component architecture, and secure API integration planning.**

It can demonstrate skills in:

- Front-end architecture
- Responsive UI design
- React component design
- API integration planning
- Vercel deployment workflow
- UX thinking
- Product design translation into code

---

## Development Roadmap

### Phase 1 — UI Foundation

- Set up Next.js project
- Build layout and global theme
- Create header, hero, movie cards, and movie rows
- Add category rail and search input

### Phase 2 — Interaction Layer

- Add movie modal
- Add trailer player
- Add cast grid
- Add search and category filtering

### Phase 3 — API Integration

- Add secure TMDB route handler
- Fetch movies by category
- Fetch details, credits, and trailers
- Add loading and error states

### Phase 4 — Portfolio Polish

- Improve README screenshots
- Add live demo link
- Add feature checklist
- Add technical write-up
- Add deployment notes

---

## Status

Initial portfolio scaffold in progress.

---

## Author

Created by Frank / AlphaLab HQ as part of a programmer portfolio project.
