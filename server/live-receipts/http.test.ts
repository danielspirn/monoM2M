import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { handleLiveReceiptGraphHttpRequest } from './http';
import { clearLiveReceiptGraphStore } from './store';

describe('live receipt graph http handler', () => {
  beforeEach(() => {
    vi.stubEnv('LIVE_RECEIPT_GRAPH_STORE_PATH', path.join(os.tmpdir(), `m2m-live-graph-http-${Date.now()}.json`));
  });

  afterEach(async () => {
    await clearLiveReceiptGraphStore();
    vi.unstubAllEnvs();
  });

  it('upserts and retrieves a live receipt graph record', async () => {
    const upsertReq = Object.assign(
      Readable.from([
        JSON.stringify({
          record: {
            id: 'receipt_live_2',
            syncedAt: '2026-04-02T00:00:00.000Z',
            receipt: {
              id: 'receipt_live_2',
              status: 'needs_review',
              sourceType: 'receipt_image',
              capturedAt: '2026-04-02T00:00:00.000Z',
            },
            header: {
              merchantName: 'Target',
              purchasedAt: '2026-04-02',
              grandTotal: 99.99,
              currency: 'USD',
            },
            sourceDocument: {
              id: 'srcdoc_live_2',
              fileName: 'IMG_2222.jpeg',
              mimeType: 'image/jpeg',
              captureChannel: 'upload_photo',
              sourceFileCount: 1,
              checksum: 'checksum-2',
              detectedReceiptCount: 1,
            },
            extractionRun: {
              id: 'extract_live_2',
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
              sourceDocumentChecksum: 'checksum-2',
              backendProcessingRecordId: 'receiptproc_2',
              backendExtractionRunId: 'extract_backend_2',
              backendSourceDocumentId: 'srcdoc_backend_2',
              fieldCandidateCount: 3,
              lineItemCandidateCount: 2,
            },
            lineItems: [
              {
                id: 'line_1',
                description: 'Air Fryer',
                lineTotal: 99.99,
                reviewState: 'edited',
                thingCandidate: true,
              },
            ],
            alertCount: 0,
            duplicateCandidateCount: 0,
            reviewDecisionCount: 1,
          },
        }),
      ]),
      { method: 'POST', url: '/api/live-receipt-graph' },
    );
    const upsertRes = createMockResponse();

    await handleLiveReceiptGraphHttpRequest(upsertReq as never, upsertRes as never);

    const getReq = Object.assign(Readable.from([]), {
      method: 'GET',
      url: '/api/live-receipt-graph/receipt_live_2',
    });
    const getRes = createMockResponse();

    await handleLiveReceiptGraphHttpRequest(getReq as never, getRes as never);

    expect(upsertRes.statusCode).toBe(200);
    expect(getRes.statusCode).toBe(200);
    expect(JSON.parse(getRes.body).record.header.merchantName).toBe('Target');
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
