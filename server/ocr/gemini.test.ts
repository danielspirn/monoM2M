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
  });
});
