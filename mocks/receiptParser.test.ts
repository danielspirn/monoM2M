import { describe, expect, it } from 'vitest';

import { parseReceiptCaptureInput } from './receiptParser';

describe('receiptParser', () => {
  it('splits multiple recognized uploaded files into independent drafts', () => {
    const result = parseReceiptCaptureInput({
      merchant: 'Mixed upload',
      purchaseDate: '2026-03-30T09:00:00-07:00',
      source: 'Multi-receipt photo',
      summary: 'Mixed uploaded receipt batch',
      fixtureFiles: [
        'receipt_images/IMG_7573.jpeg',
        'receipt_images/IMG_0030.jpeg',
        'receipt_images/IMG_20230404_210830_01.jpeg',
      ],
    });

    expect(result.parserVersion).toBe('receipt-file-name-parser-v1');
    expect(result.ocrRoute.provider.id).toBe('internal_fixture_catalog');
    expect(result.drafts).toHaveLength(3);
    expect(result.drafts.map((draft) => draft.merchant)).toEqual(['Safeway', 'Restaurant Payment', 'House Cleaning']);
  });

  it('routes unknown uploaded files to the Gemini OCR candidate path', () => {
    const result = parseReceiptCaptureInput({
      merchant: 'Unknown upload',
      purchaseDate: '2026-03-30T09:00:00-07:00',
      source: 'Upload photo',
      summary: 'Unknown uploaded receipt',
      fixtureFiles: ['receipt_images/unseen-receipt.jpg'],
    });

    expect(result.parserMode).toBe('vendor_candidate');
    expect(result.ocrRoute.provider.id).toBe('google_gemini_2_5_flash');
    expect(result.ocrRoute.fallbackProvider?.id).toBe('openai_gpt_4o_mini');
    expect(result.drafts).toHaveLength(0);
  });

  it('uses stored Gemini OCR snapshots to seed item candidates for uncurated uploaded files', () => {
    const result = parseReceiptCaptureInput({
      merchant: '',
      purchaseDate: '2026-03-30T09:00:00-07:00',
      source: 'Upload photo',
      summary: '',
      fixtureFiles: ['receipt_images/IMG_7558.jpeg'],
    });

    expect(result.parserMode).toBe('live_ocr_snapshot');
    expect(result.parserVersion).toBe('receipt-gemini-snapshot-v1');
    expect(result.drafts).toHaveLength(1);
    expect(result.drafts[0]?.merchant).toBe('Hotel Royal Orchid Re:gen:ta');
    expect(result.drafts[0]?.itemCandidates?.map((item) => item.description)).toEqual([
      'Pineapple and coconut',
      'Wild mushroom and leek',
    ]);
  });
});
