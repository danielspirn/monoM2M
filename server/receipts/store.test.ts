import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ReceiptOcrBackendRequest, ReceiptOcrBackendResult } from '@/contracts/schema/integrations/receipt-ocr-adapter.contract';
import type { PreparedReceiptOcrExecution } from '@/server/ocr/gateway';

import { buildDocumentChecksum, clearReceiptProcessingStore, listProcessedReceiptRecords, persistProcessedReceiptRecord } from './store';

const request: ReceiptOcrBackendRequest = {
  tenantId: 'tenant_demo',
  householdId: 'household_demo',
  sourceDocumentId: 'srcdoc_demo',
  extractionRunId: 'extract_demo',
  sourceMimeType: 'image/jpeg',
  sourceObjectPath: '/tmp/receipt.jpg',
  captureChannel: 'upload_photo',
  fallbackAllowed: true,
};

const execution: PreparedReceiptOcrExecution = {
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
};

const result: ReceiptOcrBackendResult = {
  providerId: 'google_gemini_2_5_flash',
  modelName: 'gemini-2.5-flash',
  authMode: 'gemini_api_key',
  rawText: 'SAFEWAY\nBANANAS 2.99\nTOTAL 2.99',
  fieldCandidates: [{ label: 'Merchant', value: 'Safeway', confidence: 0.99 }],
  lineItemCandidates: [{ description: 'Bananas', quantity: 1, unitPrice: 2.99, lineTotal: 2.99, confidence: 0.94 }],
  processingMs: 812,
  estimatedCostUsd: 0.002,
  documentMode: 'single_receipt',
};

describe('receipt processing store', () => {
  afterEach(async () => {
    await clearReceiptProcessingStore();
    vi.unstubAllEnvs();
  });

  it('persists processed receipt records for backend retrieval', async () => {
    vi.stubEnv('RECEIPT_PROCESSING_STORE_PATH', path.join(os.tmpdir(), `m2m-receipts-${Date.now()}.json`));
    const buffer = Buffer.from('receipt-image');

    const record = await persistProcessedReceiptRecord({
      request,
      execution,
      result,
      summary: {
        merchantName: 'Safeway',
        purchaseDate: '2026-04-01',
        grandTotal: '2.99',
      },
      fileName: 'IMG_0001.jpeg',
      byteSize: buffer.byteLength,
      checksum: buildDocumentChecksum(buffer),
      parserVersion: 'live_backend_ocr_v2',
    });

    const records = await listProcessedReceiptRecords();

    expect(records).toHaveLength(1);
    expect(records[0]?.id).toBe(record.id);
    expect(records[0]?.sourceDocument.fileName).toBe('IMG_0001.jpeg');
    expect(records[0]?.sourceDocument.byteSize).toBe(buffer.byteLength);
    expect(records[0]?.extractionRun.providerLabel).toBe('Google Gemini 2.5 Flash');
    expect(records[0]?.ocr.summary.merchantName).toBe('Safeway');
    expect(records[0]?.ocr.lineItemCandidates[0]?.description).toBe('Bananas');
  });
});
