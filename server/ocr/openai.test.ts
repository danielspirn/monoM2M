import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ReceiptOcrBackendRequest } from '@/contracts/schema/integrations/receipt-ocr-adapter.contract';

import { buildOpenAiReceiptOcrRequestBody, executeOpenAiReceiptOcrFromFile } from './openai';

const baseRequest: ReceiptOcrBackendRequest = {
  tenantId: 'tenant_demo',
  sourceDocumentId: 'srcdoc_live',
  extractionRunId: 'extract_live',
  sourceMimeType: 'image/jpeg',
  sourceObjectPath: 'private/receipts/srcdoc_live.jpg',
  captureChannel: 'upload_photo',
  fallbackAllowed: true,
};

describe('openai receipt OCR adapter', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('builds a structured-output request body for image inputs', () => {
    const body = buildOpenAiReceiptOcrRequestBody({
      prompt: 'Extract the receipt',
      mimeType: 'image/jpeg',
      base64Data: 'aGVsbG8=',
      fileName: 'receipt.jpg',
    });

    expect(body.model).toBe('gpt-4o-mini');
    expect(body.input[0]?.content[1]).toMatchObject({
      type: 'input_image',
    });
    expect(body.text.format.type).toBe('json_schema');
  });

  it('builds a file input body for pdf documents', () => {
    const body = buildOpenAiReceiptOcrRequestBody({
      prompt: 'Extract the receipt',
      mimeType: 'application/pdf',
      base64Data: 'aGVsbG8=',
      fileName: 'receipt.pdf',
    });

    expect(body.input[0]?.content[1]).toMatchObject({
      type: 'input_file',
      filename: 'receipt.pdf',
    });
  });

  it('normalizes a live OpenAI JSON response', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'resp_openai_123',
        output_text: JSON.stringify({
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
      }),
    } as Response);

    const result = await executeOpenAiReceiptOcrFromFile({
      request: baseRequest,
      filePath: '/Users/danielspirn/Documents/dev/monoM2M/monoM2M/receipt_images/IMG_7573.jpeg',
      apiKey: 'openai-secret',
      fetchImpl: fetchMock,
    });

    expect(result.providerId).toBe('openai_gpt_4o_mini');
    expect(result.vendorRequestId).toBe('resp_openai_123');
    expect(result.fieldCandidates[0]?.value).toBe('Safeway');
    expect(result.lineItemCandidates[0]?.description).toBe('Bananas');
  });
});
