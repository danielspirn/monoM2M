#!/usr/bin/env node

import { deriveReceiptSummary, runGeminiReceiptOcr } from './lib/gemini-receipt-ocr.mjs';

const evaluationCases = [
  {
    id: 'single_grocery_happy_path',
    label: 'Safeway grocery receipt',
    filePath: 'receipt_images/IMG_7573.jpeg',
    acceptableMerchants: ['Safeway'],
    expectedPurchaseDate: '2025-05-22',
  },
  {
    id: 'service_invoice_nonstandard',
    label: 'Cleaning invoice',
    filePath: 'receipt_images/IMG_20230404_210830_01.jpeg',
    acceptableMerchants: ['Cleaning Invoice', 'Daniel Stone'],
    expectedPurchaseDate: '2023-03-28',
  },
];

const results = [];

for (const evaluationCase of evaluationCases) {
  const response = await runGeminiReceiptOcr(evaluationCase.filePath);
  const summary = deriveReceiptSummary(response.parsed);

  results.push({
    id: evaluationCase.id,
    label: evaluationCase.label,
    filePath: evaluationCase.filePath,
    acceptableMerchants: evaluationCase.acceptableMerchants,
    actualMerchant: summary.merchant,
    merchantMatch: evaluationCase.acceptableMerchants.some((merchant) => normalize(merchant) === normalize(summary.merchant)),
    expectedPurchaseDate: evaluationCase.expectedPurchaseDate,
    actualPurchaseDate: summary.purchaseDate,
    purchaseDateMatch: normalizeDate(evaluationCase.expectedPurchaseDate) === normalizeDate(summary.purchaseDate),
    lineItemCount: summary.lineItemCount,
    rawTextPreview: summary.rawTextPreview,
  });
}

const merchantPassCount = results.filter((result) => result.merchantMatch).length;
const datePassCount = results.filter((result) => result.purchaseDateMatch).length;

console.log(JSON.stringify({
  provider: 'google_gemini_2_5_flash',
  model: 'gemini-2.5-flash',
  casesEvaluated: results.length,
  merchantAccuracy: Number((merchantPassCount / results.length).toFixed(2)),
  purchaseDateAccuracy: Number((datePassCount / results.length).toFixed(2)),
  results,
}, null, 2));

function normalize(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function normalizeDate(value) {
  return String(value ?? '')
    .replace(/\s+/g, '')
    .toLowerCase();
}
