#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { deriveReceiptSummary, runGeminiReceiptOcr } from './lib/gemini-receipt-ocr.mjs';

const snapshotCases = [
  {
    id: 'img_7573_safeway',
    filePath: 'receipt_images/IMG_7573.jpeg',
  },
  {
    id: 'img_20230404_cleaning_invoice',
    filePath: 'receipt_images/IMG_20230404_210830_01.jpeg',
  },
  {
    id: 'img_7558_uncurated',
    filePath: 'receipt_images/IMG_7558.jpeg',
  },
];

const snapshots = [];

for (const snapshotCase of snapshotCases) {
  const result = await runGeminiReceiptOcr(snapshotCase.filePath);
  const summary = deriveReceiptSummary(result.parsed);

  snapshots.push({
    id: snapshotCase.id,
    filePath: snapshotCase.filePath,
    provider: result.provider,
    model: result.model,
    merchant: summary.merchant,
    purchaseDate: summary.purchaseDate,
    grandTotal: summary.grandTotal,
    itemCandidates: Array.isArray(result.parsed.lineItems)
      ? result.parsed.lineItems.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal,
          confidence: item.confidence,
        }))
      : [],
    rawTextPreview: summary.rawTextPreview,
  });
}

const outputDirectory = path.resolve(process.cwd(), 'test/fixtures/receipts/ocr');
const outputPath = path.join(outputDirectory, 'geminiSnapshots.json');

await mkdir(outputDirectory, { recursive: true });
await writeFile(outputPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), snapshots }, null, 2)}\n`, 'utf8');

console.log(`Wrote ${snapshots.length} Gemini OCR snapshots to ${outputPath}`);
