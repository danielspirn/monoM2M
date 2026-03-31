#!/usr/bin/env node

import { deriveReceiptSummary, runGeminiReceiptOcr } from './lib/gemini-receipt-ocr.mjs';

const [filePathArg] = process.argv.slice(2);

if (!filePathArg) {
  console.error('Usage: npm run ocr:smoke:gemini -- <receipt-image-path>');
  process.exit(1);
}

const result = await runGeminiReceiptOcr(filePathArg);
const summary = deriveReceiptSummary(result.parsed);

console.log(JSON.stringify({
  provider: result.provider,
  model: result.model,
  filePath: result.filePath,
  merchant: summary.merchant,
  purchaseDate: summary.purchaseDate,
  grandTotal: summary.grandTotal,
  receiptCandidateCount: summary.receiptCandidateCount,
  lineItemCount: summary.lineItemCount,
  rawTextPreview: summary.rawTextPreview,
}, null, 2));
