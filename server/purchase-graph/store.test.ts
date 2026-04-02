import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import type { TrustedPurchaseGraphRecord } from '../../contracts/schema/integrations/trusted-purchase-graph.contract';

import {
  clearTrustedPurchaseGraphStore,
  getTrustedPurchaseGraphRecordById,
  listTrustedPurchaseGraphRecords,
  upsertTrustedPurchaseGraphRecord,
} from './store';

const baseRecord: TrustedPurchaseGraphRecord = {
  id: 'receipt_trusted_1',
  syncedAt: '2026-04-02T00:00:00.000Z',
  receiptId: 'receipt_trusted_1',
  sourceDocumentId: 'srcdoc_trusted_1',
  extractionRunId: 'extract_trusted_1',
  purchaseEvent: {
    id: 'purchase_event_1',
    receiptId: 'receipt_trusted_1',
    sourceDocumentId: 'srcdoc_trusted_1',
    merchantId: 'merchant_target',
    merchantName: 'Target',
    purchasedAt: '2026-04-02',
    grandTotal: 99.99,
    currency: 'USD',
    lineItemCount: 1,
    thingCandidateCount: 1,
    personIds: ['person_alex'],
    memorySuggestionIds: ['memory_family_dinner'],
    productCategories: ['home'],
  },
  merchant: {
    id: 'merchant_target',
    displayName: 'Target',
    kind: 'retailer',
    retailerProfile: 'known retailer',
    purchaseCount: 1,
    trustedSpendTotal: 99.99,
    latestPurchaseAt: '2026-04-02',
    defaultProductCategories: ['home'],
  },
  purchaseLineItems: [
    {
      id: 'line_item_1',
      purchaseEventId: 'purchase_event_1',
      sourceLineItemId: 'source_line_1',
      description: 'Air Fryer',
      quantity: 1,
      lineTotal: 99.99,
      category: 'home',
      subcategory: 'kitchen',
      assetCandidateFlag: true,
      thingId: 'thing_air_fryer',
    },
  ],
  products: [
    {
      id: 'product_air_fryer',
      purchaseEventId: 'purchase_event_1',
      sourceLineItemId: 'source_line_1',
      displayName: 'Air Fryer',
      category: 'home',
      subcategory: 'kitchen',
      thingCandidate: true,
      linkedThingId: 'thing_air_fryer',
      lineTotal: 99.99,
    },
  ],
  things: [
    {
      id: 'thing_air_fryer',
      purchaseEventId: 'purchase_event_1',
      receiptId: 'receipt_trusted_1',
      displayName: 'Air Fryer',
      category: 'home',
      subcategory: 'kitchen',
      purchasePrice: 99.99,
      acquiredAt: '2026-04-02',
      merchantName: 'Target',
      personIds: ['person_alex'],
      memoryIds: ['memory_family_dinner'],
    },
  ],
  memories: [
    {
      id: 'memory_family_dinner',
      purchaseEventId: 'purchase_event_1',
      receiptId: 'receipt_trusted_1',
      title: 'Family Dinner Prep',
      memoryType: 'meal',
      significance: 'medium',
      startsAt: '2026-04-02',
      placeLabel: 'Target',
      receiptIds: ['receipt_trusted_1'],
      personIds: ['person_alex'],
      thingIds: ['thing_air_fryer'],
    },
  ],
};

describe('trusted purchase graph store', () => {
  afterEach(async () => {
    await clearTrustedPurchaseGraphStore();
    vi.unstubAllEnvs();
  });

  it('upserts and retrieves trusted purchase graph records', async () => {
    vi.stubEnv('TRUSTED_PURCHASE_GRAPH_STORE_PATH', path.join(os.tmpdir(), `m2m-trusted-purchase-graph-${Date.now()}.json`));

    await upsertTrustedPurchaseGraphRecord(baseRecord);

    const allRecords = await listTrustedPurchaseGraphRecords();
    const record = await getTrustedPurchaseGraphRecordById(baseRecord.id);

    expect(allRecords).toHaveLength(1);
    expect(record?.receiptId).toBe(baseRecord.receiptId);
    expect(record?.merchant.displayName).toBe('Target');
    expect(record?.things[0]?.displayName).toBe('Air Fryer');
  });
});
