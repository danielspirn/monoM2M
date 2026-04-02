import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { handleReceiptProcessingHttpRequest } from './http';
import { clearReceiptProcessingStore, listProcessedReceiptRecords } from './store';

const {
  prepareReceiptOcrExecutionMock,
  executeGeminiReceiptOcrFromFileMock,
  executeOpenAiReceiptOcrFromFileMock,
} = vi.hoisted(() => ({
  prepareReceiptOcrExecutionMock: vi.fn(),
  executeGeminiReceiptOcrFromFileMock: vi.fn(),
  executeOpenAiReceiptOcrFromFileMock: vi.fn(),
}));

vi.mock('@/server/ocr/gateway', () => ({
  prepareReceiptOcrExecution: prepareReceiptOcrExecutionMock,
}));

vi.mock('@/server/ocr/gemini', () => ({
  executeGeminiReceiptOcrFromFile: executeGeminiReceiptOcrFromFileMock,
}));

vi.mock('@/server/ocr/openai', () => ({
  executeOpenAiReceiptOcrFromFile: executeOpenAiReceiptOcrFromFileMock,
}));

describe('receipt processing http handler', () => {
  beforeEach(() => {
    prepareReceiptOcrExecutionMock.mockReset();
    executeGeminiReceiptOcrFromFileMock.mockReset();
    executeOpenAiReceiptOcrFromFileMock.mockReset();
    vi.stubEnv('RECEIPT_PROCESSING_STORE_PATH', path.join(os.tmpdir(), `m2m-receipt-http-${Date.now()}.json`));
  });

  afterEach(async () => {
    await clearReceiptProcessingStore();
    vi.unstubAllEnvs();
  });

  it('processes a new receipt upload and persists the backend record', async () => {
    prepareReceiptOcrExecutionMock.mockReturnValue({
      providerId: 'google_gemini_2_5_flash',
      modelName: 'gemini-2.5-flash',
      authMode: 'gemini_api_key',
      documentStorageMode: 'proxy_through_backend',
      liveCallReady: true,
      promptVersion: 'receipt-ocr-server-prompt-v1',
      prompt: 'Extract the receipt',
      fileHandlingStrategy: 'backend_fetches_private_source',
      reason: 'Configured',
      missingSecrets: [],
    });
    executeGeminiReceiptOcrFromFileMock.mockResolvedValue({
      providerId: 'google_gemini_2_5_flash',
      modelName: 'gemini-2.5-flash',
      authMode: 'gemini_api_key',
      rawText: 'SAFEWAY\nBANANAS 2.99\nTOTAL 2.99',
      fieldCandidates: [
        { label: 'Merchant', value: 'Safeway', confidence: 0.98 },
        { label: 'Purchase date', value: '2026-04-01', confidence: 0.93 },
        { label: 'Grand total', value: '2.99', confidence: 0.95 },
      ],
      lineItemCandidates: [
        { description: 'Bananas', quantity: 1, unitPrice: 2.99, lineTotal: 2.99, confidence: 0.91 },
      ],
      documentMode: 'single_receipt',
      vendorRequestId: 'vendor_123',
      processingMs: 640,
    });

    const req = Object.assign(
      Readable.from([
        JSON.stringify({
          fileName: 'IMG_9000.jpeg',
          mimeType: 'image/jpeg',
          base64Data: Buffer.from('receipt-bytes').toString('base64'),
          captureChannel: 'upload_photo',
          fallbackAllowed: true,
        }),
      ]),
      { method: 'POST' },
    );
    const response = createMockResponse();

    await handleReceiptProcessingHttpRequest(req as never, response as never);

    const body = JSON.parse(response.body);
    const records = await listProcessedReceiptRecords();

    expect(response.statusCode).toBe(200);
    expect(body.record.sourceDocument.fileName).toBe('IMG_9000.jpeg');
    expect(body.ocrPayload.merchantName).toBe('Safeway');
    expect(records).toHaveLength(1);
    expect(records[0]?.ocr.summary.grandTotal).toBe('2.99');
    expect(executeGeminiReceiptOcrFromFileMock).toHaveBeenCalledOnce();
  });

  it('retrieves a stored processing record by id', async () => {
    prepareReceiptOcrExecutionMock.mockReturnValue({
      providerId: 'google_gemini_2_5_flash',
      modelName: 'gemini-2.5-flash',
      authMode: 'gemini_api_key',
      documentStorageMode: 'proxy_through_backend',
      liveCallReady: true,
      promptVersion: 'receipt-ocr-server-prompt-v1',
      prompt: 'Extract the receipt',
      fileHandlingStrategy: 'backend_fetches_private_source',
      reason: 'Configured',
      missingSecrets: [],
    });
    executeGeminiReceiptOcrFromFileMock.mockResolvedValue({
      providerId: 'google_gemini_2_5_flash',
      modelName: 'gemini-2.5-flash',
      authMode: 'gemini_api_key',
      rawText: 'SAFEWAY\nBANANAS 2.99\nTOTAL 2.99',
      fieldCandidates: [{ label: 'Merchant', value: 'Safeway', confidence: 0.98 }],
      lineItemCandidates: [{ description: 'Bananas', quantity: 1, unitPrice: 2.99, lineTotal: 2.99, confidence: 0.91 }],
      documentMode: 'single_receipt',
    });

    const createReq = Object.assign(
      Readable.from([
        JSON.stringify({
          fileName: 'IMG_9001.jpeg',
          mimeType: 'image/jpeg',
          base64Data: Buffer.from('receipt-bytes').toString('base64'),
          captureChannel: 'upload_photo',
          fallbackAllowed: true,
        }),
      ]),
      { method: 'POST', url: '/api/receipt-processing' },
    );
    const createRes = createMockResponse();

    await handleReceiptProcessingHttpRequest(createReq as never, createRes as never);

    const created = JSON.parse(createRes.body);
    const getReq = Object.assign(Readable.from([]), {
      method: 'GET',
      url: `/api/receipt-processing/${created.record.id}`,
    });
    const getRes = createMockResponse();

    await handleReceiptProcessingHttpRequest(getReq as never, getRes as never);

    const body = JSON.parse(getRes.body);
    expect(getRes.statusCode).toBe(200);
    expect(body.record.id).toBe(created.record.id);
    expect(body.record.sourceDocument.fileName).toBe('IMG_9001.jpeg');
  });
});

function createMockResponse() {
  return {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: '',
    setHeader(name: string, value: string) {
      this.headers[name] = value;
    },
    end(chunk?: string) {
      this.body = chunk ?? '';
    },
  };
}
