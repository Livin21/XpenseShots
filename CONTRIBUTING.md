# Contributing to xpenseshots

Thank you for your interest in contributing to xpenseshots! This document provides guidelines and information for contributors.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## How to Contribute

### Reporting Bugs

If you find a bug, please open an issue with:

1. A clear, descriptive title
2. Steps to reproduce the issue
3. Expected behavior vs actual behavior
4. Screenshots if applicable (blur any personal financial data!)
5. Browser and OS information

### Suggesting Features

Feature suggestions are welcome! Please open an issue with:

1. A clear description of the feature
2. Why it would be useful
3. Any implementation ideas you have

Check [FEATURES.md](FEATURES.md) for planned features - you might find what you're looking for is already planned.

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm run test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to your branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

#### PR Guidelines

- Keep PRs focused on a single feature or fix
- Update documentation if needed
- Add tests for new functionality
- Follow the existing code style

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/XpenseShots.git
cd XpenseShots

# Install dependencies
npm install

# Start development server
npm run dev
```

### Project Structure

```
src/
├── components/     # React UI components
├── hooks/          # Custom React hooks
├── ocr/            # Tesseract.js integration
├── parser/         # Screenshot parsing logic
├── storage/        # IndexedDB/Dexie wrapper
├── lib/            # Utility functions
└── main.jsx        # App entry and routing
```

### Key Areas for Contribution

#### Adding New Payment Parsers

To add support for a new payment type:

1. Create a new parser in `src/parser/` (e.g., `phonepe.js`)
2. Update `src/parser/classifier.js` to detect the new type
3. Update `src/parser/index.js` to route to your parser
4. Add tests for your parser

See existing parsers (`upi.js`, `food.js`) for examples.

#### Improving OCR Accuracy

The OCR pipeline is in `src/ocr/`:
- `normalizeOcr.js` - Post-processing to fix common OCR errors
- `preprocess.js` - Image preprocessing before OCR

Common issues to fix:
- Currency symbol misrecognition (₹ read as R, F, I, 2, 3)
- Decimal point loss
- Amount extraction from different layouts

#### UI/UX Improvements

Components are in `src/components/`. We use:
- Tailwind CSS v4 for styling
- Lucide React for icons
- Radix UI for accessible primitives

## Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test -- --watch
```

### Writing Tests

Tests are co-located with source files or in `__tests__` directories. We use Vitest with React Testing Library.

## Style Guide

- Use functional components with hooks
- Prefer named exports
- Use JSDoc comments for functions
- Keep components small and focused
- Use Tailwind classes, avoid custom CSS

## Questions?

Feel free to open an issue with the "question" label if you have any questions about contributing.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
