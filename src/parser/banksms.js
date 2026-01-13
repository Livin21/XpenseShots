/**
 * Bank SMS Parser
 * Parses credit/debit card transaction SMS from various banks
 */

/**
 * Clean merchant name
 * @param {string} merchant
 * @returns {string}
 */
function cleanMerchant(merchant) {
  if (!merchant) return 'Unknown';

  // Remove transaction IDs (long numbers)
  let cleaned = merchant.replace(/\d{8,}/g, '').trim();

  // Remove UPI IDs
  cleaned = cleaned.replace(/@[a-z]+\b/gi, '').trim();

  // Remove common prefixes
  cleaned = cleaned.replace(/^(at|on|to)\s+/i, '').trim();

  // Clean up extra spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // Capitalize first letter of each word
  cleaned = cleaned.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  // Handle known merchants
  const merchantMap = {
    'amazon pay': 'Amazon',
    'amazon pay in': 'Amazon',
    'amazon pay in g': 'Amazon',
    'swiggy': 'Swiggy',
    'zomato': 'Zomato',
    'paytm': 'Paytm',
    'phonepe': 'PhonePe',
    'gpay': 'Google Pay',
    'google pay': 'Google Pay',
    'flipkart': 'Flipkart',
    'myntra': 'Myntra',
    'uber': 'Uber',
    'ola': 'Ola',
    'bigbasket': 'BigBasket',
    'blinkit': 'Blinkit',
    'zepto': 'Zepto',
  };

  const lowerCleaned = cleaned.toLowerCase();
  for (const [key, value] of Object.entries(merchantMap)) {
    if (lowerCleaned.includes(key)) {
      return value;
    }
  }

  return cleaned || 'Unknown';
}

/**
 * Parse date from various formats
 * @param {string} dateStr
 * @returns {string} ISO date string
 */
function parseDate(dateStr) {
  if (!dateStr) return new Date().toISOString();

  // Format: 11-Jan-26 or 11-Jan-2026
  const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const monthMatch = dateStr.match(/(\d{1,2})[-/]([a-z]{3})[-/](\d{2,4})/i);
  if (monthMatch) {
    const day = parseInt(monthMatch[1]);
    const month = monthNames.indexOf(monthMatch[2].toLowerCase());
    let year = parseInt(monthMatch[3]);
    if (year < 100) year += 2000;
    if (month !== -1) {
      return new Date(year, month, day).toISOString();
    }
  }

  // Format: 13-01-2026 or 13/01/2026
  const numericMatch = dateStr.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/);
  if (numericMatch) {
    const day = parseInt(numericMatch[1]);
    const month = parseInt(numericMatch[2]) - 1;
    let year = parseInt(numericMatch[3]);
    if (year < 100) year += 2000;
    return new Date(year, month, day).toISOString();
  }

  // Format: 07-09 (day-month, assume current year)
  const shortMatch = dateStr.match(/(\d{1,2})[-/](\d{1,2})$/);
  if (shortMatch) {
    const day = parseInt(shortMatch[1]);
    const month = parseInt(shortMatch[2]) - 1;
    const year = new Date().getFullYear();
    return new Date(year, month, day).toISOString();
  }

  return new Date().toISOString();
}

/**
 * Extract amount from text
 * @param {string} text
 * @returns {number|null}
 */
function extractAmount(text) {
  // Match INR/Rs./Rs followed by amount
  const patterns = [
    /(?:INR|Rs\.?)\s*([\d,]+\.?\d*)/i,
    /(?:Txn|Transaction)\s*(?:of\s*)?(?:INR|Rs\.?)\s*([\d,]+\.?\d*)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const amount = parseFloat(match[1].replace(/,/g, ''));
      // Ignore very large amounts (likely available balance)
      if (amount > 0 && amount < 1000000) {
        return amount;
      }
    }
  }

  return null;
}

/**
 * Detect bank from SMS text
 * @param {string} text
 * @returns {string}
 */
function detectBank(text) {
  const lower = text.toLowerCase();

  if (lower.includes('icici')) return 'ICICI Bank';
  if (lower.includes('hdfc')) return 'HDFC Bank';
  if (lower.includes('federal bank')) return 'Federal Bank';
  if (lower.includes('sbi') || lower.includes('state bank')) return 'SBI';
  if (lower.includes('axis')) return 'Axis Bank';
  if (lower.includes('kotak')) return 'Kotak Bank';
  if (lower.includes('idfc')) return 'IDFC Bank';
  if (lower.includes('yes bank')) return 'Yes Bank';
  if (lower.includes('indusind')) return 'IndusInd Bank';
  if (lower.includes('bob') || lower.includes('bank of baroda')) return 'Bank of Baroda';
  if (lower.includes('pnb') || lower.includes('punjab national')) return 'PNB';
  if (lower.includes('canara')) return 'Canara Bank';
  if (lower.includes('union bank')) return 'Union Bank';
  if (lower.includes('rbl')) return 'RBL Bank';

  return 'Bank SMS';
}

/**
 * Infer category from merchant
 * @param {string} merchant
 * @returns {string}
 */
function inferCategory(merchant) {
  const lower = merchant.toLowerCase();

  // Food & Dining
  if (['swiggy', 'zomato', 'dominos', 'pizza', 'mcdonald', 'kfc', 'starbucks', 'cafe'].some(k => lower.includes(k))) {
    return 'Food & Dining';
  }

  // Groceries
  if (['bigbasket', 'blinkit', 'zepto', 'instamart', 'grofers', 'jiomart', 'dmart'].some(k => lower.includes(k))) {
    return 'Groceries';
  }

  // Shopping
  if (['amazon', 'flipkart', 'myntra', 'ajio', 'nykaa', 'meesho'].some(k => lower.includes(k))) {
    return 'Shopping';
  }

  // Transport
  if (['uber', 'ola', 'rapido', 'metro', 'irctc', 'redbus'].some(k => lower.includes(k))) {
    return 'Transport';
  }

  // Utilities
  if (['electricity', 'water', 'gas', 'bill', 'recharge', 'airtel', 'jio', 'vi ', 'bsnl'].some(k => lower.includes(k))) {
    return 'Utilities';
  }

  // Entertainment
  if (['netflix', 'prime', 'hotstar', 'spotify', 'youtube', 'bookmyshow', 'pvr', 'inox'].some(k => lower.includes(k))) {
    return 'Entertainment';
  }

  // Health
  if (['pharma', 'medical', 'hospital', 'clinic', 'apollo', '1mg', 'netmeds', 'practo'].some(k => lower.includes(k))) {
    return 'Health';
  }

  return 'Miscellaneous';
}

/**
 * Parse ICICI Bank SMS
 * Format: INR X spent using ICICI Bank Card XXXX on DD-Mon-YY on MERCHANT
 */
function parseICICI(text) {
  const amount = extractAmount(text);
  if (!amount) return null;

  // Extract date: on DD-Mon-YY
  const dateMatch = text.match(/on\s+(\d{1,2}[-/][a-z]{3}[-/]\d{2,4})/i);
  const date = dateMatch ? parseDate(dateMatch[1]) : new Date().toISOString();

  // Extract merchant: on MERCHANT. Avl Limit
  const merchantMatch = text.match(/on\s+\d{1,2}[-/][a-z]{3}[-/]\d{2,4}\s+on\s+([^.]+?)\.?\s*(?:Avl|Available)/i);
  const merchant = cleanMerchant(merchantMatch ? merchantMatch[1] : null);

  return { amount, merchant, date, bank: 'ICICI Bank' };
}

/**
 * Parse Federal Bank SMS
 * Format: INR X spent on your credit card ending with XXXX at MERCHANT on DD-MM-YYYY
 */
function parseFederalBank(text) {
  const amount = extractAmount(text);
  if (!amount) return null;

  // Extract date: on DD-MM-YYYY
  const dateMatch = text.match(/on\s+(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i);
  const date = dateMatch ? parseDate(dateMatch[1]) : new Date().toISOString();

  // Extract merchant: at MERCHANT on
  const merchantMatch = text.match(/at\s+(.+?)\s+on\s+\d{1,2}[-/]/i);
  const merchant = cleanMerchant(merchantMatch ? merchantMatch[1] : null);

  return { amount, merchant, date, bank: 'Federal Bank' };
}

/**
 * Parse HDFC Bank SMS
 * Format: Txn Rs.X On HDFC Bank Card XXXX At MERCHANT
 */
function parseHDFC(text) {
  const amount = extractAmount(text);
  if (!amount) return null;

  // Extract date: On DD-MM or On DD/MM
  const dateMatch = text.match(/On\s+(\d{1,2}[-/]\d{1,2}(?:[-/]\d{2,4})?)/i);
  const date = dateMatch ? parseDate(dateMatch[1]) : new Date().toISOString();

  // Extract merchant: At MERCHANT by/On/Not
  const merchantMatch = text.match(/At\s+(.+?)\s+(?:by|On\s+\d|Not)/i);
  const merchant = cleanMerchant(merchantMatch ? merchantMatch[1] : null);

  return { amount, merchant, date, bank: 'HDFC Bank' };
}

/**
 * Generic bank SMS parser
 * Tries to extract amount, merchant, and date from any bank SMS
 */
function parseGeneric(text) {
  const amount = extractAmount(text);
  if (!amount) return null;

  // Try to find date
  const datePatterns = [
    /on\s+(\d{1,2}[-/][a-z]{3}[-/]\d{2,4})/i,
    /on\s+(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
    /dated?\s+(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
    /(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/,
  ];

  let date = new Date().toISOString();
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      date = parseDate(match[1]);
      break;
    }
  }

  // Try to find merchant
  const merchantPatterns = [
    /(?:at|to|on)\s+([A-Za-z][A-Za-z0-9\s@._-]+?)(?:\s+on\s+\d|\.|\s+Avl|\s+Available|\s+Not|\s+by|\s+Info)/i,
    /(?:at|to)\s+([A-Za-z][A-Za-z0-9\s@._-]{2,30})/i,
  ];

  let merchant = 'Unknown';
  for (const pattern of merchantPatterns) {
    const match = text.match(pattern);
    if (match) {
      merchant = cleanMerchant(match[1]);
      break;
    }
  }

  return { amount, merchant, date, bank: detectBank(text) };
}

/**
 * Main bank SMS parser
 * @param {string} text - Normalized OCR/SMS text
 * @returns {import('./types.js').ParsedExpense | null}
 */
export function parseBankSms(text) {
  const lower = text.toLowerCase();

  let result = null;

  // Try bank-specific parsers first
  if (lower.includes('icici')) {
    result = parseICICI(text);
  } else if (lower.includes('federal bank')) {
    result = parseFederalBank(text);
  } else if (lower.includes('hdfc')) {
    result = parseHDFC(text);
  }

  // Fall back to generic parser
  if (!result) {
    result = parseGeneric(text);
  }

  if (!result || !result.amount) {
    return null;
  }

  const category = inferCategory(result.merchant);

  return {
    amount: result.amount,
    currency: 'INR',
    merchant: result.merchant,
    category,
    date: result.date,
    source: result.bank || 'Bank SMS',
    confidence: 0.85,
    rawText: text,
  };
}
