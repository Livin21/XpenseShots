# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

xpenseshots is a zero-friction expense tracker SPA that converts screenshot images of receipts/transactions to expense records. Core principles:
- **Zero Backend**: All processing runs locally in the browser
- **Zero Accounts**: No authentication required
- **Zero Cloud**: Complete offline-first, no external data transmission

Target use cases: Tracking GPay/UPI transactions, Swiggy/Zomato food orders, and Instamart purchases (INR currency).

## Commands

```bash
npm run dev      # Start dev server on port 3000
npm run build    # Production build (vite build + tsc type check)
npm run test     # Run tests once (vitest run)
npm run preview  # Preview production build
```

## Tech Stack

- **Language**: JavaScript/JSX (not TypeScript, though type-checked on build)
- **Framework**: React 19 with Vite 7
- **Routing**: TanStack Router (code-based routing)
- **Testing**: Vitest + React Testing Library + jsdom
- **Path alias**: `@` maps to `./src`

## Architecture

### Current State
Fresh TanStack App scaffolding with code-based routing:
- `src/main.jsx` - Router setup and app entry point
- `src/App.jsx` - Root component (home page)

### Planned Architecture (see plan.md)
```
src/
├── ocr/        # Tesseract.js + Web Worker for image processing
├── parser/     # Rule-based expense extraction (see parser.md)
├── storage/    # Dexie wrapper for IndexedDB
├── components/ # UploadDropzone, ExpenseCard, ExpenseList, ConfidenceReview
├── hooks/      # useOcr, useParseExpense, useExpenses
└── routes/     # / (upload) and /expenses (list)
```

### Key Design Decisions
- **OCR Pipeline**: Tesseract.js running in Web Worker to avoid blocking UI
- **Parsing Pipeline**: Normalize text → Classify screenshot type → Apply parser rules
- **Confidence-driven UX**: Auto-save when confidence ≥0.75, prompt review when <0.75
- **Storage**: IndexedDB via Dexie, keyed by image hash for deduplication

## Planning Documents

- **plan.md**: Development roadmap with 4 milestones and folder structure
- **parser.md**: Parsing logic specification including screenshot types (UPI_RECEIPT, FOOD_DELIVERY, QUICK_COMMERCE) and extraction rules
