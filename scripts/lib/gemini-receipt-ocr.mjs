import { readFile } from 'node:fs/promises';
import path from 'node:path';

const GEMINI_GENERATE_CONTENT_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export async function runGeminiReceiptOcr(filePathArg) {
  const filePath = path.resolve(process.cwd(), filePathArg);
  const fileBuffer = await readFile(filePath);
  const mimeType = inferMimeType(filePath);
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY or GOOGLE_API_KEY must be set in the environment.');
  }

  const response = await fetch(
    GEMINI_GENERATE_CONTENT_URL,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: [
                  'Extract receipt OCR facts for Money to Memories.',
                  'Return only JSON matching the provided schema.',
                  'Include rawText, fieldCandidates, and lineItems.',
                  'For service invoices, return billed services or task descriptions as lineItems even if the document is not a retail receipt.',
                  'Use conservative confidence values and do not invent missing data.',
                ].join(' '),
              },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: fileBuffer.toString('base64'),
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
          responseJsonSchema: {
            type: 'object',
            properties: {
              rawText: { type: 'string' },
              fieldCandidates: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    label: { type: 'string' },
                    value: { type: 'string' },
                    confidence: { type: 'number' },
                  },
                  required: ['label', 'value', 'confidence'],
                },
              },
              lineItems: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    description: { type: 'string' },
                    quantity: { type: 'number' },
                    unitPrice: { type: 'number' },
                    lineTotal: { type: 'number' },
                    confidence: { type: 'number' },
                  },
                  required: ['description', 'quantity', 'unitPrice', 'lineTotal', 'confidence'],
                },
              },
            },
            required: ['rawText', 'fieldCandidates', 'lineItems'],
          },
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const payload = await response.json();
  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('').trim();

  if (!text) {
    throw new Error('No text returned from Gemini.');
  }

  return {
    provider: 'google_gemini_2_5_flash',
    model: 'gemini-2.5-flash',
    filePath,
    parsed: JSON.parse(text),
  };
}

export function deriveReceiptSummary(parsed) {
  const primaryCandidate = Array.isArray(parsed.receiptCandidates) && parsed.receiptCandidates.length
    ? parsed.receiptCandidates[0]
    : parsed;
  const merchant = sanitizeMerchantName(
    findFieldValue(primaryCandidate, ['merchant', 'store', 'vendor', 'retailer', 'bill from', 'business'])
      ?? inferMerchantFromRawText(primaryCandidate.rawText),
  );
  const purchaseDate = normalizeReceiptDate(
    findFieldValue(primaryCandidate, ['purchase date', 'date', 'transaction date', 'invoice date']) ?? inferDateFromRawText(primaryCandidate.rawText),
  );
  const grandTotal = findFieldValue(primaryCandidate, ['grand total', 'total', 'amount due']);

  return {
    merchant,
    purchaseDate,
    grandTotal,
    receiptCandidateCount: Array.isArray(parsed.receiptCandidates) ? parsed.receiptCandidates.length : 1,
    lineItemCount: Array.isArray(primaryCandidate.lineItems) ? primaryCandidate.lineItems.length : 0,
    rawTextPreview: typeof primaryCandidate.rawText === 'string' ? primaryCandidate.rawText.slice(0, 240) : null,
  };
}

function findFieldValue(parsed, labels) {
  const candidates = Array.isArray(parsed.fieldCandidates) ? parsed.fieldCandidates : [];
  const normalizedLabels = labels.map((label) => label.toLowerCase());
  const match = candidates.find((field) =>
    normalizedLabels.some((label) => String(field.label ?? '').toLowerCase().includes(label)),
  );

  return match?.value ?? null;
}

function inferMerchantFromRawText(rawText) {
  if (typeof rawText !== 'string') {
    return null;
  }

  const invoiceHeaderMatch = rawText.match(/^\s*([A-Za-z][A-Za-z\s&-]{2,40}invoice)\b/i);

  if (invoiceHeaderMatch?.[1]) {
    return sanitizeMerchantName(invoiceHeaderMatch[1]);
  }

  const billFromMatch = rawText.match(/\bbill\s*from\b.*?\bname[:\s]+([A-Za-z][A-Za-z\s.'-]{2,40})/i);

  if (billFromMatch?.[1]) {
    return sanitizeMerchantName(billFromMatch[1]);
  }

  const firstLine = rawText
    .split('\n')
    .map((line) => line.trim())
    .find(Boolean);

  if (!firstLine) {
    return null;
  }

  const lineWithoutStoreSuffix = firstLine.replace(/\bS?\s*Store\b.*$/i, '').trim();
  const merchant = (lineWithoutStoreSuffix || firstLine)
    .replace(/^[^A-Za-z]+/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (!merchant) {
    return null;
  }

  return sanitizeMerchantName(merchant);
}

function inferDateFromRawText(rawText) {
  if (typeof rawText !== 'string') {
    return null;
  }

  const slashDateMatch = rawText.match(/\b(\d{1,2}\/\d{1,2}\/\d{2,4})\b/);

  if (slashDateMatch?.[1]) {
    return slashDateMatch[1];
  }

  const dashDateMatch = rawText.match(/\b(\d{1,2}-\d{1,2}-\d{2,4})\b/);

  if (dashDateMatch?.[1]) {
    return dashDateMatch[1];
  }

  const isoDateMatch = rawText.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  return isoDateMatch?.[1] ?? null;
}

function normalizeReceiptDate(value) {
  if (!value) {
    return null;
  }

  const trimmed = String(value).trim();
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  const delimiterMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);

  if (!delimiterMatch) {
    return trimmed;
  }

  const month = delimiterMatch[1].padStart(2, '0');
  const day = delimiterMatch[2].padStart(2, '0');
  const rawYear = delimiterMatch[3];
  const year = rawYear.length === 2 ? `20${rawYear}` : rawYear;

  return `${year}-${month}-${day}`;
}

function sanitizeMerchantName(value) {
  if (!value) {
    return null;
  }

  const trimmed = String(value)
    .replace(/\s+/g, ' ')
    .replace(/\b(phone|invoice no|invoice date|due date)\b.*$/i, '')
    .trim();

  if (!trimmed) {
    return null;
  }

  return trimmed
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function inferMimeType(filePath) {
  const extension = path.extname(filePath).toLowerCase();

  switch (extension) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    case '.pdf':
      return 'application/pdf';
    default:
      return 'application/octet-stream';
  }
}
