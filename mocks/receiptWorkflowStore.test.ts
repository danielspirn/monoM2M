import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createLiveReceiptBatch,
  getLiveReceiptStudioPayload,
  listProjectedPurchaseEvents,
  listProjectedPurchaseLineItems,
  listProjectedPurchaseReceipts,
  listProjectedThings,
  resetLiveReceiptStore,
  rerunLiveReceiptExtraction,
  saveLiveReceiptHeaderField,
  saveLiveReceiptLineItemField,
  searchSemanticReceipts,
  submitLiveReceiptReview,
} from './receiptWorkflowStore';

describe('receiptWorkflowStore projections', () => {
  beforeEach(() => {
    resetLiveReceiptStore();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('projects trusted receipts into purchase and thing records', () => {
    const capture = createLiveReceiptBatch({
      merchant: 'Target',
      purchaseDate: '2026-03-08',
      source: 'Upload photo',
      summary: 'Air fryer, parchment liners',
    });

    submitLiveReceiptReview(capture.primaryReceiptId);

    const projectedReceipts = listProjectedPurchaseReceipts();
    const projectedPurchaseEvents = listProjectedPurchaseEvents();
    const projectedPurchaseLineItems = listProjectedPurchaseLineItems();
    const projectedThings = listProjectedThings();

    expect(projectedPurchaseEvents).toHaveLength(1);
    expect(projectedPurchaseEvents[0]?.merchantId).toBe('merchant_target');
    expect(projectedPurchaseEvents[0]?.merchantDirectoryId).toBe('merchant_directory_target');
    expect(projectedPurchaseEvents[0]?.thingCandidateCount).toBe(1);

    expect(projectedPurchaseLineItems).toHaveLength(2);
    expect(projectedPurchaseLineItems[0]?.purchaseEventId).toBe(`purchase_${capture.primaryReceiptId}`);
    expect(projectedPurchaseLineItems[0]?.productCandidateKey).toBeTruthy();
    expect(projectedPurchaseLineItems.find((item) => item.description === 'Air Fryer')?.thingId).toBeTruthy();

    expect(projectedReceipts).toHaveLength(1);
    expect(projectedReceipts[0]?.purchaseEventId).toBe(`purchase_${capture.primaryReceiptId}`);
    expect(projectedReceipts[0]?.merchantName).toBe('Target');
    expect(projectedReceipts[0]?.thingIds.length).toBe(1);

    expect(projectedThings).toHaveLength(1);
    expect(projectedThings[0]?.displayName).toBe('Air Fryer');
    expect(projectedThings[0]?.category).toBe('Kitchen');
    expect(projectedThings[0]?.badgeLabels).toContain('From receipt review');
    expect(projectedThings[0]?.sourceDocumentId).toBeTruthy();
    expect(projectedThings[0]?.linkedDocumentCount).toBe(1);
    expect(projectedThings[0]?.supportLabels).toContain('Receipt linked');
  });

  it('uses OCR snapshot item candidates for uncurated uploaded files', () => {
    const capture = createLiveReceiptBatch({
      merchant: '',
      purchaseDate: '2026-03-30',
      source: 'Upload photo',
      summary: '',
      fixtureFiles: ['receipt_images/IMG_7558.jpeg'],
    });

    vi.advanceTimersByTime(2200);

    const payload = getLiveReceiptStudioPayload(capture.primaryReceiptId);

    expect(payload?.header.merchantName).toBe('Hotel Royal Orchid Re:gen:ta');
    expect(payload?.lineItems.map((item) => item.descriptionNormalized)).toEqual([
      'Pineapple And Coconut',
      'Wild Mushroom And Leek',
    ]);
    expect(payload?.structuredData.retailerProfile).toBe('new retailer');
    expect(payload?.parsedData.lineItemCandidates.map((item) => item.description)).toEqual([
      'Pineapple And Coconut',
      'Wild Mushroom And Leek',
    ]);
    expect(payload?.parsedData.requestProvenance.parserMode).toBe('live_ocr_snapshot');
    expect(payload?.parsedData.providerTrace.providerLabel).toBeTruthy();

    const reopenedPayload = getLiveReceiptStudioPayload(capture.primaryReceiptId);

    expect(reopenedPayload?.parsedData.lineItemCandidates).toEqual(payload?.parsedData.lineItemCandidates);
    expect(reopenedPayload?.parsedData.requestProvenance).toEqual(payload?.parsedData.requestProvenance);
  });

  it('can rerun extraction while preserving parsed evidence links', () => {
    const capture = createLiveReceiptBatch({
      merchant: '',
      purchaseDate: '2026-03-30',
      source: 'Upload photo',
      summary: '',
      fixtureFiles: ['receipt_images/IMG_7558.jpeg'],
    });

    vi.advanceTimersByTime(2200);

    const initialPayload = getLiveReceiptStudioPayload(capture.primaryReceiptId);
    const rerunPayload = rerunLiveReceiptExtraction(capture.primaryReceiptId);

    expect(rerunPayload?.receipt.status).toBe('processing');
    expect(rerunPayload?.progress?.stage).toBe('queueing_document');

    vi.advanceTimersByTime(2200);

    const reopenedPayload = getLiveReceiptStudioPayload(capture.primaryReceiptId);

    expect(reopenedPayload?.receipt.status).toBe('needs_review');
    expect(reopenedPayload?.parsedData.fieldCandidates.every((field) => Boolean(field.evidenceSpanId))).toBe(true);
    expect(reopenedPayload?.parsedData.lineItemCandidates.every((item) => Boolean(item.evidenceSpanId))).toBe(true);
    expect(reopenedPayload?.parsedData.lineItemCandidates).toEqual(initialPayload?.parsedData.lineItemCandidates);
  });

  it('persists reviewed header and line-item edits before trust', () => {
    const capture = createLiveReceiptBatch({
      merchant: 'Target',
      purchaseDate: '2026-03-08',
      source: 'Upload photo',
      summary: 'Air fryer, parchment liners',
    });

    vi.advanceTimersByTime(2200);

    saveLiveReceiptHeaderField(capture.primaryReceiptId, 'merchantName', 'Target Run');
    saveLiveReceiptLineItemField(capture.primaryReceiptId, `${capture.primaryReceiptId}_line_1`, 'descriptionNormalized', 'Air Fryer XL');
    saveLiveReceiptLineItemField(capture.primaryReceiptId, `${capture.primaryReceiptId}_line_1`, 'lineTotal', '99.50');

    const payload = getLiveReceiptStudioPayload(capture.primaryReceiptId);

    expect(payload?.header.merchantName).toBe('Target Run');
    expect(payload?.header.grandTotal).toBeGreaterThan(99);
    expect(payload?.lineItems[0]?.descriptionNormalized).toBe('Air Fryer Xl');
    expect(payload?.lineItems[0]?.reviewState).toBe('edited');
    expect(payload?.parsedData.fieldCandidates[0]?.value).toBe('Target Run');
    expect(payload?.structuredData.merchantMatchStatus).toBe('confirmed');
  });

  it('refreshes stored purchase graph records after trusted edits', () => {
    const capture = createLiveReceiptBatch({
      merchant: 'Target',
      purchaseDate: '2026-03-08',
      source: 'Upload photo',
      summary: 'Air fryer, parchment liners',
    });

    vi.advanceTimersByTime(2200);
    submitLiveReceiptReview(capture.primaryReceiptId);

    saveLiveReceiptHeaderField(capture.primaryReceiptId, 'merchantName', 'Target Run');
    saveLiveReceiptLineItemField(capture.primaryReceiptId, `${capture.primaryReceiptId}_line_1`, 'descriptionNormalized', 'Air Fryer XL');

    const purchaseEvents = listProjectedPurchaseEvents();
    const purchaseLineItems = listProjectedPurchaseLineItems();

    expect(purchaseEvents[0]?.merchantName).toBe('Target Run');
    expect(purchaseEvents[0]?.merchantResolutionSource).toBe('reviewed_receipt');
    expect(purchaseLineItems.find((item) => item.lineIndex === 1)?.description).toBe('Air Fryer Xl');
    expect(purchaseLineItems.find((item) => item.lineIndex === 1)?.productCandidateLabel).toBe('Air Fryer Xl');
  });

  it('finds receipts through semantic retrieval without exact wording matches', () => {
    const capture = createLiveReceiptBatch({
      merchant: 'Target',
      purchaseDate: '2026-03-08',
      source: 'Upload photo',
      summary: 'Air fryer, parchment liners',
    });

    vi.advanceTimersByTime(2200);
    submitLiveReceiptReview(capture.primaryReceiptId);

    const results = searchSemanticReceipts('fried food machine');

    expect(results[0]?.receiptId).toBe(capture.primaryReceiptId);
    expect(results[0]?.matchedTerms).toContain('air fryer');
  });
});
