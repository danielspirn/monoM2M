import { describe, expect, it } from 'vitest';

import type { ReceiptOcrBackendResult } from '@/contracts/schema/integrations/receipt-ocr-adapter.contract';

import { deriveReceiptOcrSummary, normalizeReceiptDate } from './normalize';

describe('deriveReceiptOcrSummary', () => {
  it('prefers explicit merchant/date fields when they are present', () => {
    const result: ReceiptOcrBackendResult = {
      providerId: 'google_gemini_2_5_flash',
      modelName: 'gemini-2.5-flash',
      authMode: 'gemini_api_key',
      rawText: 'SAFEWAY',
      fieldCandidates: [
        { label: 'Merchant', value: 'Safeway', confidence: 0.98 },
        { label: 'Purchase date', value: '05/22/25', confidence: 0.95 },
        { label: 'Grand total', value: '$8.07', confidence: 0.93 },
      ],
      lineItemCandidates: [
        { description: 'Bananas', quantity: 1, unitPrice: 1.29, lineTotal: 1.29, confidence: 0.92 },
      ],
    };

    expect(deriveReceiptOcrSummary(result)).toEqual({
      merchantName: 'Safeway',
      purchaseDate: '2025-05-22',
      grandTotal: '$8.07',
      lineItemCount: 1,
    });
  });

  it('falls back to raw OCR text when merchant field labels are missing', () => {
    const result: ReceiptOcrBackendResult = {
      providerId: 'google_gemini_2_5_flash',
      modelName: 'gemini-2.5-flash',
      authMode: 'gemini_api_key',
      rawText: 'SAFEWAY S Store 985\n05/22/25 12:30 PM\nTOTAL 8.07',
      fieldCandidates: [],
      lineItemCandidates: [
        { description: 'Granola', quantity: 1, unitPrice: 3.49, lineTotal: 3.49, confidence: 0.9 },
        { description: 'Bananas', quantity: 1, unitPrice: 1.29, lineTotal: 1.29, confidence: 0.9 },
      ],
    };

    expect(deriveReceiptOcrSummary(result)).toEqual({
      merchantName: 'Safeway',
      purchaseDate: '2025-05-22',
      grandTotal: null,
      lineItemCount: 2,
    });
  });

  it('extracts invoice-style merchant titles and canonicalizes dash dates', () => {
    const result: ReceiptOcrBackendResult = {
      providerId: 'google_gemini_2_5_flash',
      modelName: 'gemini-2.5-flash',
      authMode: 'gemini_api_key',
      rawText: 'CLEANING INVOICE Bill From Name: Daniel Stone Invoice Date: 3-28-23 Total $120',
      fieldCandidates: [],
      lineItemCandidates: [
        { description: 'Cleaning service', quantity: 1, unitPrice: 120, lineTotal: 120, confidence: 0.9 },
      ],
    };

    expect(deriveReceiptOcrSummary(result)).toEqual({
      merchantName: 'Cleaning Invoice',
      purchaseDate: '2023-03-28',
      grandTotal: null,
      lineItemCount: 1,
    });
  });

  it('normalizes multiple date formats into iso strings', () => {
    expect(normalizeReceiptDate('05/22/25')).toBe('2025-05-22');
    expect(normalizeReceiptDate('3-28-23')).toBe('2023-03-28');
    expect(normalizeReceiptDate('2023-03-28')).toBe('2023-03-28');
  });
});
