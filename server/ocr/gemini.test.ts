import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ReceiptOcrBackendRequest } from '@/contracts/schema/integrations/receipt-ocr-adapter.contract';

import { buildGeminiReceiptOcrRequestBody, executeGeminiReceiptOcrFromFile } from './gemini';

const baseRequest: ReceiptOcrBackendRequest = {
  tenantId: 'tenant_demo',
  sourceDocumentId: 'srcdoc_live',
  extractionRunId: 'extract_live',
  sourceMimeType: 'image/jpeg',
  sourceObjectPath: 'private/receipts/srcdoc_live.jpg',
  captureChannel: 'upload_photo',
  fallbackAllowed: false,
};

describe('gemini receipt OCR adapter', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('builds a structured-output request body', () => {
    const body = buildGeminiReceiptOcrRequestBody({
      prompt: 'Extract the receipt',
      mimeType: 'image/jpeg',
      base64Data: 'aGVsbG8=',
    });

    expect(body.generationConfig.responseMimeType).toBe('application/json');
    expect(body.contents[0]?.parts[1]).toMatchObject({
      inline_data: {
        mime_type: 'image/jpeg',
      },
    });
  });

  it('normalizes a live Gemini JSON response', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      json: async () => ({
        responseId: 'resp_123',
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    rawText: 'SAFEWAY',
                    fieldCandidates: [
                      { label: 'Merchant', value: 'Safeway', confidence: 0.98 },
                    ],
                    lineItems: [
                      {
                        description: 'Bananas',
                        quantity: 1,
                        unitPrice: 1.29,
                        lineTotal: 1.29,
                        confidence: 0.92,
                      },
                    ],
                  }),
                },
              ],
            },
          },
        ],
      }),
    } as Response);

    const result = await executeGeminiReceiptOcrFromFile({
      request: baseRequest,
      filePath: '/Users/danielspirn/Documents/dev/monoM2M/monoM2M/receipt_images/IMG_7573.jpeg',
      apiKey: 'gemini-secret',
      fetchImpl: fetchMock,
    });

    expect(result.providerId).toBe('google_gemini_2_5_flash');
    expect(result.vendorRequestId).toBe('resp_123');
    expect(result.fieldCandidates[0]?.value).toBe('Safeway');
    expect(result.lineItemCandidates[0]?.description).toBe('Bananas');
    expect(result.documentMode).toBe('single_receipt');
  });

  it('preserves multi-receipt candidates for grouped uploads', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      json: async () => ({
        responseId: 'resp_multi',
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    rawText: 'Primary receipt text',
                    fieldCandidates: [
                      { label: 'Merchant', value: 'Primary Market', confidence: 0.97 },
                    ],
                    lineItems: [
                      {
                        description: 'Milk',
                        quantity: 1,
                        unitPrice: 4.99,
                        lineTotal: 4.99,
                        confidence: 0.91,
                      },
                    ],
                    receiptCandidates: [
                      {
                        candidateId: 'candidate_1',
                        rawText: 'Primary receipt text',
                        fieldCandidates: [{ label: 'Merchant', value: 'Primary Market', confidence: 0.97 }],
                        lineItems: [{ description: 'Milk', quantity: 1, unitPrice: 4.99, lineTotal: 4.99, confidence: 0.91 }],
                      },
                      {
                        candidateId: 'candidate_2',
                        rawText: 'Second receipt text',
                        fieldCandidates: [{ label: 'Merchant', value: 'Coffee Bar', confidence: 0.9 }],
                        lineItems: [{ description: 'Latte', quantity: 1, unitPrice: 5.5, lineTotal: 5.5, confidence: 0.88 }],
                      },
                    ],
                  }),
                },
              ],
            },
          },
        ],
      }),
    } as Response);

    const result = await executeGeminiReceiptOcrFromFile({
      request: {
        ...baseRequest,
        captureChannel: 'multi_receipt_photo',
      },
      filePath: '/Users/danielspirn/Documents/dev/monoM2M/monoM2M/receipt_images/IMG_7573.jpeg',
      apiKey: 'gemini-secret',
      fetchImpl: fetchMock,
    });

    expect(result.documentMode).toBe('multi_receipt');
    expect(result.receiptCandidates).toHaveLength(2);
    expect(result.receiptCandidates?.[1]?.fieldCandidates[0]?.value).toBe('Coffee Bar');
    expect(result.fieldCandidates[0]?.value).toBe('Primary Market');
  });
});
