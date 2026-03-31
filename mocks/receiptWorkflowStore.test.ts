import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  answerSemanticReceiptQuestion,
  createLiveReceiptBatch,
  getLiveReceiptStudioPayload,
  listLiveDuplicateCandidates,
  listProjectedExtractionRuns,
  listProjectedEvidenceRecords,
  listProjectedLocations,
  listProjectedPolicies,
  listProjectedReturnSupports,
  listProjectedSemanticRecords,
  listProjectedSourceDocuments,
  listProjectedPurchaseEvents,
  listProjectedPurchaseLineItems,
  listProjectedPurchaseParticipants,
  listProjectedMemories,
  listProjectedMerchants,
  listProjectedObjects,
  listProjectedDocumentLinks,
  listProjectedTags,
  listProjectedPurchaseReceipts,
  listProjectedProducts,
  listProjectedThingDocuments,
  listProjectedThings,
  listProjectedWarranties,
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
    const projectedParticipants = listProjectedPurchaseParticipants();
    const projectedMerchants = listProjectedMerchants();
    const projectedObjects = listProjectedObjects();
    const projectedProducts = listProjectedProducts();
    const projectedThings = listProjectedThings();
    const projectedMemories = listProjectedMemories();
    const projectedWarranties = listProjectedWarranties();
    const projectedDocuments = listProjectedThingDocuments();
    const projectedDocumentLinks = listProjectedDocumentLinks();
    const projectedTags = listProjectedTags();
    const projectedSemanticRecords = listProjectedSemanticRecords();
    const projectedSourceDocuments = listProjectedSourceDocuments();
    const projectedExtractionRuns = listProjectedExtractionRuns();
    const projectedReturnSupports = listProjectedReturnSupports();
    const projectedPolicies = listProjectedPolicies();
    const projectedLocations = listProjectedLocations();
    const projectedEvidenceRecords = listProjectedEvidenceRecords();

    expect(projectedPurchaseEvents).toHaveLength(1);
    expect(projectedPurchaseEvents[0]?.merchantId).toBe('merchant_target');
    expect(projectedPurchaseEvents[0]?.merchantDirectoryId).toBe('merchant_directory_target');
    expect(projectedPurchaseEvents[0]?.thingCandidateCount).toBe(1);
    expect(projectedMerchants).toHaveLength(1);
    expect(projectedMerchants[0]?.displayName).toBe('Target');
    expect(projectedMerchants[0]?.purchaseCount).toBe(1);
    expect(projectedMerchants[0]?.trustedSpendTotal).toBe(projectedPurchaseEvents[0]?.grandTotal);
    expect(projectedObjects).toHaveLength(2);
    expect(projectedObjects.find((object) => object.displayName === 'Air Fryer')?.thingCandidate).toBe(true);
    expect(projectedObjects.find((object) => object.displayName === 'Air Fryer')?.linkedThingIds.length).toBe(1);

    expect(projectedPurchaseLineItems).toHaveLength(2);
    expect(projectedPurchaseLineItems[0]?.purchaseEventId).toBe(`purchase_${capture.primaryReceiptId}`);
    expect(projectedPurchaseLineItems[0]?.productCandidateKey).toBeTruthy();
    expect(projectedPurchaseLineItems.find((item) => item.description === 'Air Fryer')?.thingId).toBeTruthy();
    expect(projectedParticipants).toHaveLength(2);
    expect(projectedParticipants.find((participant) => participant.personId === 'person_self')?.participationRole).toBe('self');
    expect(projectedParticipants.find((participant) => participant.personId === 'person_shanshan')?.participationRole).toBe('household_member');
    expect(projectedParticipants.find((participant) => participant.personId === 'person_shanshan')?.spendShare).toBeCloseTo((projectedPurchaseEvents[0]?.grandTotal ?? 0) / 2, 2);

    expect(projectedProducts).toHaveLength(2);
    expect(projectedProducts.find((product) => product.displayName === 'Air Fryer')?.linkedThingId).toBeTruthy();
    expect(projectedProducts.find((product) => product.displayName === 'Air Fryer')?.matchStatus).toBe('confirmed');

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
    expect(projectedThings[0]?.memoryIds.length).toBe(1);

    expect(projectedMemories).toHaveLength(1);
    expect(projectedMemories[0]?.receiptIds).toEqual([capture.primaryReceiptId]);
    expect(projectedMemories[0]?.thingIds).toContain(projectedThings[0]?.id ?? '');
    expect(projectedMemories[0]?.memoryState).toBe('candidate');
    expect(projectedReceipts[0]?.memoryIds).toContain(projectedMemories[0]?.id ?? '');
    expect(projectedWarranties).toHaveLength(1);
    expect(projectedWarranties[0]?.thingId).toBe(projectedThings[0]?.id);
    expect(projectedDocuments.filter((document) => document.thingId === projectedThings[0]?.id)).toHaveLength(2);
    expect(projectedDocumentLinks.some((link) => link.targetObjectType === 'purchase_event')).toBe(true);
    expect(projectedDocumentLinks.some((link) => link.targetObjectType === 'thing' && link.targetObjectId === projectedThings[0]?.id)).toBe(true);
    expect(projectedDocumentLinks.some((link) => link.targetObjectType === 'warranty')).toBe(true);
    expect(projectedDocumentLinks.some((link) => link.targetObjectType === 'memory')).toBe(true);
    expect(projectedTags.some((tag) => tag.framework === 'product_category' && tag.label === 'Kitchen')).toBe(true);
    expect(projectedTags.some((tag) => tag.framework === 'household' && tag.linkedThingIds.includes(projectedThings[0]?.id ?? ''))).toBe(true);
    expect(projectedTags.some((tag) => tag.framework === 'vendor_context' && tag.label === 'known retailer')).toBe(true);
    expect(projectedSemanticRecords).toHaveLength(1);
    expect(projectedSemanticRecords[0]?.retrievalScope).toBe('trusted_receipt');
    expect(projectedSemanticRecords[0]?.embeddingVersion).toBe('receipt-embedding-v1');
    expect(projectedSemanticRecords[0]?.thingIds).toContain(projectedThings[0]?.id ?? '');
    expect(projectedSourceDocuments).toHaveLength(1);
    expect(projectedSourceDocuments[0]?.captureChannel).toBe('upload_photo');
    expect(projectedExtractionRuns).toHaveLength(1);
    expect(projectedExtractionRuns[0]?.providerLabel).toBeTruthy();
    expect(projectedExtractionRuns[0]?.sourceDocumentId).toBe(projectedSourceDocuments[0]?.id);
    expect(projectedReturnSupports).toHaveLength(1);
    expect(projectedReturnSupports[0]?.thingId).toBe(projectedThings[0]?.id);
    expect(projectedReturnSupports[0]?.policyLabel).toBe('Target return window');
    expect(projectedPolicies).toHaveLength(2);
    expect(projectedPolicies.some((policy) => policy.policyKind === 'warranty')).toBe(true);
    expect(projectedPolicies.some((policy) => policy.policyKind === 'return')).toBe(true);
    expect(projectedPolicies.every((policy) => policy.thingId === projectedThings[0]?.id)).toBe(true);
    expect(projectedLocations).toHaveLength(1);
    expect(projectedLocations[0]?.locationKind).toBe('merchant_place');
    expect(projectedLocations[0]?.linkedThingIds).toContain(projectedThings[0]?.id ?? '');
    expect(projectedEvidenceRecords.some((record) => record.targetObjectType === 'purchase_event')).toBe(true);
    expect(projectedEvidenceRecords.some((record) => record.linkedThingIds.includes(projectedThings[0]?.id ?? ''))).toBe(true);
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
    expect((payload?.reviewDecisions?.length ?? 0)).toBeGreaterThanOrEqual(3);
    expect(payload?.reviewDecisions.some((decision) => decision.label === 'Merchant')).toBe(true);
    expect(payload?.reviewDecisions.some((decision) => decision.targetType === 'line_item')).toBe(true);
  });

  it('builds duplicate candidate records for similar receipts', () => {
    const firstCapture = createLiveReceiptBatch({
      merchant: 'Safeway',
      purchaseDate: '2026-03-10',
      source: 'Upload photo',
      summary: 'Bananas, yogurt',
    });

    vi.advanceTimersByTime(2200);

    const secondCapture = createLiveReceiptBatch({
      merchant: 'Safeway',
      purchaseDate: '2026-03-10',
      source: 'Upload photo',
      summary: 'Bananas, yogurt',
    });

    vi.advanceTimersByTime(2200);

    const payload = getLiveReceiptStudioPayload(secondCapture.primaryReceiptId);
    const duplicateCandidates = listLiveDuplicateCandidates();

    expect(payload?.duplicateCandidates).toHaveLength(1);
    expect(payload?.duplicateCandidates[0]?.matchedReceiptId).toBe(firstCapture.primaryReceiptId);
    expect(payload?.duplicateCandidates[0]?.matchedMerchantName).toBe('Safeway');
    expect(payload?.duplicateCandidates[0]?.confidenceScore).toBeGreaterThan(0.9);
    expect(payload?.alerts.some((alert) => alert.kind === 'duplicate')).toBe(true);
    expect(duplicateCandidates.some((candidate) => candidate.receiptId === secondCapture.primaryReceiptId)).toBe(true);
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

  it('grounds receipt answers in trusted receipt facts and citations', () => {
    const capture = createLiveReceiptBatch({
      merchant: 'Target',
      purchaseDate: '2026-03-08',
      source: 'Upload photo',
      summary: 'Air fryer, parchment liners',
    });

    vi.advanceTimersByTime(2200);
    submitLiveReceiptReview(capture.primaryReceiptId);

    const answer = answerSemanticReceiptQuestion('What did I buy at Target?');

    expect(answer?.scope).toBe('trusted_receipts_only');
    expect(answer?.summary).toContain('Target');
    expect(answer?.summary).toContain('Air Fryer');
    expect(answer?.citations.some((citation) => citation.type === 'receipt' && citation.id === capture.primaryReceiptId)).toBe(true);
    expect(answer?.citations.some((citation) => citation.type === 'thing')).toBe(true);
    expect(answer?.citations.some((citation) => citation.type === 'evidence')).toBe(true);
    expect(answer?.structuredResults[0]?.action).toBe(`route:/ingest/${capture.primaryReceiptId}`);
  });
});
