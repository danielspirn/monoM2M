import type { ReceiptOcrBackendResult } from '@/contracts/schema/integrations/receipt-ocr-adapter.contract';

export type DerivedReceiptOcrSummary = {
  merchantName: string | null;
  purchaseDate: string | null;
  grandTotal: string | null;
  lineItemCount: number;
};

export function deriveReceiptOcrSummary(result: ReceiptOcrBackendResult): DerivedReceiptOcrSummary {
  const merchantName = sanitizeMerchantName(
    findFieldValue(result, ['merchant', 'store', 'vendor', 'retailer', 'bill from', 'business'])
      ?? inferMerchantFromRawText(result.rawText),
  );
  const purchaseDate = normalizeReceiptDate(
    findFieldValue(result, ['purchase date', 'date', 'transaction date', 'invoice date'])
      ?? inferDateFromRawText(result.rawText),
  );
  const grandTotal = findFieldValue(result, ['grand total', 'total', 'amount due']);

  return {
    merchantName,
    purchaseDate,
    grandTotal,
    lineItemCount: result.lineItemCandidates.length,
  };
}

function findFieldValue(result: ReceiptOcrBackendResult, labels: string[]) {
  const normalizedLabels = labels.map((label) => label.toLowerCase());
  const candidate = result.fieldCandidates.find((field) =>
    normalizedLabels.some((label) => field.label.toLowerCase().includes(label)),
  );

  return candidate?.value ?? null;
}

function inferMerchantFromRawText(rawText: string) {
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
  const candidate = lineWithoutStoreSuffix || firstLine;
  const merchantName = candidate
    .replace(/^[^A-Za-z]+/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (!merchantName) {
    return null;
  }

  return sanitizeMerchantName(merchantName);
}

function inferDateFromRawText(rawText: string) {
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

export function normalizeReceiptDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
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

function sanitizeMerchantName(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value
    .replace(/\s+/g, ' ')
    .replace(/\b(phone|invoice no|invoice date|due date)\b.*$/i, '')
    .trim();

  if (!trimmed) {
    return null;
  }

  return toTitleCase(trimmed);
}

function toTitleCase(value: string) {
  return value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
