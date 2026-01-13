
# 1. Core Types

```ts
// src/parser/types.ts

export type ScreenshotType =
  | "UPI_RECEIPT"
  | "FOOD_DELIVERY"
  | "QUICK_COMMERCE"
  | "UNKNOWN";

export interface ParsedExpense {
  amount: number;
  currency: "INR";
  merchant: string;
  category: string;
  date: string; // ISO
  source: string;
  confidence: number;
  rawText: string;
}
```

---

# 2. Text Normalization (Critical)

```ts
// src/parser/normalize.ts

export function normalizeText(raw: string): string {
  return raw
    .replace(/\u20b9|rs\.?|inr/gi, "₹")
    .replace(/[|]/g, "I")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();
}

export function splitLines(text: string): string[] {
  return text
    .split(/\n+/)
    .map(l => l.trim())
    .filter(l => l.length > 0);
}
```

---

# 3. Screenshot Classifier

```ts
// src/parser/classifier.ts

export function classifyScreenshot(text: string): ScreenshotType {
  const t = text.toLowerCase();

  if (
    hasAny(t, ["g pay", "google pay", "upi transaction id", "paid to"])
  ) {
    return "UPI_RECEIPT";
  }

  if (
    hasAny(t, ["order details", "bill summary", "reorder", "invoice"]) &&
    hasAny(t, ["swiggy", "zomato"])
  ) {
    return "FOOD_DELIVERY";
  }

  if (hasAny(t, ["instamart", "grand total", "item bill"])) {
    return "QUICK_COMMERCE";
  }

  return "UNKNOWN";
}

function hasAny(text: string, words: string[]) {
  return words.some(w => text.includes(w));
}
```

---

# 4. Shared Helpers

```ts
// src/parser/utils.ts

export function extractLargestAmount(
  lines: string[],
  excludeKeywords: string[] = []
): number | null {
  const amounts: number[] = [];

  for (const line of lines) {
    if (excludeKeywords.some(k => line.includes(k))) continue;

    const matches = [...line.matchAll(/₹\s?([0-9,]+(\.[0-9]{1,2})?)/g)];
    for (const m of matches) {
      amounts.push(Number(m[1].replace(/,/g, "")));
    }
  }

  return amounts.length ? Math.max(...amounts) : null;
}

export function parseDate(text: string): string | null {
  const dateRegex =
    /(\d{1,2}\s[a-z]{3,9}\s\d{4}).*?(\d{1,2}:\d{2}\s?(am|pm))?/i;

  const m = text.match(dateRegex);
  if (!m) return null;

  const parsed = new Date(m[0]);
  return isNaN(parsed.getTime()) ? null : parsed.toISOString();
}
```

---

# 5. UPI (GPay) Parser

```ts
// src/parser/upi.ts

import { ParsedExpense } from "./types";
import { extractLargestAmount, parseDate } from "./utils";

export function parseUpiReceipt(
  text: string,
  lines: string[]
): ParsedExpense | null {
  if (
    text.includes("failed") ||
    text.includes("pending") ||
    !text.includes("completed")
  ) {
    return null;
  }

  const amount = extractLargestAmount(lines, [
    "platform fee",
    "gst",
    "tax",
    "cashback",
    "plan price"
  ]);

  if (!amount) return null;

  let merchant = extractMerchant(lines);
  let date = parseDate(text);

  return {
    amount,
    currency: "INR",
    merchant,
    category: inferCategory(merchant),
    date: date ?? new Date().toISOString(),
    source: "GPay",
    confidence: computeConfidence(amount, merchant, date),
    rawText: text
  };
}

function extractMerchant(lines: string[]): string {
  for (const l of lines) {
    const m = l.match(/to\s+([a-z0-9 .&_-]{3,})/);
    if (m) return titleCase(m[1]);
  }

  // header fallback
  for (const l of lines.slice(0, 5)) {
    if (/^[a-z\s]{3,40}$/.test(l) && !l.includes("google")) {
      return titleCase(l);
    }
  }

  return "Unknown Merchant";
}

function inferCategory(merchant: string): string {
  const m = merchant.toLowerCase();
  if (m.includes("vi")) return "Utilities";
  if (m.includes("apple")) return "Subscriptions";
  if (m.includes("hotel")) return "Food & Dining";
  return "Miscellaneous";
}

function computeConfidence(
  amount: number,
  merchant: string,
  date: string | null
) {
  let score = 0.5;
  if (merchant !== "Unknown Merchant") score += 0.3;
  if (date) score += 0.2;
  return score;
}

function titleCase(s: string) {
  return s.replace(/\w\S*/g, t => t[0].toUpperCase() + t.slice(1));
}
```

---

# 6. Swiggy / Zomato Parser

```ts
// src/parser/food.ts

import { ParsedExpense } from "./types";
import { parseDate } from "./utils";

export function parseFoodDelivery(
  text: string,
  lines: string[]
): ParsedExpense | null {
  let amount: number | null = null;

  for (const l of lines) {
    const m = l.match(
      /(bill total|paid|grand total)\s*₹\s?([0-9,]+(\.[0-9]{1,2})?)/
    );
    if (m) {
      amount = Number(m[2].replace(/,/g, ""));
      break;
    }
  }

  if (!amount) return null;

  const merchant = extractRestaurant(lines);
  const date = parseDate(text);

  return {
    amount,
    currency: "INR",
    merchant,
    category: "Food & Dining",
    date: date ?? new Date().toISOString(),
    source: text.includes("zomato") ? "Zomato" : "Swiggy",
    confidence: 0.9,
    rawText: text
  };
}

function extractRestaurant(lines: string[]): string {
  for (const l of lines) {
    if (
      /^[a-z\s]{3,30}$/.test(l) &&
      !l.includes("order") &&
      !l.includes("delivered")
    ) {
      return titleCase(l);
    }
  }
  return "Food Order";
}

function titleCase(s: string) {
  return s.replace(/\w\S*/g, t => t[0].toUpperCase() + t.slice(1));
}
```

---

# 7. Instamart Parser

```ts
// src/parser/instamart.ts

import { ParsedExpense } from "./types";
import { parseDate } from "./utils";

export function parseInstamart(
  text: string,
  lines: string[]
): ParsedExpense | null {
  let amount: number | null = null;

  for (const l of lines) {
    const m = l.match(/grand total\s*₹\s?([0-9,]+(\.[0-9]{1,2})?)/);
    if (m) {
      amount = Number(m[1].replace(/,/g, ""));
      break;
    }
  }

  if (!amount) return null;

  return {
    amount,
    currency: "INR",
    merchant: "Swiggy Instamart",
    category: "Groceries",
    date: parseDate(text) ?? new Date().toISOString(),
    source: "Instamart",
    confidence: 0.95,
    rawText: text
  };
}
```

---

# 8. Orchestrator (Single Entry Point)

```ts
// src/parser/index.ts

import { normalizeText, splitLines } from "./normalize";
import { classifyScreenshot } from "./classifier";
import { parseUpiReceipt } from "./upi";
import { parseFoodDelivery } from "./food";
import { parseInstamart } from "./instamart";

export function parseExpenseFromOcr(rawText: string) {
  const normalized = normalizeText(rawText);
  const lines = splitLines(normalized);

  const type = classifyScreenshot(normalized);

  switch (type) {
    case "UPI_RECEIPT":
      return parseUpiReceipt(normalized, lines);
    case "FOOD_DELIVERY":
      return parseFoodDelivery(normalized, lines);
    case "QUICK_COMMERCE":
      return parseInstamart(normalized, lines);
    default:
      return null;
  }
}
```

