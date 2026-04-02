import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import type { LiveReceiptGraphRecord } from '../../contracts/schema/integrations/live-receipt-graph.contract';

import {
  clearLiveReceiptGraphStore,
  getLiveReceiptGraphRecordById,
  listLiveReceiptGraphRecords,
  upsertLiveReceiptGraphRecord,
} from './store';

const baseRecord: LiveReceiptGraphRecord = {
  id: 'receipt_live_1',
  syncedAt: '2026-04-02T00:00:00.000Z',
  receipt: {
    id: 'receipt_live_1',
    status: 'needs_review',
    sourceType: 'receipt_image',
    capturedAt: '2026-04-02T00:00:00.000Z',
  },
  header: {
    merchantName: 'Safeway',
    purchasedAt: '2026-04-02',
    grandTotal: 12.49,
    currency: 'USD',
  },
  sourceDocument: {
    id: 'srcdoc_live_1',
    fileName: 'IMG_1111.jpeg',
    mimeType: 'image/jpeg',
    captureChannel: 'upload_photo',
    sourceFileCount: 1,
    checksum: 'abc123',
    detectedReceiptCount: 1,
  },
  extractionRun: {
    id: 'extract_live_1',
    status: 'completed',
    stage: 'ready_for_review',
    stageLabel: 'Ready',
    providerLabel: 'Google Gemini 2.5 Flash',
    parserVersion: 'live_backend_ocr_v2',
  },
  parsedData: {
    parserMode: 'live_backend_ocr',
    parserVersion: 'live_backend_ocr_v2',
    providerLabel: 'Google Gemini 2.5 Flash',
    sourceFileCount: 1,
    sourceDocumentChecksum: 'abc123',
    backendProcessingRecordId: 'receiptproc_1',
    backendExtractionRunId: 'extract_backend_1',
    backendSourceDocumentId: 'srcdoc_backend_1',
    fieldCandidateCount: 3,
    lineItemCandidateCount: 2,
  },
  lineItems: [
    {
      id: 'line_1',
      description: 'Bananas',
      lineTotal: 2.99,
      reviewState: 'needs_review',
      thingCandidate: false,
    },
  ],
  alertCount: 0,
  duplicateCandidateCount: 0,
  reviewDecisionCount: 0,
};

describe('live receipt graph store', () => {
  afterEach(async () => {
    await clearLiveReceiptGraphStore();
    vi.unstubAllEnvs();
  });

  it('upserts and retrieves mirrored live receipt graph records', async () => {
    vi.stubEnv('LIVE_RECEIPT_GRAPH_STORE_PATH', path.join(os.tmpdir(), `m2m-live-receipt-graph-${Date.now()}.json`));

    await upsertLiveReceiptGraphRecord(baseRecord);

    const allRecords = await listLiveReceiptGraphRecords();
    const record = await getLiveReceiptGraphRecordById(baseRecord.id);

    expect(allRecords).toHaveLength(1);
    expect(record?.id).toBe(baseRecord.id);
    expect(record?.header.merchantName).toBe('Safeway');
    expect(record?.parsedData.backendProcessingRecordId).toBe('receiptproc_1');
  });
});
