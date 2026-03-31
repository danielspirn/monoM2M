import { parseReceiptCaptureInput } from './receiptParser';
import { resolveMerchantDirectoryEntry } from './catalog/merchantDirectory';
import { resolveObjectDirectoryEntry } from './catalog/objectDirectory';
import type {
  ReceiptOcrEvaluationStage,
  ReceiptOcrProviderId,
  ReceiptOcrRoutingMode,
} from './ocr/types';

const RECEIPT_STORE_KEY = 'm2m.live.receipts.v1';
const EXTRACTION_DELAY_MS = 1800;

export type SourceDocumentType = 'receipt_image' | 'receipt_pdf';
export type ReceiptWorkflowStatus = 'processing' | 'needs_review' | 'trusted';
export type ReviewState = 'auto' | 'edited' | 'needs_review';
export type CaptureChannel = 'upload_photo' | 'multi_receipt_photo' | 'quick_snap' | 'upload_pdf' | 'email_forward' | 'video_capture';

export type CreateReceiptInput = {
  merchant: string;
  purchaseDate: string;
  source: string;
  summary: string;
  fixtureFiles?: string[];
};

export type CreateReceiptBatchResult = {
  primaryReceiptId: string;
  detectedReceiptCount: number;
  issueCount: number;
  receiptIds: string[];
};

type StoredSourceDocument = {
  id: string;
  sourceType: SourceDocumentType;
  captureChannel: CaptureChannel;
  fileName: string;
  sourceFiles: string[];
  mimeType: string;
  capturedAt: string;
  checksum: string;
  storageStatus: 'stored';
  detectedReceiptCount: number;
};

type StoredExtractionRun = {
  id: string;
  status: 'queued' | 'processing' | 'completed';
  parserVersion: string;
  providerId: ReceiptOcrProviderId;
  providerLabel: string;
  routingMode: ReceiptOcrRoutingMode;
  evaluationStage: ReceiptOcrEvaluationStage;
  fallbackProviderLabel: string | null;
  startedAt: string;
  completedAt: string | null;
  stage: string;
  stageLabel: string;
};

export type ReceiptLineItemRecord = {
  id: string;
  lineIndex: number;
  descriptionRaw: string;
  descriptionNormalized: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  reviewState: ReviewState;
  confidenceScore: number;
  assetCandidateFlag: boolean;
  productMatchStatus: 'suggested' | 'confirmed' | 'unmatched';
  productMatchConfidence: number;
  householdTags: string[];
  lemTags: string[];
};

type ParsedFieldCandidate = {
  label: string;
  value: string;
  confidence: number;
};

type EvidenceSpanRecord = {
  id: string;
  label: string;
  targetObjectType: 'purchase_event' | 'purchase_line_item';
  targetObjectId: string;
  evidenceType: 'image_region' | 'text_span';
  pageNumber: number | null;
  snippet: string;
  x: number | null;
  y: number | null;
  width: number | null;
  height: number | null;
};

type StoredReceiptRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: ReceiptWorkflowStatus;
  note: string;
  captureSession: {
    id: string;
    primaryReceiptId: string;
    siblingReceiptIds: string[];
    sourceDocumentId: string;
  };
  sourceDocument: StoredSourceDocument;
  extractionRun: StoredExtractionRun;
  header: {
    title: string;
    merchantName: string;
    purchasedAt: string;
    grandTotal: number;
    currency: string;
  };
  parsedData: {
    rawText: string;
    fieldCandidates: ParsedFieldCandidate[];
    returnPolicySnippet: string | null;
    warrantySnippet: string | null;
  };
  lineItems: ReceiptLineItemRecord[];
  selectedLineItemId: string | null;
  evidenceSpans: EvidenceSpanRecord[];
  peopleSuggestions: Array<{
    id: string;
    displayName: string;
    relationshipType: string;
  }>;
  memorySuggestions: Array<{
    id: string;
    memoryState: 'candidate';
    suggestedTitle: string;
  }>;
  structuredData: {
    merchantMatchStatus: 'suggested' | 'confirmed';
    merchantMatchConfidence: number;
    thingCandidateCount: number;
    returnPolicyStatus: 'candidate' | 'not_found';
    warrantyStatus: 'candidate' | 'not_found';
    retailerProfile: string;
    taxTags: string[];
    lifestyleTags: string[];
    productCategories: string[];
    returnWindowLabel: string;
    warrantySupportLabel: string;
  };
  searchDocument: {
    status: 'indexed';
    keywords: string[];
    textPreview: string;
  };
  alerts: Array<{
    id: string;
    kind: 'duplicate' | 'needs_review' | 'library_lookup';
    level: 'issue' | 'info';
    title: string;
    body: string;
  }>;
  purchaseProjection?: {
    projectedAt: string;
    purchaseEventId: string;
    projectedThingIds: string[];
  };
};

export type ReceiptStudioLivePayload = {
  receipt: {
    id: string;
    status: ReceiptWorkflowStatus;
    sourceType: SourceDocumentType;
    capturedAt: string;
  };
  header: {
    title: string;
    merchantName: string;
    purchasedAt: string;
    grandTotal: number;
    currency: string;
  };
  progress: {
    stage: string;
    label: string;
  } | null;
  lineItems: ReceiptLineItemRecord[];
  selectedLineItemId: string | null;
  evidence: {
    targetObjectType: string;
    targetObjectId: string;
    evidenceType: 'image_region' | 'text_span';
    pageNumber: number | null;
    x: number | null;
    y: number | null;
    width: number | null;
    height: number | null;
    snippet: string;
  } | null;
  evidenceTrail: Array<{
    id: string;
    label: string;
    snippet: string;
    targetObjectId: string;
  }>;
  peopleSuggestions: Array<{
    id: string;
    displayName: string;
    relationshipType: string;
  }>;
  memorySuggestions: Array<{
    id: string;
    memoryState: 'candidate';
    suggestedTitle: string;
  }>;
  actions: {
    canSave: boolean;
    canConvertToThing: boolean;
    canTagPeople: boolean;
    canAddToMemory: boolean;
  };
  captureSession: {
    id: string;
    detectedReceiptCount: number;
    siblings: Array<{
      id: string;
      merchantName: string;
      status: ReceiptWorkflowStatus;
      action: string;
    }>;
  };
  sourceDocument: StoredSourceDocument;
  extractionRun: StoredExtractionRun;
  parsedData: StoredReceiptRecord['parsedData'];
  structuredData: StoredReceiptRecord['structuredData'];
  searchDocument: StoredReceiptRecord['searchDocument'];
  alerts: StoredReceiptRecord['alerts'];
};

export type StoredReceiptCard = {
  id: string;
  merchantName: string;
  purchasedAt: string;
  grandTotal: number;
  currency: string;
  lineItemCount: number;
  status: ReceiptWorkflowStatus;
  note: string;
  tags: string[];
  action: string;
};

export type ProjectedPurchaseReceiptRecord = {
  id: string;
  purchaseEventId: string;
  merchantName: string;
  purchasedAt: string;
  grandTotal: number;
  currency: string;
  lineItemCount: number;
  status: 'trusted';
  note: string;
  lineHighlights: string[];
  category: string;
  returnWindowEndsAt?: string;
  personIds: string[];
  thingIds: string[];
  memoryIds: string[];
};

export type ProjectedPurchaseEventRecord = {
  id: string;
  receiptId: string;
  sourceDocumentId: string;
  merchantId: string;
  merchantName: string;
  purchasedAt: string;
  grandTotal: number;
  currency: string;
  lineItemCount: number;
  retailerProfile: string;
  merchantMatchStatus: 'suggested' | 'confirmed';
  merchantMatchConfidence: number;
  taxTags: string[];
  lifestyleTags: string[];
  productCategories: string[];
  returnWindowEndsAt?: string;
  thingCandidateCount: number;
  personIds: string[];
  memorySuggestionIds: string[];
  searchKeywords: string[];
  note: string;
};

export type ProjectedPurchaseLineItemRecord = {
  id: string;
  purchaseEventId: string;
  receiptId: string;
  purchasedAt: string;
  merchantName: string;
  currency: string;
  sourceLineItemId: string;
  lineIndex: number;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  reviewState: ReviewState;
  confidenceScore: number;
  assetCandidateFlag: boolean;
  productMatchStatus: 'suggested' | 'confirmed' | 'unmatched';
  productMatchConfidence: number;
  householdTags: string[];
  lemTags: string[];
  category: string;
  subcategory: string;
  returnable: boolean;
  warrantyEligible: boolean;
  thingId?: string;
  evidenceSpanIds: string[];
  personIds: string[];
};

export type ProjectedThingRecord = {
  id: string;
  purchaseEventId: string;
  displayName: string;
  category: string;
  subcategory: string;
  status: 'recent' | 'active';
  purchasePrice: number;
  currency: string;
  acquiredAt: string;
  merchantName: string;
  receiptId: string;
  notes: string;
  warrantyEndsAt?: string;
  returnWindowEndsAt?: string;
  badgeLabels: string[];
  personIds: string[];
  memoryIds: string[];
};

export function createLiveReceipt(input: CreateReceiptInput): string {
  return createLiveReceiptBatch(input).primaryReceiptId;
}

export function createLiveReceiptBatch(input: CreateReceiptInput): CreateReceiptBatchResult {
  const now = new Date().toISOString();
  const sourceDocumentType = mapSourceToDocumentType(input.source);
  const captureChannel = mapSourceToCaptureChannel(input.source);
  const sourceDocumentId = nextId('srcdoc');
  const captureSessionId = nextId('capture');
  const existingRecords = readStoredReceipts();
  const parserResult = parseReceiptCaptureInput(input);
  const drafts = buildReceiptDrafts(input, parserResult.drafts);
  const sharedChecksum = buildChecksum(`${input.source}-${input.summary}-${now}`);
  const primaryDraft = drafts[0];
  const primaryReceiptId = nextId('rcpt_live');
  const allReceiptIds = [primaryReceiptId, ...drafts.slice(1).map(() => nextId('rcpt_live'))];
  const sourceDocument: StoredSourceDocument = {
    id: sourceDocumentId,
    sourceType: sourceDocumentType,
    captureChannel,
    fileName: `${slugify(primaryDraft.merchant)}-${sourceDocumentId}.${sourceDocumentType === 'receipt_pdf' ? 'pdf' : 'jpg'}`,
    sourceFiles: paramsFixtureFiles(input),
    mimeType: sourceDocumentType === 'receipt_pdf' ? 'application/pdf' : 'image/jpeg',
    capturedAt: now,
    checksum: sharedChecksum,
    storageStatus: 'stored',
    detectedReceiptCount: drafts.length,
  };

  const records = drafts.map((draft, index) => buildStoredReceiptRecord({
    captureSessionId,
    input,
    draft,
    now,
    receiptId: allReceiptIds[index],
    primaryReceiptId,
    siblingReceiptIds: allReceiptIds.filter((receiptId) => receiptId !== allReceiptIds[index]),
    parserResult,
    sourceDocument,
    existingRecords,
  }));

  writeStoredReceipts([...records, ...existingRecords]);

  return {
    primaryReceiptId,
    detectedReceiptCount: records.length,
    issueCount: records.reduce((sum, record) => sum + record.alerts.filter((alert) => alert.level === 'issue').length, 0),
    receiptIds: records.map((record) => record.id),
  };
}

function paramsFixtureFiles(input: CreateReceiptInput) {
  return input.fixtureFiles?.length ? input.fixtureFiles : [];
}

function buildStoredReceiptRecord(params: {
  captureSessionId: string;
  input: CreateReceiptInput;
  draft: {
    merchant: string;
    purchaseDate: string;
    summary: string;
    itemCandidates?: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
      confidence: number;
    }>;
  };
  now: string;
  receiptId: string;
  primaryReceiptId: string;
  siblingReceiptIds: string[];
  parserResult: ReturnType<typeof parseReceiptCaptureInput>;
  sourceDocument: StoredSourceDocument;
  existingRecords: StoredReceiptRecord[];
}): StoredReceiptRecord {
  const { captureSessionId, draft, now, receiptId, primaryReceiptId, siblingReceiptIds, parserResult, sourceDocument, existingRecords } = params;
  const merchant = sanitizeMerchant(draft.merchant);
  const lineItems = buildLineItems(receiptId, merchant, draft.summary, draft.itemCandidates);
  const total = roundCurrency(lineItems.reduce((sum, item) => sum + item.lineTotal, 0));
  const receiptDate = normalizePurchaseDate(draft.purchaseDate, now);
  const selectedLineItemId = lineItems.find((item) => item.reviewState === 'needs_review')?.id ?? lineItems[0]?.id ?? null;
  const returnPolicySnippet = lineItems.some((item) => item.assetCandidateFlag)
    ? 'Return policy candidate detected: keep original receipt for item-level support.'
    : null;
  const warrantySnippet = lineItems.some((item) => item.assetCandidateFlag)
    ? 'Warranty candidate detected from durable-goods language and merchant pattern.'
    : null;
  const duplicateDetected = detectPossibleDuplicate(existingRecords, merchant, receiptDate, total);
  const merchantProfile = buildRetailerProfile(merchant);
  const taxTags = buildTaxTags(lineItems, merchant);
  const lifestyleTags = buildLifestyleTags(lineItems, merchant);
  const productCategories = buildProductCategories(lineItems);
  const thingCandidateCount = lineItems.filter((item) => item.assetCandidateFlag).length;

  return {
    id: receiptId,
    createdAt: now,
    updatedAt: now,
    status: 'processing',
    note:
      sourceDocument.detectedReceiptCount > 1
        ? `${merchant} was split from a shared upload and is being processed independently. ${parserResult.processingNote}`
        : `${merchant} receipt is being turned into reviewable purchase data. ${parserResult.processingNote}`,
    captureSession: {
      id: captureSessionId,
      primaryReceiptId,
      siblingReceiptIds,
      sourceDocumentId: sourceDocument.id,
    },
    sourceDocument,
    extractionRun: {
      id: nextId('extract'),
      status: 'queued',
      parserVersion: parserResult.parserVersion,
      providerId: parserResult.ocrRoute.provider.id,
      providerLabel: parserResult.ocrRoute.provider.displayName,
      routingMode: parserResult.ocrRoute.routingMode,
      evaluationStage: parserResult.ocrRoute.evaluationStage,
      fallbackProviderLabel: parserResult.ocrRoute.fallbackProvider?.displayName ?? null,
      startedAt: now,
      completedAt: null,
      stage: 'queueing_document',
      stageLabel:
        sourceDocument.detectedReceiptCount > 1
          ? `Splitting the upload into individual receipts and preparing extraction with ${parserResult.ocrRoute.provider.displayName}.`
          : `Storing the original receipt and preparing extraction with ${parserResult.ocrRoute.provider.displayName}.`,
    },
    header: {
      title: 'Review Receipt',
      merchantName: merchant,
      purchasedAt: receiptDate,
      grandTotal: total,
      currency: 'USD',
    },
    parsedData: {
      rawText: buildRawText(merchant, receiptDate, lineItems, total),
      fieldCandidates: [
        { label: 'Merchant', value: merchant, confidence: 0.96 },
        { label: 'Purchase date', value: receiptDate, confidence: 0.9 },
        { label: 'Grand total', value: `$${total.toFixed(2)}`, confidence: 0.88 },
      ],
      returnPolicySnippet,
      warrantySnippet,
    },
    lineItems,
    selectedLineItemId,
    evidenceSpans: buildEvidenceSpans(receiptId, lineItems, merchant, receiptDate, total),
    peopleSuggestions: buildPeopleSuggestions(merchant, lineItems),
    memorySuggestions: [
      {
            id: nextId('mem_candidate'),
            memoryState: 'candidate',
            suggestedTitle: buildMemoryTitle(merchant, lineItems),
          },
    ],
    structuredData: {
      merchantMatchStatus: 'suggested',
      merchantMatchConfidence: merchantProfile === 'known retailer' ? 0.95 : 0.85,
      thingCandidateCount,
      returnPolicyStatus: returnPolicySnippet ? 'candidate' : 'not_found',
      warrantyStatus: warrantySnippet ? 'candidate' : 'not_found',
      retailerProfile: merchantProfile,
      taxTags,
      lifestyleTags,
      productCategories,
      returnWindowLabel: thingCandidateCount ? 'Likely returnable purchase detected' : 'No notable returnability signal',
      warrantySupportLabel: thingCandidateCount ? 'Durable-goods warranty candidate detected' : 'No warranty signal detected',
    },
    searchDocument: {
      status: 'indexed',
      keywords: buildSearchKeywords(merchant, lineItems),
      textPreview: buildSearchPreview(merchant, lineItems),
    },
    alerts: buildAlerts({
      duplicateDetected,
      merchant,
      lineItems,
      merchantProfile,
      sourceDocument,
    }),
  };
}

export function getLiveReceiptStudioPayload(receiptId: string): ReceiptStudioLivePayload | null {
  const records = readStoredReceipts();
  const record = records.find((candidate) => candidate.id === receiptId);
  return record ? buildStudioPayload(record) : null;
}

export function listLiveReceiptCards(): StoredReceiptCard[] {
  return readStoredReceipts()
    .filter((record) => record.status !== 'trusted')
    .map((record) => ({
      id: record.id,
      merchantName: record.header.merchantName,
      purchasedAt: record.header.purchasedAt,
      grandTotal: record.header.grandTotal,
      currency: record.header.currency,
      lineItemCount: record.lineItems.length,
      status: record.status,
      note: record.note,
      tags: record.searchDocument.keywords.slice(0, 3),
      action: `route:/ingest/${record.id}`,
    }))
    .sort((left, right) => right.purchasedAt.localeCompare(left.purchasedAt));
}

export function listProjectedPurchaseReceipts(): ProjectedPurchaseReceiptRecord[] {
  const purchaseEvents = listProjectedPurchaseEvents();
  const purchaseLineItems = listProjectedPurchaseLineItems();

  return purchaseEvents
    .map((purchaseEvent) => buildProjectedPurchaseReceiptRecord(purchaseEvent, purchaseLineItems))
    .sort((left, right) => right.purchasedAt.localeCompare(left.purchasedAt));
}

export function listProjectedPurchaseEvents(): ProjectedPurchaseEventRecord[] {
  return readStoredReceipts()
    .filter((record) => record.status === 'trusted')
    .map((record) => buildProjectedPurchaseEventRecord(record))
    .sort((left, right) => right.purchasedAt.localeCompare(left.purchasedAt));
}

export function listProjectedPurchaseLineItems(): ProjectedPurchaseLineItemRecord[] {
  return readStoredReceipts()
    .filter((record) => record.status === 'trusted')
    .flatMap((record) => buildProjectedPurchaseLineItemRecords(record))
    .sort((left, right) => {
      if (left.purchasedAt && right.purchasedAt) {
        return right.purchasedAt.localeCompare(left.purchasedAt) || left.lineIndex - right.lineIndex;
      }

      return 0;
    });
}

export function listProjectedThings(): ProjectedThingRecord[] {
  return listProjectedPurchaseLineItems()
    .filter((item) => item.assetCandidateFlag && item.thingId)
    .map((item) => buildProjectedThingRecord(item))
    .sort((left, right) => right.acquiredAt.localeCompare(left.acquiredAt));
}

export function hasLiveReceipt(receiptId: string): boolean {
  return readStoredReceipts().some((record) => record.id === receiptId);
}

export function submitLiveReceiptReview(receiptId: string): ReceiptStudioLivePayload | null {
  const records = readStoredReceipts();
  const index = records.findIndex((record) => record.id === receiptId);

  if (index === -1) {
    return null;
  }

  const record = records[index];
  const now = new Date().toISOString();
  const nextRecord: StoredReceiptRecord = {
    ...record,
    updatedAt: now,
    status: 'trusted',
    note: `${record.header.merchantName} receipt is trusted and ready to feed Things, People, and Memories.`,
    extractionRun: {
      ...record.extractionRun,
      status: 'completed',
      completedAt: record.extractionRun.completedAt ?? now,
      stage: 'review_complete',
      stageLabel: 'Receipt review complete and structured purchase data saved.',
    },
    lineItems: record.lineItems.map((item) => ({
      ...item,
      reviewState: item.reviewState === 'needs_review' ? 'edited' : item.reviewState,
      productMatchStatus: item.assetCandidateFlag ? 'confirmed' : item.productMatchStatus,
      productMatchConfidence: item.assetCandidateFlag ? Math.max(item.productMatchConfidence, 0.86) : item.productMatchConfidence,
    })),
    structuredData: {
      ...record.structuredData,
      merchantMatchStatus: 'confirmed',
      merchantMatchConfidence: 0.97,
    },
  };
  nextRecord.purchaseProjection = buildPurchaseProjection(nextRecord, now);

  records[index] = nextRecord;
  writeStoredReceipts(records);

  return buildStudioPayload(nextRecord);
}

export function resetLiveReceiptStore() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(RECEIPT_STORE_KEY);
}

function readStoredReceipts(): StoredReceiptRecord[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const raw = window.localStorage.getItem(RECEIPT_STORE_KEY);
  const parsed = safeParseRecords(raw);
  const materialized = parsed.map((record) => materializeRecord(record));

  if (JSON.stringify(parsed) !== JSON.stringify(materialized)) {
    window.localStorage.setItem(RECEIPT_STORE_KEY, JSON.stringify(materialized));
  }

  return materialized;
}

function writeStoredReceipts(records: StoredReceiptRecord[]) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(RECEIPT_STORE_KEY, JSON.stringify(records));
}

function safeParseRecords(raw: string | null): StoredReceiptRecord[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredReceiptRecord[]) : [];
  } catch {
    return [];
  }
}

function materializeRecord(record: StoredReceiptRecord): StoredReceiptRecord {
  if (record.status !== 'processing') {
    if (record.status === 'trusted' && !record.purchaseProjection) {
      return {
        ...record,
        purchaseProjection: buildPurchaseProjection(record, record.updatedAt),
      };
    }

    return record;
  }

  const nowMs = Date.now();
  const createdAtMs = Date.parse(record.createdAt);
  const elapsed = Math.max(0, nowMs - createdAtMs);

  if (elapsed >= EXTRACTION_DELAY_MS) {
    return {
      ...record,
      updatedAt: new Date(nowMs).toISOString(),
      status: 'needs_review',
      note: `${record.header.merchantName} receipt is ready for line-item review and evidence-based correction.`,
      extractionRun: {
        ...record.extractionRun,
        status: 'completed',
        completedAt: new Date(createdAtMs + EXTRACTION_DELAY_MS).toISOString(),
        stage: 'ready_for_review',
        stageLabel: 'Extraction complete. Review line items and confirm the purchase graph.',
      },
    };
  }

  const fraction = elapsed / EXTRACTION_DELAY_MS;
  const nextStage =
    fraction < 0.34
      ? { stage: 'storing_source_document', label: 'Saving the original receipt as raw evidence.' }
      : fraction < 0.68
        ? { stage: 'extracting_text', label: 'Parsing text, header fields, and likely line items.' }
        : { stage: 'building_structure', label: 'Organizing parsed output into searchable purchase data.' };

  return {
    ...record,
    extractionRun: {
      ...record.extractionRun,
      status: 'processing',
      stage: nextStage.stage,
      stageLabel: nextStage.label,
    },
  };
}

function buildProjectedPurchaseEventRecord(record: StoredReceiptRecord): ProjectedPurchaseEventRecord {
  const purchaseProjection = record.purchaseProjection ?? buildPurchaseProjection(record, record.updatedAt);

  return {
    id: purchaseProjection.purchaseEventId,
    receiptId: record.id,
    sourceDocumentId: record.sourceDocument.id,
    merchantId: `merchant_${slugify(record.header.merchantName)}`,
    merchantName: record.header.merchantName,
    purchasedAt: record.header.purchasedAt,
    grandTotal: record.header.grandTotal,
    currency: record.header.currency,
    lineItemCount: record.lineItems.length,
    retailerProfile: record.structuredData.retailerProfile,
    merchantMatchStatus: record.structuredData.merchantMatchStatus,
    merchantMatchConfidence: record.structuredData.merchantMatchConfidence,
    taxTags: record.structuredData.taxTags,
    lifestyleTags: record.structuredData.lifestyleTags,
    productCategories: record.structuredData.productCategories,
    returnWindowEndsAt: inferReturnWindowEndsAt(record),
    thingCandidateCount: record.structuredData.thingCandidateCount,
    personIds: record.peopleSuggestions.map((person) => person.id),
    memorySuggestionIds: record.memorySuggestions.map((memory) => memory.id),
    searchKeywords: record.searchDocument.keywords,
    note: `${record.header.merchantName} receipt is trusted and now anchors structured purchase history.`,
  };
}

function buildProjectedPurchaseLineItemRecords(record: StoredReceiptRecord): ProjectedPurchaseLineItemRecord[] {
  const purchaseProjection = record.purchaseProjection ?? buildPurchaseProjection(record, record.updatedAt);
  const returnWindowEndsAt = inferReturnWindowEndsAt(record);
  const warrantyEndsAt = inferWarrantyEndsAt(record);

  return record.lineItems
    .map((item) => {
      const assetThingIndex = record.lineItems
        .filter((candidate) => candidate.assetCandidateFlag)
        .findIndex((candidate) => candidate.id === item.id);
      const thingId = item.assetCandidateFlag
        ? purchaseProjection.projectedThingIds[assetThingIndex] ?? buildProjectedThingId(record.id, item)
        : undefined;
      const classification = inferThingCategory(item, record);

      return {
        id: `pli_${record.id}_${item.lineIndex}`,
        purchaseEventId: purchaseProjection.purchaseEventId,
        receiptId: record.id,
        purchasedAt: record.header.purchasedAt,
        merchantName: record.header.merchantName,
        currency: record.header.currency,
        sourceLineItemId: item.id,
        lineIndex: item.lineIndex,
        description: item.descriptionNormalized,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
        reviewState: item.reviewState,
        confidenceScore: item.confidenceScore,
        assetCandidateFlag: item.assetCandidateFlag,
        productMatchStatus: item.productMatchStatus,
        productMatchConfidence: item.productMatchConfidence,
        householdTags: item.householdTags,
        lemTags: item.lemTags,
        category: classification.category,
        subcategory: classification.subcategory,
        returnable: Boolean(returnWindowEndsAt),
        warrantyEligible: Boolean(warrantyEndsAt && item.assetCandidateFlag),
        thingId,
        evidenceSpanIds: record.evidenceSpans.filter((span) => span.targetObjectId === item.id).map((span) => span.id),
        personIds: record.peopleSuggestions.map((person) => person.id),
      };
    });
}

function buildProjectedPurchaseReceiptRecord(
  purchaseEvent: ProjectedPurchaseEventRecord,
  purchaseLineItems: ProjectedPurchaseLineItemRecord[]
): ProjectedPurchaseReceiptRecord {
  const eventLineItems = purchaseLineItems.filter((item) => item.purchaseEventId === purchaseEvent.id);
  const durableLineItems = eventLineItems.filter((item) => item.assetCandidateFlag);

  return {
    id: purchaseEvent.receiptId,
    purchaseEventId: purchaseEvent.id,
    merchantName: purchaseEvent.merchantName,
    purchasedAt: purchaseEvent.purchasedAt,
    grandTotal: purchaseEvent.grandTotal,
    currency: purchaseEvent.currency,
    lineItemCount: purchaseEvent.lineItemCount,
    status: 'trusted',
    note: purchaseEvent.note,
    lineHighlights: eventLineItems.slice(0, 3).map((item) => item.description),
    category: durableLineItems[0]?.category ?? purchaseEvent.productCategories[0] ?? 'General merchandise',
    returnWindowEndsAt: purchaseEvent.returnWindowEndsAt,
    personIds: purchaseEvent.personIds,
    thingIds: durableLineItems.flatMap((item) => (item.thingId ? [item.thingId] : [])),
    memoryIds: [],
  };
}

function buildProjectedThingRecord(item: ProjectedPurchaseLineItemRecord): ProjectedThingRecord {
  const returnWindowEndsAt = item.returnable ? addDays(item.purchasedAt, inferReturnWindowDays(item.merchantName)) : undefined;
  const warrantyEndsAt = item.warrantyEligible ? addDays(item.purchasedAt, 365) : undefined;

  return {
    id: item.thingId ?? `thing_${slugify(`${item.receiptId}-${item.lineIndex}-${item.description}`)}`,
    purchaseEventId: item.purchaseEventId,
    displayName: item.description,
    category: item.category,
    subcategory: item.subcategory,
    status: inferThingStatus(item.purchasedAt),
    purchasePrice: item.lineTotal,
    currency: item.currency,
    acquiredAt: item.purchasedAt,
    merchantName: item.merchantName,
    receiptId: item.receiptId,
    notes: `${item.merchantName} line item trusted from receipt review and ready for ownership follow-up.`,
    warrantyEndsAt,
    returnWindowEndsAt,
    badgeLabels: buildThingBadges(returnWindowEndsAt, warrantyEndsAt, item.purchasedAt),
    personIds: item.personIds,
    memoryIds: [],
  };
}

function buildPurchaseProjection(record: StoredReceiptRecord, projectedAt: string) {
  return {
    projectedAt,
    purchaseEventId: `purchase_${record.id}`,
    projectedThingIds: record.lineItems
      .filter((item) => item.assetCandidateFlag)
      .map((item) => buildProjectedThingId(record.id, item)),
  };
}

function buildStudioPayload(record: StoredReceiptRecord): ReceiptStudioLivePayload {
  const allRecords = readStoredReceipts();
  const selectedEvidence = record.evidenceSpans.find((span) => span.targetObjectId === record.selectedLineItemId) ?? record.evidenceSpans[0] ?? null;
  const siblings = [record.id, ...record.captureSession.siblingReceiptIds]
    .map((receiptId) => allRecords.find((candidate) => candidate.id === receiptId))
    .filter(Boolean) as StoredReceiptRecord[];

  return {
    receipt: {
      id: record.id,
      status: record.status,
      sourceType: record.sourceDocument.sourceType,
      capturedAt: record.sourceDocument.capturedAt,
    },
    header: record.header,
    progress:
      record.status === 'processing'
        ? {
            stage: record.extractionRun.stage,
            label: record.extractionRun.stageLabel,
          }
        : null,
    lineItems: record.status === 'processing' ? [] : record.lineItems,
    selectedLineItemId: record.status === 'processing' ? null : record.selectedLineItemId,
    evidence: selectedEvidence
      ? {
          targetObjectType: selectedEvidence.targetObjectType,
          targetObjectId: selectedEvidence.targetObjectId,
          evidenceType: selectedEvidence.evidenceType,
          pageNumber: selectedEvidence.pageNumber,
          x: selectedEvidence.x,
          y: selectedEvidence.y,
          width: selectedEvidence.width,
          height: selectedEvidence.height,
          snippet: selectedEvidence.snippet,
        }
      : null,
    evidenceTrail:
      record.status === 'processing'
        ? []
        : record.evidenceSpans.map((span) => ({
            id: span.id,
            label: span.label,
            snippet: span.snippet,
            targetObjectId: span.targetObjectId,
          })),
    peopleSuggestions: record.status === 'processing' ? [] : record.peopleSuggestions,
    memorySuggestions: record.status === 'processing' ? [] : record.memorySuggestions,
    actions: {
      canSave: record.status !== 'processing',
      canConvertToThing: record.status !== 'processing' && record.lineItems.some((item) => item.assetCandidateFlag),
      canTagPeople: record.status !== 'processing',
      canAddToMemory: record.status !== 'processing',
    },
    captureSession: {
      id: record.captureSession.id,
      detectedReceiptCount: record.sourceDocument.detectedReceiptCount,
      siblings: siblings
        .sort((left, right) => left.header.purchasedAt.localeCompare(right.header.purchasedAt))
        .map((sibling) => ({
          id: sibling.id,
          merchantName: sibling.header.merchantName,
          status: sibling.status,
          action: `route:/ingest/${sibling.id}`,
        })),
    },
    sourceDocument: record.sourceDocument,
    extractionRun: record.extractionRun,
    parsedData: record.parsedData,
    structuredData: record.structuredData,
    searchDocument: record.searchDocument,
    alerts: record.status === 'processing' ? [] : record.alerts,
  };
}

function buildLineItems(
  receiptId: string,
  merchant: string,
  summary: string,
  itemCandidates?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    confidence: number;
  }>,
): ReceiptLineItemRecord[] {
  if (itemCandidates?.length) {
    return itemCandidates.slice(0, 6).map((item, index) => {
      const normalized = titleCase(item.description);
      const objectEntry = resolveObjectDirectoryEntry(normalized);
      const assetCandidateFlag = objectEntry?.thingCandidate ?? looksLikeThing(normalized);

      return {
        id: `${receiptId}_line_${index + 1}`,
        lineIndex: index + 1,
        descriptionRaw: normalized.toUpperCase(),
        descriptionNormalized: normalized,
        quantity: item.quantity || 1,
        unitPrice: roundCurrency(item.unitPrice || item.lineTotal || 0),
        lineTotal: roundCurrency(item.lineTotal || item.unitPrice || 0),
        reviewState: assetCandidateFlag ? 'needs_review' : 'auto',
        confidenceScore: coerceConfidenceScore(item.confidence),
        assetCandidateFlag,
        productMatchStatus: assetCandidateFlag ? 'suggested' : 'unmatched',
        productMatchConfidence: assetCandidateFlag ? 0.82 : 0.4,
        householdTags: objectEntry?.householdTags ?? inferHouseholdTags(normalized),
        lemTags: objectEntry?.lemTags ?? inferLemTags(normalized),
      };
    });
  }

  const phrases = summary
    .split(/[\n,.;]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 4);

  const fallbackLines = fallbackLineItemsForMerchant(merchant);
  const lineLabels = (phrases.length ? phrases : fallbackLines).slice(0, 4);

  return lineLabels.map((label, index) => {
    const normalized = titleCase(label);
    const assetCandidateFlag = looksLikeThing(normalized);
    const basePrice = 8.75 + index * 5.35 + normalized.length * 0.18;
    const price = roundCurrency(assetCandidateFlag ? basePrice + 24 : basePrice);

    return {
      id: `${receiptId}_line_${index + 1}`,
      lineIndex: index + 1,
      descriptionRaw: normalized.toUpperCase(),
      descriptionNormalized: normalized,
      quantity: 1,
      unitPrice: price,
      lineTotal: price,
      reviewState: index === 0 ? 'auto' : assetCandidateFlag ? 'needs_review' : 'auto',
      confidenceScore: index === 0 ? 0.95 : assetCandidateFlag ? 0.71 : 0.84,
      assetCandidateFlag,
      productMatchStatus: assetCandidateFlag ? 'suggested' : 'unmatched',
      productMatchConfidence: assetCandidateFlag ? 0.78 : 0.34,
      householdTags: inferHouseholdTags(normalized),
      lemTags: inferLemTags(normalized),
    };
  });
}

function buildEvidenceSpans(receiptId: string, lineItems: ReceiptLineItemRecord[], merchant: string, purchasedAt: string, total: number): EvidenceSpanRecord[] {
  const headerEvidence: EvidenceSpanRecord[] = [
    {
      id: `${receiptId}_evidence_merchant`,
      label: 'Merchant',
      targetObjectType: 'purchase_event',
      targetObjectId: receiptId,
      evidenceType: 'text_span',
      pageNumber: 1,
      snippet: merchant,
      x: null,
      y: null,
      width: null,
      height: null,
    },
    {
      id: `${receiptId}_evidence_date`,
      label: 'Purchase date',
      targetObjectType: 'purchase_event',
      targetObjectId: receiptId,
      evidenceType: 'text_span',
      pageNumber: 1,
      snippet: purchasedAt,
      x: null,
      y: null,
      width: null,
      height: null,
    },
    {
      id: `${receiptId}_evidence_total`,
      label: 'Grand total',
      targetObjectType: 'purchase_event',
      targetObjectId: receiptId,
      evidenceType: 'text_span',
      pageNumber: 1,
      snippet: `$${total.toFixed(2)}`,
      x: null,
      y: null,
      width: null,
      height: null,
    },
  ];

  const lineEvidence = lineItems.map((item, index) => ({
    id: `${receiptId}_evidence_line_${index + 1}`,
    label: `Line ${index + 1}`,
    targetObjectType: 'purchase_line_item' as const,
    targetObjectId: item.id,
    evidenceType: 'image_region' as const,
    pageNumber: 1,
    snippet: `${item.descriptionNormalized} ${item.lineTotal.toFixed(2)}`,
    x: 0.12,
    y: roundCoordinate(0.28 + index * 0.08),
    width: 0.74,
    height: 0.05,
  }));

  return [...headerEvidence, ...lineEvidence];
}

function buildPeopleSuggestions(merchant: string, lineItems: ReceiptLineItemRecord[]) {
  if (merchant.toLowerCase().includes('sports') || lineItems.some((item) => item.householdTags.includes('kids'))) {
    return [
      { id: 'person_coco', displayName: 'Coco', relationshipType: 'child' },
      { id: 'person_self', displayName: 'You', relationshipType: 'self' },
    ];
  }

  return [
    { id: 'person_self', displayName: 'You', relationshipType: 'self' },
    { id: 'person_shanshan', displayName: 'Shanshan', relationshipType: 'spouse' },
  ];
}

function buildMemoryTitle(merchant: string, lineItems: ReceiptLineItemRecord[]) {
  const strongestLine = lineItems.find((item) => item.assetCandidateFlag) ?? lineItems[0];
  return strongestLine ? `${merchant} trip for ${strongestLine.descriptionNormalized}` : `${merchant} receipt follow-up`;
}

function buildSearchKeywords(merchant: string, lineItems: ReceiptLineItemRecord[]) {
  const keywords = new Set<string>([merchant]);

  lineItems.forEach((item) => {
    keywords.add(item.descriptionNormalized);
    item.householdTags.forEach((tag) => keywords.add(tag.replace(/_/g, ' ')));
  });

  return Array.from(keywords).slice(0, 6);
}

function buildSearchPreview(merchant: string, lineItems: ReceiptLineItemRecord[]) {
  return `${merchant} receipt with ${lineItems.map((item) => item.descriptionNormalized).join(', ')}.`;
}

function buildReceiptDrafts(input: CreateReceiptInput, parserDrafts: Array<{
  merchant: string;
  purchaseDate: string;
  summary: string;
  itemCandidates?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    confidence: number;
  }>;
}>) {
  const baseDate = normalizePurchaseDate(input.purchaseDate, new Date().toISOString());
  const captureChannel = mapSourceToCaptureChannel(input.source);
  const lines = input.summary
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const explicitBatchLines = lines
    .map((line) => {
      const [merchantPart, ...summaryParts] = line.split(':');

      if (!summaryParts.length) {
        return null;
      }

      return {
        merchant: sanitizeMerchant(merchantPart),
        purchaseDate: baseDate,
        summary: summaryParts.join(':').trim(),
      };
    })
    .filter(Boolean) as Array<{ merchant: string; purchaseDate: string; summary: string }>;

  if (parserDrafts.length) {
    return parserDrafts;
  }

  if (explicitBatchLines.length >= 2) {
    return explicitBatchLines;
  }

  if (captureChannel === 'multi_receipt_photo' || captureChannel === 'video_capture' || captureChannel === 'email_forward') {
    return defaultBatchDrafts(captureChannel, baseDate);
  }

  return [
    {
      merchant: sanitizeMerchant(input.merchant),
      purchaseDate: baseDate,
      summary: input.summary,
    },
  ];
}

function defaultBatchDrafts(captureChannel: CaptureChannel, purchaseDate: string) {
  switch (captureChannel) {
    case 'email_forward':
      return [
        { merchant: 'Apple Store', purchaseDate, summary: 'AirPods Pro, charging case' },
        { merchant: 'Nopa', purchaseDate, summary: 'Dinner for 2, drinks' },
      ];
    case 'video_capture':
      return [
        { merchant: 'Trader Joe\'s', purchaseDate, summary: 'Organic whole milk, greek yogurt, bananas' },
        { merchant: 'IKEA', purchaseDate, summary: 'Storage bench, wall hooks' },
        { merchant: 'Sports Basement', purchaseDate, summary: 'Tournament cleats, shin guards, socks' },
      ];
    case 'multi_receipt_photo':
    default:
      return [
        { merchant: 'Trader Joe\'s', purchaseDate, summary: 'Organic whole milk, greek yogurt, produce bag' },
        { merchant: 'Target', purchaseDate, summary: 'Air fryer, parchment liners' },
        { merchant: 'CVS', purchaseDate, summary: 'Pain reliever, toothpaste' },
      ];
  }
}

function buildAlerts(params: {
  duplicateDetected: boolean;
  merchant: string;
  lineItems: ReceiptLineItemRecord[];
  merchantProfile: string;
  sourceDocument: StoredSourceDocument;
}) {
  const alerts: StoredReceiptRecord['alerts'] = [];

  if (params.duplicateDetected) {
    alerts.push({
      id: nextId('alert_dup'),
      kind: 'duplicate',
      level: 'issue',
      title: 'Possible duplicate receipt',
      body: `We found a recent ${params.merchant} receipt with a similar total. Review only if this looks like the same purchase.`,
    });
  }

  if (params.lineItems.some((item) => item.reviewState === 'needs_review')) {
    alerts.push({
      id: nextId('alert_review'),
      kind: 'needs_review',
      level: 'issue',
      title: 'Line item review suggested',
      body: 'At least one durable or ambiguous line item should be checked before we finalize Things and warranty support.',
    });
  }

  if (params.merchantProfile === 'known retailer') {
    alerts.push({
      id: nextId('alert_library'),
      kind: 'library_lookup',
      level: 'info',
      title: 'Retailer enrichment applied',
      body: `Shared retailer knowledge was applied for ${params.merchant} to improve category, returnability, and warranty hints.`,
    });
  }

  if (params.sourceDocument.detectedReceiptCount > 1) {
    alerts.push({
      id: nextId('alert_batch'),
      kind: 'library_lookup',
      level: 'info',
      title: 'Multi-receipt upload split automatically',
      body: `This source produced ${params.sourceDocument.detectedReceiptCount} receipts and each is being processed independently.`,
    });
  }

  return alerts;
}

function detectPossibleDuplicate(records: StoredReceiptRecord[], merchant: string, purchasedAt: string, total: number) {
  return records.some((record) => {
    const sameMerchant = record.header.merchantName.toLowerCase() === merchant.toLowerCase();
    const sameDay = record.header.purchasedAt.slice(0, 10) === purchasedAt.slice(0, 10);
    const totalDelta = Math.abs(record.header.grandTotal - total);

    return sameMerchant && sameDay && totalDelta < 3;
  });
}

function buildRetailerProfile(merchant: string) {
  return resolveMerchantDirectoryEntry(merchant)?.retailerProfile ?? 'new retailer';
}

function buildTaxTags(lineItems: ReceiptLineItemRecord[], merchant: string) {
  const tags = new Set<string>();

  if (/(cvs|walgreens|pharmacy)/i.test(merchant)) {
    tags.add('medical');
  }

  if (lineItems.some((item) => item.householdTags.includes('kids'))) {
    tags.add('family');
  }

  if (lineItems.some((item) => item.householdTags.includes('groceries'))) {
    tags.add('household consumables');
  }

  return Array.from(tags);
}

function buildLifestyleTags(lineItems: ReceiptLineItemRecord[], merchant: string) {
  const tags = new Set<string>();
  const merchantEntry = resolveMerchantDirectoryEntry(merchant);

  if (merchantEntry?.kind === 'service_provider') {
    tags.add('home setup');
  }

  if (/(sports)/i.test(merchant) || lineItems.some((item) => /cleat|shin|sock/i.test(item.descriptionNormalized))) {
    tags.add('sports');
  }

  if (lineItems.some((item) => item.householdTags.includes('groceries'))) {
    tags.add('food at home');
  }

  if (lineItems.some((item) => item.householdTags.includes('home'))) {
    tags.add('home setup');
  }

  return Array.from(tags);
}

function buildProductCategories(lineItems: ReceiptLineItemRecord[]) {
  const categories = new Set<string>();

  lineItems.forEach((item) => {
    const objectEntry = resolveObjectDirectoryEntry(item.descriptionNormalized);

    if (objectEntry) {
      categories.add(objectEntry.category);
    }

    if (item.householdTags.includes('groceries')) {
      categories.add('Groceries');
    }
    if (item.householdTags.includes('home')) {
      categories.add('Home');
    }
    if (item.householdTags.includes('kids')) {
      categories.add('Kids');
    }
    if (item.assetCandidateFlag && !categories.size) {
      categories.add('Durable goods');
    }
  });

  return categories.size ? Array.from(categories) : ['General merchandise'];
}

function inferThingCategory(item: ReceiptLineItemRecord, record: StoredReceiptRecord) {
  const objectEntry = resolveObjectDirectoryEntry(item.descriptionNormalized);

  if (objectEntry?.thingCandidate) {
    return { category: objectEntry.category, subcategory: objectEntry.subcategory };
  }

  if (/(air fryer|mixer|blender|bowl|pan|kitchen)/i.test(item.descriptionNormalized)) {
    return { category: 'Kitchen', subcategory: 'Appliance' };
  }

  if (/(airpods|headphones|earbuds|charger|phone|laptop|apple)/i.test(item.descriptionNormalized) || /apple/i.test(record.header.merchantName)) {
    return { category: 'Tech', subcategory: 'Audio' };
  }

  if (/(cleat|shin guard|sock|sports)/i.test(item.descriptionNormalized)) {
    return { category: 'Kids', subcategory: 'Sports' };
  }

  if (/(bench|storage|hook|shelf|lamp)/i.test(item.descriptionNormalized)) {
    return { category: 'Home', subcategory: 'Furniture' };
  }

  if (/(vacuum|appliance)/i.test(item.descriptionNormalized)) {
    return { category: 'Home', subcategory: 'Appliance' };
  }

  const fallbackCategory = record.structuredData.productCategories[0] ?? 'Durable goods';
  return { category: fallbackCategory, subcategory: 'General' };
}

function inferThingStatus(purchasedAt: string): 'recent' | 'active' {
  const ageMs = Math.max(0, Date.now() - Date.parse(purchasedAt));
  return ageMs <= 1000 * 60 * 60 * 24 * 45 ? 'recent' : 'active';
}

function inferReturnWindowEndsAt(record: StoredReceiptRecord) {
  if (record.structuredData.returnPolicyStatus !== 'candidate') {
    return undefined;
  }

  return addDays(record.header.purchasedAt, inferReturnWindowDays(record.header.merchantName));
}

function inferWarrantyEndsAt(record: StoredReceiptRecord) {
  if (record.structuredData.warrantyStatus !== 'candidate') {
    return undefined;
  }

  return addDays(record.header.purchasedAt, 365);
}

function inferReturnWindowDays(merchant: string) {
  if (/apple/i.test(merchant)) {
    return 14;
  }

  if (/costco/i.test(merchant)) {
    return 90;
  }

  return 30;
}

function buildThingBadges(returnWindowEndsAt: string | undefined, warrantyEndsAt: string | undefined, acquiredAt: string) {
  const badges = new Set<string>();

  if (inferThingStatus(acquiredAt) === 'recent') {
    badges.add('Recently added');
  }

  if (returnWindowEndsAt && Date.parse(returnWindowEndsAt) > Date.now()) {
    badges.add('Return window open');
  }

  if (warrantyEndsAt) {
    badges.add('Warranty active');
  }

  badges.add('From receipt review');

  return Array.from(badges);
}

function buildProjectedThingId(receiptId: string, item: ReceiptLineItemRecord) {
  return `thing_${slugify(`${receiptId}-${item.lineIndex}-${item.descriptionNormalized}`)}`;
}

function addDays(isoDate: string, days: number) {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

function buildRawText(merchant: string, purchasedAt: string, lineItems: ReceiptLineItemRecord[], total: number) {
  const lines = lineItems.map((item) => `${item.descriptionRaw} ${item.lineTotal.toFixed(2)}`).join('\n');
  return `${merchant}\n${purchasedAt}\n${lines}\nTOTAL ${total.toFixed(2)}`;
}

function sanitizeMerchant(value: string) {
  return titleCase(value.trim() || 'New Receipt');
}

function normalizePurchaseDate(value: string, fallbackIso: string) {
  if (!value) {
    return fallbackIso;
  }

  const normalized = new Date(value);

  if (Number.isNaN(normalized.getTime())) {
    return fallbackIso;
  }

  return normalized.toISOString();
}

function mapSourceToDocumentType(source: string): SourceDocumentType {
  return source.toLowerCase().includes('pdf') ? 'receipt_pdf' : 'receipt_image';
}

function mapSourceToCaptureChannel(source: string): CaptureChannel {
  const normalized = source.toLowerCase();

  if (normalized.includes('multi')) {
    return 'multi_receipt_photo';
  }

  if (normalized.includes('video')) {
    return 'video_capture';
  }

  if (normalized.includes('email')) {
    return 'email_forward';
  }

  if (normalized.includes('pdf')) {
    return 'upload_pdf';
  }

  if (normalized.includes('snap') || normalized.includes('take photo')) {
    return 'quick_snap';
  }

  return 'upload_photo';
}

function looksLikeThing(value: string) {
  return /(bench|storage|air fryer|cleats|vacuum|mixer|chair|lamp|shelf|headphones|appliance)/i.test(value);
}

function inferHouseholdTags(value: string) {
  const objectEntry = resolveObjectDirectoryEntry(value);

  if (objectEntry) {
    return objectEntry.householdTags;
  }

  if (/(milk|yogurt|bread|produce|grocery|fruit|vegetable)/i.test(value)) {
    return ['groceries', 'food_at_home'];
  }

  if (/(sock|cleat|shin|kids|toy|school)/i.test(value)) {
    return ['kids', 'shared_household'];
  }

  if (/(bench|storage|hook|lamp|shelf|home)/i.test(value)) {
    return ['home', 'organization'];
  }

  return ['household'];
}

function inferLemTags(value: string) {
  const objectEntry = resolveObjectDirectoryEntry(value);

  if (objectEntry) {
    return objectEntry.lemTags;
  }

  if (/(milk|yogurt|bread|produce|grocery|fruit|vegetable)/i.test(value)) {
    return ['nourishment', 'routine'];
  }

  if (/(bench|storage|hook|lamp|shelf|home)/i.test(value)) {
    return ['continuity', 'home'];
  }

  if (/(cleat|sock|sports|bag)/i.test(value)) {
    return ['belonging', 'growth'];
  }

  return ['continuity'];
}

function fallbackLineItemsForMerchant(merchant: string) {
  if (/sports/i.test(merchant)) {
    return ['Tournament cleats', 'Shin guards', 'Team socks'];
  }

  if (/ikea|home/i.test(merchant)) {
    return ['Storage bench', 'Wall hooks', 'Entry tray'];
  }

  if (/whole foods|trader joe|grocery/i.test(merchant)) {
    return ['Organic whole milk', 'Greek yogurt', 'Produce bag'];
  }

  return ['Primary purchase', 'Supporting item', 'Checkout adjustment'];
}

function titleCase(value: string) {
  return value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'receipt';
}

function nextId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

function buildChecksum(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return `chk_${Math.abs(hash).toString(16)}`;
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function roundCoordinate(value: number) {
  return Math.round(value * 100) / 100;
}

function coerceConfidenceScore(value: number) {
  if (!Number.isFinite(value)) {
    return 0.6;
  }

  return Math.max(0.3, Math.min(0.99, value));
}
