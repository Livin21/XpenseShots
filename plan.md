# plan.md

## Zero-Friction Expense Tracker — Development Plan

### Core Principle

* **Zero backend**
* **Zero accounts**
* **Zero cloud**
* Everything runs **locally in the browser**
* Screenshots → Expenses → Stored in IndexedDB

---

## 1. Project Baseline

### Tech Stack

* Framework: React
* Router: **TanStack Router**
* OCR: Tesseract.js (WASM)
* Storage: IndexedDB (Dexie)
* Parsing: Deterministic rule-based (see `parser.md`)
* Build: Vite

---

## 2. Folder Structure

```
src/
├── app/
│   ├── router.ts
│   ├── providers.tsx
│   └── layout.tsx
│
├── routes/
│   ├── index.tsx            # Upload + recent expenses
│   └── expenses.tsx         # Full expense list
│
├── ocr/
│   ├── worker.ts            # Web Worker OCR
│   └── preprocess.ts        # Image preprocessing
│
├── parser/
│   ├── index.ts             # Orchestrator
│   ├── classifier.ts
│   ├── normalize.ts
│   ├── utils.ts
│   ├── upi.ts
│   ├── food.ts
│   ├── instamart.ts
│   └── types.ts
│
├── storage/
│   ├── db.ts                # Dexie setup
│   └── expenses.ts          # CRUD helpers
│
├── components/
│   ├── UploadDropzone.tsx
│   ├── ExpenseCard.tsx
│   ├── ExpenseList.tsx
│   ├── ConfidenceReview.tsx
│   └── EmptyState.tsx
│
├── hooks/
│   ├── useOcr.ts
│   ├── useParseExpense.ts
│   └── useExpenses.ts
│
├── types/
│   └── expense.ts
│
└── main.tsx
```

---

## 3. Routing Plan (TanStack Router)

### Routes

#### `/`

**Purpose**

* Primary interaction surface

**Contents**

* Screenshot upload (drag / tap)
* OCR progress
* Last 5 expenses

#### `/expenses`

**Purpose**

* Review all stored expenses

**Contents**

* Chronological list
* Amount, merchant, category
* No editing in v0 (except low confidence)

---

## 4. OCR Pipeline (Client-Only)

### Step 1: Image Intake

* Drag & drop
* Mobile file picker
* Accept `.png`, `.jpg`

### Step 2: Preprocessing (`ocr/preprocess.ts`)

* Resize max width: 1200px
* Convert to grayscale
* Increase contrast
* Strip EXIF metadata

### Step 3: OCR Execution

* Run inside **Web Worker**
* Tesseract config:

  * Language: `eng`
  * Character whitelist
* Emit:

  * Raw text
  * Confidence metadata

---

## 5. Parsing Pipeline

### Input

* Raw OCR text

### Flow

1. Normalize text
2. Classify screenshot type
3. Route to parser
4. Generate `ParsedExpense`
5. Compute confidence

### Output

```ts
{
  amount,
  merchant,
  category,
  date,
  source,
  confidence
}
```

### Reference

* Parsing logic defined in `parser.md`
* Implementation already complete

---

## 6. Storage Layer (IndexedDB)

### Database

* Name: `expenses-db`
* Table: `expenses`

### Schema

```ts
Expense {
  id: string           // image hash
  amount: number
  currency: "INR"
  merchant: string
  category: string
  date: string
  source: string
  confidence: number
  createdAt: string
}
```

### Rules

* Deduplicate by `id`
* Never store images
* Never sync externally

---

## 7. Confidence-Driven UX

### Auto-Save

* confidence ≥ 0.75

### Review Required

* confidence < 0.75

#### Review UI

* Inline amount edit
* Inline merchant edit
* Single “Confirm” button

No forms. No modals.

---

## 8. UX States

### Upload

* Idle
* Processing
* Parsed
* Needs Review
* Error

### Empty State

* “Upload your first screenshot”
* Privacy-first copy

---

## 9. Privacy & Trust (Explicit)

Display prominently:

* “All data stays on your device”
* “Works offline”
* “No servers involved”

This is not marketing — this is a **product feature**.

---

## 10. Non-Goals (v0)

Explicitly **out of scope**:

* Accounts
* Cloud sync
* Item-level breakdown
* Budgeting
* Categories editing
* CSV export

---

## 11. Testing Strategy

### Unit Tests

* Parser tests using real OCR output
* Golden fixtures from screenshots

### Manual Tests

* Low-light screenshots
* Cropped screenshots
* Multiple currency symbols

---

## 12. Performance Constraints

### OCR

* Slow by nature
* Always show progress
* Cache results by image hash

### Memory

* Revoke object URLs
* Release canvases aggressively

---

## 13. Milestones

### Milestone 1 — Skeleton (Day 1)

* Router
* Upload UI
* OCR worker wired

### Milestone 2 — Parsing (Day 2)

* Integrate `parser.md`
* Render parsed expense

### Milestone 3 — Storage (Day 3)

* IndexedDB persistence
* Expense list route

### Milestone 4 — Polish (Day 4–5)

* Confidence review UI
* Mobile UX
* Error handling

---

## 14. Definition of Done (v0)

* Upload screenshot → expense appears
* Reload → data persists
* Works offline
* Handles:

  * GPay
  * Swiggy
  * Zomato
  * Instamart
* No backend code exists

---

## 15. Next Extensions (Post-v0)

* PWA install
* Export CSV
* Category overrides
* Encrypted local backup
* Optional cloud sync (opt-in)

