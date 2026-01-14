# xpenseshots

> Turn payment screenshots into organized expenses instantly. Zero-friction expense tracking with OCR - no accounts, no cloud, 100% private.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

**Screenshot to Expense** - Drop a payment screenshot and watch it transform into a structured expense entry with amount, merchant, category, and date extracted automatically.

**100% Private** - All processing happens locally in your browser. No data ever leaves your device. No accounts, no cloud, no tracking.

**Works Offline** - Once loaded, works completely offline. Perfect for travel or areas with poor connectivity.

**Smart Recognition** - Supports multiple payment sources:
- Google Pay (GPay) / UPI receipts
- Swiggy & Zomato food orders
- Swiggy Instamart grocery orders
- Bank SMS notifications (HDFC, ICICI, SBI, Axis, Kotak, Federal Bank)

**Analytics Dashboard** - Track your spending with:
- Monthly/weekly summaries
- Category-wise breakdown (pie chart)
- Spending trends over time
- Top merchants ranking
- Month-over-month comparison

**Powerful Search & Filters**
- Search by merchant name
- Filter by date range, category, or source
- Sort by amount, date, or merchant

**Manual Entry** - Add expenses manually when you don't have a screenshot

## Demo

Try it live: [xpenseshots.livinmathew.com](https://xpenseshots.livinmathew.com)

## How It Works

1. **Upload** - Drop or select a payment screenshot
2. **OCR** - Tesseract.js extracts text from the image locally
3. **Parse** - Smart parsers identify the payment type and extract structured data
4. **Save** - Expense is saved to IndexedDB (browser storage)

```
Screenshot → OCR (Tesseract.js) → Parser → IndexedDB
```

All processing happens in a Web Worker to keep the UI responsive.

## Tech Stack

- **Framework**: React 19 + Vite
- **Routing**: TanStack Router
- **OCR**: Tesseract.js (runs locally in browser)
- **Storage**: IndexedDB via Dexie
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/Livin21/XpenseShots.git
cd XpenseShots

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── components/     # React components
├── hooks/          # Custom React hooks
├── ocr/            # Tesseract.js worker and preprocessing
├── parser/         # Payment screenshot parsers
│   ├── classifier.js   # Detects screenshot type
│   ├── upi.js          # GPay/UPI parser
│   ├── food.js         # Swiggy/Zomato parser
│   ├── instamart.js    # Swiggy Instamart parser
│   ├── bankSms.js      # Bank SMS parser
│   └── utils.js        # Shared parsing utilities
├── storage/        # IndexedDB wrapper (Dexie)
├── lib/            # Utility functions
└── main.jsx        # App entry point and routing
```

## Supported Payment Types

| Type | Sources | Extracted Data |
|------|---------|----------------|
| UPI Receipt | Google Pay, PhonePe*, Paytm* | Amount, Merchant, Date, Transaction ID |
| Food Delivery | Swiggy, Zomato | Amount, Restaurant, Date, Platform |
| Quick Commerce | Swiggy Instamart | Amount, Date, Items |
| Bank SMS | HDFC, ICICI, SBI, Axis, Kotak, Federal | Amount, Merchant, Card type |

*Limited support

## Privacy

xpenseshots is designed with privacy as a core principle:

- **No Server**: There is no backend. The entire app runs in your browser.
- **No Network Requests**: Images are processed locally using Tesseract.js. No data is sent anywhere.
- **Local Storage Only**: All expenses are stored in IndexedDB, which stays on your device.
- **No Tracking**: No analytics, no cookies, no fingerprinting.

Your financial data never leaves your device.

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

### Development

```bash
# Run tests
npm run test

# Run dev server
npm run dev

# Type check
npm run build
```

## Roadmap

- [ ] Export to CSV/Excel
- [ ] Custom categories
- [ ] Tags for expenses
- [ ] Split expenses between people
- [ ] PWA with share target
- [ ] Light theme

See [FEATURES.md](FEATURES.md) for the full list.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Tesseract.js](https://tesseract.projectnaptha.com/) for the amazing browser-based OCR
- [TanStack](https://tanstack.com/) for Router and excellent DX
- [Dexie.js](https://dexie.org/) for the elegant IndexedDB wrapper
- [Lucide](https://lucide.dev/) for beautiful icons
