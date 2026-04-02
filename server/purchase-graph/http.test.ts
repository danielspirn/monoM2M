import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { handleTrustedPurchaseGraphHttpRequest } from './http';
import { clearTrustedPurchaseGraphStore } from './store';

describe('trusted purchase graph http handler', () => {
  beforeEach(() => {
    vi.stubEnv('TRUSTED_PURCHASE_GRAPH_STORE_PATH', path.join(os.tmpdir(), `m2m-trusted-purchase-http-${Date.now()}.json`));
  });

  afterEach(async () => {
    await clearTrustedPurchaseGraphStore();
    vi.unstubAllEnvs();
  });

  it('upserts and retrieves a trusted purchase graph record', async () => {
    const upsertReq = Object.assign(
      Readable.from([
        JSON.stringify({
          record: {
            id: 'receipt_trusted_2',
            syncedAt: '2026-04-02T00:00:00.000Z',
            receiptId: 'receipt_trusted_2',
            sourceDocumentId: 'srcdoc_trusted_2',
            extractionRunId: 'extract_trusted_2',
            purchaseEvent: {
              id: 'purchase_event_2',
              receiptId: 'receipt_trusted_2',
              sourceDocumentId: 'srcdoc_trusted_2',
              merchantId: 'merchant_target',
              merchantName: 'Target',
              purchasedAt: '2026-04-02',
              grandTotal: 49.99,
              currency: 'USD',
              lineItemCount: 1,
              thingCandidateCount: 1,
              personIds: [],
              memorySuggestionIds: [],
              productCategories: ['home'],
            },
            merchant: {
              id: 'merchant_target',
              displayName: 'Target',
              kind: 'retailer',
              retailerProfile: 'known retailer',
              purchaseCount: 1,
              trustedSpendTotal: 49.99,
              latestPurchaseAt: '2026-04-02',
              defaultProductCategories: ['home'],
            },
            purchaseLineItems: [
              {
                id: 'line_item_2',
                purchaseEventId: 'purchase_event_2',
                sourceLineItemId: 'source_line_2',
                description: 'Storage Bin',
                quantity: 1,
                lineTotal: 49.99,
                category: 'home',
                subcategory: 'storage',
                assetCandidateFlag: true,
                thingId: 'thing_storage_bin',
              },
            ],
            products: [
              {
                id: 'product_storage_bin',
                purchaseEventId: 'purchase_event_2',
                sourceLineItemId: 'source_line_2',
                displayName: 'Storage Bin',
                category: 'home',
                subcategory: 'storage',
                thingCandidate: true,
                linkedThingId: 'thing_storage_bin',
                lineTotal: 49.99,
              },
            ],
            things: [
              {
                id: 'thing_storage_bin',
                purchaseEventId: 'purchase_event_2',
                receiptId: 'receipt_trusted_2',
                displayName: 'Storage Bin',
                category: 'home',
                subcategory: 'storage',
                purchasePrice: 49.99,
                acquiredAt: '2026-04-02',
                merchantName: 'Target',
                personIds: [],
                memoryIds: [],
              },
            ],
            memories: [],
          },
        }),
      ]),
      { method: 'POST', url: '/api/trusted-purchase-graph' },
    );
    const upsertRes = createMockResponse();

    await handleTrustedPurchaseGraphHttpRequest(upsertReq as never, upsertRes as never);

    const getReq = Object.assign(Readable.from([]), {
      method: 'GET',
      url: '/api/trusted-purchase-graph/receipt_trusted_2',
    });
    const getRes = createMockResponse();

    await handleTrustedPurchaseGraphHttpRequest(getReq as never, getRes as never);

    expect(upsertRes.statusCode).toBe(200);
    expect(getRes.statusCode).toBe(200);
    expect(JSON.parse(getRes.body).record.things[0].displayName).toBe('Storage Bin');
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
