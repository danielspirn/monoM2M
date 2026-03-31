import { parseReceiptCaptureInput } from './receiptParser';
import { listMerchantDirectoryEntries, resolveMerchantDirectoryEntry } from './catalog/merchantDirectory';
import { listObjectDirectoryEntries, resolveObjectDirectoryEntry } from './catalog/objectDirectory';
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
  id: string;
  label: string;
  value: string;
  confidence: number;
  source: 'ocr' | 'derived';
  evidenceSpanId: string | null;
};

type ParsedLineItemCandidate = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  confidence: number;
  source: 'ocr' | 'summary_fallback';
  thingCandidateHint: boolean;
  evidenceSpanId: string | null;
};

type ParsedRequestProvenance = {
  parserMode: string;
  parserVersion: string;
  processingNote: string;
  sourceDocumentId: string;
  sourceDocumentChecksum: string;
  sourceFileCount: number;
  captureChannel: CaptureChannel;
};

type ParsedProviderTrace = {
  providerId: ReceiptOcrProviderId;
  providerLabel: string;
  routingMode: ReceiptOcrRoutingMode;
  evaluationStage: ReceiptOcrEvaluationStage;
  fallbackProviderLabel: string | null;
};

type StoredParsedData = {
  rawText: string;
  fieldCandidates: ParsedFieldCandidate[];
  lineItemCandidates: ParsedLineItemCandidate[];
  requestProvenance: ParsedRequestProvenance;
  providerTrace: ParsedProviderTrace;
  returnPolicySnippet: string | null;
  warrantySnippet: string | null;
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

type DuplicateCandidateRecord = {
  id: string;
  matchedReceiptId: string;
  matchedMerchantName: string;
  matchedPurchasedAt: string;
  matchedGrandTotal: number;
  matchedStatus: ReceiptWorkflowStatus;
  totalDelta: number;
  confidenceScore: number;
  note: string;
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
  parsedData: StoredParsedData;
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
  duplicateCandidates: DuplicateCandidateRecord[];
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
    embeddingTerms: string[];
    embeddingVersion: string;
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
  purchaseGraph?: StoredPurchaseGraphRecords;
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
  duplicateCandidates: Array<DuplicateCandidateRecord & { action: string }>;
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

export type LiveDuplicateCandidateRecord = {
  receiptId: string;
  merchantName: string;
  purchasedAt: string;
  grandTotal: number;
  candidateReceiptId: string;
  candidateMerchantName: string;
  candidatePurchasedAt: string;
  candidateGrandTotal: number;
  candidateStatus: ReceiptWorkflowStatus;
  totalDelta: number;
  confidenceScore: number;
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

export type ProjectedSourceDocumentRecord = {
  id: string;
  receiptId: string;
  purchaseEventId: string;
  sourceType: SourceDocumentType;
  captureChannel: CaptureChannel;
  fileName: string;
  fileCount: number;
  mimeType: string;
  capturedAt: string;
  checksum: string;
  storageStatus: 'stored';
  detectedReceiptCount: number;
  note: string;
};

export type ProjectedExtractionRunRecord = {
  id: string;
  receiptId: string;
  purchaseEventId: string;
  sourceDocumentId: string;
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
  note: string;
};

export type ProjectedPurchaseEventRecord = {
  id: string;
  receiptId: string;
  sourceDocumentId: string;
  merchantId: string;
  merchantDirectoryId: string;
  merchantName: string;
  purchasedAt: string;
  grandTotal: number;
  currency: string;
  lineItemCount: number;
  retailerProfile: string;
  merchantMatchStatus: 'suggested' | 'confirmed';
  merchantMatchConfidence: number;
  merchantResolutionSource: 'directory_match' | 'reviewed_receipt';
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

export type ProjectedMerchantRecord = {
  id: string;
  merchantId: string;
  merchantDirectoryId: string | null;
  displayName: string;
  kind: 'retailer' | 'service_provider' | 'restaurant' | 'marketplace' | 'unknown';
  retailerProfile: string;
  aliases: string[];
  purchaseCount: number;
  trustedSpendTotal: number;
  latestPurchaseAt: string;
  latestPurchaseEventId: string;
  defaultReturnWindowDays?: number;
  defaultProductCategories: string[];
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
  productCandidateKey: string;
  productCandidateLabel: string;
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

export type ProjectedPurchaseParticipantRecord = {
  id: string;
  purchaseEventId: string;
  receiptId: string;
  personId: string;
  displayName: string;
  relationshipType: string;
  participationRole: 'self' | 'household_member' | 'shared_context';
  linkedLineItemCount: number;
  linkedThingCount: number;
  linkedMemoryCount: number;
  spendShare: number;
  confidenceScore: number;
  note: string;
};

export type ProjectedProductRecord = {
  id: string;
  purchaseEventId: string;
  receiptId: string;
  sourceLineItemId: string;
  purchasedAt: string;
  merchantName: string;
  currency: string;
  displayName: string;
  canonicalLabel: string;
  category: string;
  subcategory: string;
  matchStatus: 'suggested' | 'confirmed' | 'unmatched';
  matchConfidence: number;
  thingCandidate: boolean;
  linkedThingId?: string;
  lineTotal: number;
  householdTags: string[];
  lemTags: string[];
  evidenceSpanIds: string[];
  personIds: string[];
  note: string;
};

export type ProjectedObjectRecord = {
  id: string;
  objectDirectoryId: string | null;
  displayName: string;
  category: string;
  subcategory: string;
  householdTags: string[];
  lemTags: string[];
  keywords: string[];
  thingCandidate: boolean;
  purchaseCount: number;
  trustedSpendTotal: number;
  latestPurchaseAt: string;
  linkedThingIds: string[];
  linkedProductIds: string[];
};

export type ProjectedTagRecord = {
  id: string;
  framework: 'tax' | 'lifestyle' | 'product_category' | 'household' | 'lem' | 'vendor_context';
  label: string;
  normalizedLabel: string;
  receiptIds: string[];
  purchaseEventIds: string[];
  linkedThingIds: string[];
  linkedProductIds: string[];
  linkedObjectIds: string[];
  trustedSpendTotal: number;
  note: string;
};

export type ProjectedThingRecord = {
  id: string;
  purchaseEventId: string;
  sourceDocumentId: string;
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
  supportLabels: string[];
  linkedDocumentCount: number;
  personIds: string[];
  memoryIds: string[];
};

export type ProjectedMemoryRecord = {
  id: string;
  purchaseEventId: string;
  receiptId: string;
  title: string;
  suggestedTitle?: string;
  memoryState: 'candidate';
  memoryType: string;
  significance: 'high' | 'medium' | 'light';
  startsAt: string;
  endsAt?: string;
  placeLabel: string;
  summary: string;
  notes: string;
  receiptIds: string[];
  personIds: string[];
  thingIds: string[];
};

export type ProjectedLocationRecord = {
  id: string;
  receiptId: string;
  purchaseEventId: string;
  label: string;
  normalizedLabel: string;
  locationKind: 'merchant_place' | 'home' | 'service_context';
  linkedThingIds: string[];
  linkedMemoryIds: string[];
  linkedPersonIds: string[];
  note: string;
};

export type ProjectedWarrantyRecord = {
  id: string;
  thingId: string;
  purchaseEventId: string;
  receiptId: string;
  providerName: string;
  coverageType: 'manufacturer' | 'merchant_stub';
  startsAt: string;
  endsAt: string;
  status: 'active' | 'candidate';
  source: 'receipt_candidate';
  note: string;
};

export type ProjectedReturnSupportRecord = {
  id: string;
  thingId: string;
  purchaseEventId: string;
  receiptId: string;
  merchantName: string;
  startsAt: string;
  windowEndsAt: string;
  status: 'open' | 'closed';
  policyLabel: string;
  source: 'receipt_candidate';
  note: string;
};

export type ProjectedPolicyRecord = {
  id: string;
  thingId: string;
  purchaseEventId: string;
  receiptId: string;
  policyKind: 'return' | 'warranty';
  title: string;
  providerName: string;
  status: 'candidate' | 'active' | 'open' | 'closed';
  effectiveAt: string;
  endsAt: string;
  source: 'receipt_candidate';
  linkedSupportRecordId: string;
  note: string;
};

export type ProjectedEvidenceRecord = {
  id: string;
  receiptId: string;
  purchaseEventId: string;
  targetObjectType: 'purchase_event' | 'purchase_line_item';
  targetRecordId: string;
  label: string;
  evidenceType: 'image_region' | 'text_span';
  pageNumber: number | null;
  snippet: string;
  linkedThingIds: string[];
  note: string;
};

export type ProjectedThingDocumentRecord = {
  id: string;
  thingId: string;
  receiptId: string;
  sourceDocumentId: string;
  title: string;
  documentRole: 'receipt' | 'warranty_stub';
  documentType: SourceDocumentType;
};

export type ProjectedDocumentLinkRecord = {
  id: string;
  sourceDocumentId: string;
  receiptId: string;
  purchaseEventId: string;
  targetObjectType: 'purchase_event' | 'thing' | 'warranty' | 'memory';
  targetObjectId: string;
  targetLabel: string;
  documentRole: 'source_document' | 'receipt' | 'warranty_stub';
  note: string;
};

export type ProjectedSemanticRecord = {
  id: string;
  receiptId: string;
  purchaseEventId: string;
  sourceDocumentId: string;
  merchantName: string;
  purchasedAt: string;
  retrievalScope: 'trusted_receipt';
  textPreview: string;
  keywords: string[];
  embeddingTerms: string[];
  embeddingVersion: string;
  lineHighlights: string[];
  thingIds: string[];
  memoryIds: string[];
  personIds: string[];
  note: string;
};

export type SemanticReceiptSearchResult = {
  receiptId: string;
  purchaseEventId: string;
  merchantName: string;
  purchasedAt: string;
  matchedTerms: string[];
  score: number;
  lineHighlights: string[];
};

export type GroundedReceiptAnswer = {
  query: string;
  scope: 'trusted_receipts_only';
  matchedReceiptCount: number;
  summary: string;
  citations: Array<{
    type: 'receipt' | 'thing' | 'person' | 'evidence';
    id: string;
    label: string;
    action: string;
    snippet?: string;
  }>;
  structuredResults: Array<{
    id: string;
    kind: 'receipt' | 'thing';
    title: string;
    body: string;
    actionLabel: string;
    action: string;
    chips: string[];
  }>;
  suggestedFollowUps: string[];
};

type StoredPurchaseGraphRecords = {
  savedAt: string;
  sourceDocumentRecord: ProjectedSourceDocumentRecord;
  extractionRunRecord: ProjectedExtractionRunRecord;
  merchantRecord: ProjectedMerchantRecord;
  purchaseEvent: ProjectedPurchaseEventRecord;
  purchaseLineItems: ProjectedPurchaseLineItemRecord[];
  participantRecords: ProjectedPurchaseParticipantRecord[];
  productRecords: ProjectedProductRecord[];
  objectRecords: ProjectedObjectRecord[];
  tagRecords: ProjectedTagRecord[];
  thingRecords: ProjectedThingRecord[];
  memoryRecords: ProjectedMemoryRecord[];
  locationRecords: ProjectedLocationRecord[];
  warrantyRecords: ProjectedWarrantyRecord[];
  returnSupportRecords: ProjectedReturnSupportRecord[];
  policyRecords: ProjectedPolicyRecord[];
  evidenceRecords: ProjectedEvidenceRecord[];
  documentRecords: ProjectedThingDocumentRecord[];
  documentLinkRecords: ProjectedDocumentLinkRecord[];
  semanticRecord: ProjectedSemanticRecord;
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
  const duplicateCandidates = buildDuplicateCandidates(existingRecords, merchant, receiptDate, total);
  const merchantProfile = buildRetailerProfile(merchant);
  const taxTags = buildTaxTags(lineItems, merchant);
  const lifestyleTags = buildLifestyleTags(lineItems, merchant);
  const productCategories = buildProductCategories(lineItems);
  const thingCandidateCount = lineItems.filter((item) => item.assetCandidateFlag).length;
  const evidenceSpans = buildEvidenceSpans(receiptId, lineItems, merchant, receiptDate, total);
  const parsedData = buildParsedData({
    draft,
    evidenceSpans,
    lineItems,
    merchant,
    parserResult,
    receiptDate,
    receiptId,
    sourceDocument,
    total,
  });

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
      ...parsedData,
      returnPolicySnippet,
      warrantySnippet,
    },
    lineItems,
    selectedLineItemId,
    evidenceSpans,
    peopleSuggestions: buildPeopleSuggestions(merchant, lineItems),
    memorySuggestions: [
      {
            id: nextId('mem_candidate'),
            memoryState: 'candidate',
            suggestedTitle: buildMemoryTitle(merchant, lineItems),
          },
    ],
    duplicateCandidates,
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
      embeddingTerms: buildEmbeddingTerms(merchant, lineItems),
      embeddingVersion: 'receipt-embedding-v1',
    },
    alerts: buildAlerts({
      duplicateCandidates,
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

export function listLiveDuplicateCandidates(): LiveDuplicateCandidateRecord[] {
  return readStoredReceipts()
    .flatMap((record) =>
      record.duplicateCandidates.map((candidate) => ({
        receiptId: record.id,
        merchantName: record.header.merchantName,
        purchasedAt: record.header.purchasedAt,
        grandTotal: record.header.grandTotal,
        candidateReceiptId: candidate.matchedReceiptId,
        candidateMerchantName: candidate.matchedMerchantName,
        candidatePurchasedAt: candidate.matchedPurchasedAt,
        candidateGrandTotal: candidate.matchedGrandTotal,
        candidateStatus: candidate.matchedStatus,
        totalDelta: candidate.totalDelta,
        confidenceScore: candidate.confidenceScore,
      })),
    )
    .sort((left, right) =>
      right.confidenceScore - left.confidenceScore
      || left.receiptId.localeCompare(right.receiptId),
    );
}

export function listProjectedPurchaseReceipts(): ProjectedPurchaseReceiptRecord[] {
  return readStoredReceipts()
    .filter((record) => record.status === 'trusted')
    .map((record) => {
      const graph = getStoredPurchaseGraph(record);
      return buildProjectedPurchaseReceiptRecord(graph.purchaseEvent, graph.purchaseLineItems, graph.memoryRecords);
    })
    .sort((left, right) => right.purchasedAt.localeCompare(left.purchasedAt));
}

export function listProjectedSourceDocuments(): ProjectedSourceDocumentRecord[] {
  return readStoredReceipts()
    .filter((record) => record.status === 'trusted')
    .map((record) => getStoredPurchaseGraph(record).sourceDocumentRecord)
    .sort((left, right) => right.capturedAt.localeCompare(left.capturedAt));
}

export function listProjectedExtractionRuns(): ProjectedExtractionRunRecord[] {
  return readStoredReceipts()
    .filter((record) => record.status === 'trusted')
    .map((record) => getStoredPurchaseGraph(record).extractionRunRecord)
    .sort((left, right) => right.startedAt.localeCompare(left.startedAt));
}

export function listProjectedPurchaseEvents(): ProjectedPurchaseEventRecord[] {
  return readStoredReceipts()
    .filter((record) => record.status === 'trusted')
    .map((record) => getStoredPurchaseGraph(record).purchaseEvent)
    .sort((left, right) => right.purchasedAt.localeCompare(left.purchasedAt));
}

export function listProjectedPurchaseParticipants(): ProjectedPurchaseParticipantRecord[] {
  return readStoredReceipts()
    .filter((record) => record.status === 'trusted')
    .flatMap((record) => getStoredPurchaseGraph(record).participantRecords)
    .sort((left, right) =>
      right.purchaseEventId.localeCompare(left.purchaseEventId)
      || left.displayName.localeCompare(right.displayName),
    );
}

export function listProjectedMerchants(): ProjectedMerchantRecord[] {
  const merchantMap = new Map<string, ProjectedMerchantRecord>();

  readStoredReceipts()
    .filter((record) => record.status === 'trusted')
    .forEach((record) => {
      const graph = getStoredPurchaseGraph(record);
      const merchant = graph.merchantRecord;
      const existing = merchantMap.get(merchant.id);

      if (!existing) {
        merchantMap.set(merchant.id, merchant);
        return;
      }

      const isNewer = merchant.latestPurchaseAt > existing.latestPurchaseAt;
      merchantMap.set(merchant.id, {
        ...existing,
        aliases: Array.from(new Set([...existing.aliases, ...merchant.aliases])),
        purchaseCount: existing.purchaseCount + merchant.purchaseCount,
        trustedSpendTotal: roundCurrency(existing.trustedSpendTotal + merchant.trustedSpendTotal),
        latestPurchaseAt: isNewer ? merchant.latestPurchaseAt : existing.latestPurchaseAt,
        latestPurchaseEventId: isNewer ? merchant.latestPurchaseEventId : existing.latestPurchaseEventId,
        defaultProductCategories: Array.from(new Set([...existing.defaultProductCategories, ...merchant.defaultProductCategories])),
      });
    });

  return Array.from(merchantMap.values()).sort((left, right) =>
    right.latestPurchaseAt.localeCompare(left.latestPurchaseAt) || right.trustedSpendTotal - left.trustedSpendTotal,
  );
}

export function listProjectedPurchaseLineItems(): ProjectedPurchaseLineItemRecord[] {
  return readStoredReceipts()
    .filter((record) => record.status === 'trusted')
    .flatMap((record) => getStoredPurchaseGraph(record).purchaseLineItems)
    .sort((left, right) => {
      if (left.purchasedAt && right.purchasedAt) {
        return right.purchasedAt.localeCompare(left.purchasedAt) || left.lineIndex - right.lineIndex;
      }

      return 0;
    });
}

export function listProjectedProducts(): ProjectedProductRecord[] {
  return readStoredReceipts()
    .filter((record) => record.status === 'trusted')
    .flatMap((record) => getStoredPurchaseGraph(record).productRecords)
    .sort((left, right) => right.purchasedAt.localeCompare(left.purchasedAt) || left.displayName.localeCompare(right.displayName));
}

export function listProjectedObjects(): ProjectedObjectRecord[] {
  const objectMap = new Map<string, ProjectedObjectRecord>();

  readStoredReceipts()
    .filter((record) => record.status === 'trusted')
    .forEach((record) => {
      getStoredPurchaseGraph(record).objectRecords.forEach((objectRecord) => {
        const existing = objectMap.get(objectRecord.id);

        if (!existing) {
          objectMap.set(objectRecord.id, objectRecord);
          return;
        }

        objectMap.set(objectRecord.id, {
          ...existing,
          householdTags: Array.from(new Set([...existing.householdTags, ...objectRecord.householdTags])),
          lemTags: Array.from(new Set([...existing.lemTags, ...objectRecord.lemTags])),
          keywords: Array.from(new Set([...existing.keywords, ...objectRecord.keywords])),
          purchaseCount: existing.purchaseCount + objectRecord.purchaseCount,
          trustedSpendTotal: roundCurrency(existing.trustedSpendTotal + objectRecord.trustedSpendTotal),
          latestPurchaseAt: objectRecord.latestPurchaseAt > existing.latestPurchaseAt ? objectRecord.latestPurchaseAt : existing.latestPurchaseAt,
          linkedThingIds: Array.from(new Set([...existing.linkedThingIds, ...objectRecord.linkedThingIds])),
          linkedProductIds: Array.from(new Set([...existing.linkedProductIds, ...objectRecord.linkedProductIds])),
        });
      });
    });

  return Array.from(objectMap.values()).sort((left, right) =>
    right.latestPurchaseAt.localeCompare(left.latestPurchaseAt) || right.trustedSpendTotal - left.trustedSpendTotal,
  );
}

export function listProjectedTags(): ProjectedTagRecord[] {
  const tagMap = new Map<string, ProjectedTagRecord>();

  readStoredReceipts()
    .filter((record) => record.status === 'trusted')
    .forEach((record) => {
      getStoredPurchaseGraph(record).tagRecords.forEach((tagRecord) => {
        const existing = tagMap.get(tagRecord.id);

        if (!existing) {
          tagMap.set(tagRecord.id, tagRecord);
          return;
        }

        tagMap.set(tagRecord.id, {
          ...existing,
          receiptIds: Array.from(new Set([...existing.receiptIds, ...tagRecord.receiptIds])),
          purchaseEventIds: Array.from(new Set([...existing.purchaseEventIds, ...tagRecord.purchaseEventIds])),
          linkedThingIds: Array.from(new Set([...existing.linkedThingIds, ...tagRecord.linkedThingIds])),
          linkedProductIds: Array.from(new Set([...existing.linkedProductIds, ...tagRecord.linkedProductIds])),
          linkedObjectIds: Array.from(new Set([...existing.linkedObjectIds, ...tagRecord.linkedObjectIds])),
          trustedSpendTotal: roundCurrency(existing.trustedSpendTotal + tagRecord.trustedSpendTotal),
        });
      });
    });

  return Array.from(tagMap.values()).sort((left, right) =>
    right.trustedSpendTotal - left.trustedSpendTotal
    || left.framework.localeCompare(right.framework)
    || left.label.localeCompare(right.label),
  );
}

export function listProjectedWarranties(): ProjectedWarrantyRecord[] {
  return readStoredReceipts()
    .filter((record) => record.status === 'trusted')
    .flatMap((record) => getStoredPurchaseGraph(record).warrantyRecords)
    .sort((left, right) => right.endsAt.localeCompare(left.endsAt));
}

export function listProjectedLocations(): ProjectedLocationRecord[] {
  return readStoredReceipts()
    .filter((record) => record.status === 'trusted')
    .flatMap((record) => getStoredPurchaseGraph(record).locationRecords)
    .sort((left, right) => left.label.localeCompare(right.label));
}

export function listProjectedReturnSupports(): ProjectedReturnSupportRecord[] {
  return readStoredReceipts()
    .filter((record) => record.status === 'trusted')
    .flatMap((record) => getStoredPurchaseGraph(record).returnSupportRecords)
    .sort((left, right) => right.windowEndsAt.localeCompare(left.windowEndsAt));
}

export function listProjectedPolicies(): ProjectedPolicyRecord[] {
  return readStoredReceipts()
    .filter((record) => record.status === 'trusted')
    .flatMap((record) => getStoredPurchaseGraph(record).policyRecords)
    .sort((left, right) =>
      right.endsAt.localeCompare(left.endsAt)
      || left.policyKind.localeCompare(right.policyKind),
    );
}

export function listProjectedEvidenceRecords(): ProjectedEvidenceRecord[] {
  return readStoredReceipts()
    .filter((record) => record.status === 'trusted')
    .flatMap((record) => getStoredPurchaseGraph(record).evidenceRecords)
    .sort((left, right) =>
      right.purchaseEventId.localeCompare(left.purchaseEventId)
      || left.label.localeCompare(right.label),
    );
}

export function listProjectedThingDocuments(): ProjectedThingDocumentRecord[] {
  return readStoredReceipts()
    .filter((record) => record.status === 'trusted')
    .flatMap((record) => getStoredPurchaseGraph(record).documentRecords)
    .sort((left, right) => left.title.localeCompare(right.title));
}

export function listProjectedDocumentLinks(): ProjectedDocumentLinkRecord[] {
  return readStoredReceipts()
    .filter((record) => record.status === 'trusted')
    .flatMap((record) => getStoredPurchaseGraph(record).documentLinkRecords)
    .sort((left, right) =>
      left.sourceDocumentId.localeCompare(right.sourceDocumentId)
      || left.targetObjectType.localeCompare(right.targetObjectType)
      || left.targetLabel.localeCompare(right.targetLabel),
    );
}

export function listProjectedSemanticRecords(): ProjectedSemanticRecord[] {
  return readStoredReceipts()
    .filter((record) => record.status === 'trusted')
    .map((record) => getStoredPurchaseGraph(record).semanticRecord)
    .sort((left, right) => right.purchasedAt.localeCompare(left.purchasedAt));
}

export function listProjectedThings(): ProjectedThingRecord[] {
  return readStoredReceipts()
    .filter((record) => record.status === 'trusted')
    .flatMap((record) => getStoredPurchaseGraph(record).thingRecords)
    .sort((left, right) => right.acquiredAt.localeCompare(left.acquiredAt));
}

export function listProjectedMemories(): ProjectedMemoryRecord[] {
  return readStoredReceipts()
    .filter((record) => record.status === 'trusted')
    .flatMap((record) => getStoredPurchaseGraph(record).memoryRecords)
    .sort((left, right) => right.startsAt.localeCompare(left.startsAt));
}

export function searchSemanticReceipts(query: string): SemanticReceiptSearchResult[] {
  const normalizedQueryTerms = buildSearchQueryTerms(query);

  if (!normalizedQueryTerms.length) {
    return [];
  }

  return listProjectedSemanticRecords()
    .map((semanticRecord) => {
      const matches = normalizedQueryTerms.filter((term) => semanticRecord.embeddingTerms.includes(term));
      const lexicalMatches = normalizedQueryTerms.filter((term) =>
        semanticRecord.textPreview.toLowerCase().includes(term)
        || semanticRecord.keywords.some((keyword) => keyword.toLowerCase().includes(term)),
      );
      const score = matches.length * 2 + lexicalMatches.length;

      return score > 0
        ? {
            receiptId: semanticRecord.receiptId,
            purchaseEventId: semanticRecord.purchaseEventId,
            merchantName: semanticRecord.merchantName,
            purchasedAt: semanticRecord.purchasedAt,
            matchedTerms: Array.from(new Set([...matches, ...lexicalMatches])),
            score,
            lineHighlights: semanticRecord.lineHighlights,
          }
        : null;
    })
    .filter(Boolean)
    .sort((left, right) => (right?.score ?? 0) - (left?.score ?? 0) || (right?.purchasedAt ?? '').localeCompare(left?.purchasedAt ?? '')) as SemanticReceiptSearchResult[];
}

export function answerSemanticReceiptQuestion(query: string): GroundedReceiptAnswer | null {
  const matches = searchSemanticReceipts(query);

  if (!matches.length) {
    return null;
  }

  const records = readStoredReceipts();
  const queryTerms = buildSearchQueryTerms(query);
  const rankedMatches = matches
    .map((match) => {
      const record = records.find((candidate) => candidate.id === match.receiptId);
      return record ? { match, record, purchaseGraph: getStoredPurchaseGraph(record) } : null;
    })
    .filter(Boolean)
    .slice(0, 2) as Array<{
      match: SemanticReceiptSearchResult;
      record: StoredReceiptRecord;
      purchaseGraph: StoredPurchaseGraphRecords;
    }>;

  if (!rankedMatches.length) {
    return null;
  }

  const topMatch = rankedMatches[0];
  const topThing = topMatch.purchaseGraph.thingRecords[0] ?? null;
  const topPerson = topMatch.record.peopleSuggestions.find((person) => person.id !== 'person_self') ?? topMatch.record.peopleSuggestions[0] ?? null;
  const topEvidence = findBestEvidenceSpan(topMatch.record, topMatch.purchaseGraph.purchaseLineItems, queryTerms);
  const topLineLabels = topMatch.purchaseGraph.purchaseLineItems.slice(0, 3).map((item) => item.description);
  const summaryParts = [
    `I found ${rankedMatches.length === 1 ? '1 grounded receipt match' : `${rankedMatches.length} grounded receipt matches`} in your trusted receipts.`,
    `${topMatch.record.header.merchantName} on ${formatGroundedDate(topMatch.record.header.purchasedAt)} includes ${joinWithAnd(topLineLabels)}.`,
  ];

  if (topThing) {
    summaryParts.push(`${topThing.displayName} is already connected to Things from that receipt.`);
  }

  return {
    query,
    scope: 'trusted_receipts_only',
    matchedReceiptCount: rankedMatches.length,
    summary: summaryParts.join(' '),
    citations: buildGroundedCitations(topMatch.record, topThing, topPerson, topEvidence),
    structuredResults: buildGroundedStructuredResults(rankedMatches),
    suggestedFollowUps: buildGroundedFollowUps(topMatch.record, topThing, topPerson),
  };
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
  nextRecord.purchaseGraph = buildStoredPurchaseGraph(nextRecord, now);

  records[index] = nextRecord;
  writeStoredReceipts(records);

  return buildStudioPayload(nextRecord);
}

export function rerunLiveReceiptExtraction(receiptId: string): ReceiptStudioLivePayload | null {
  const records = readStoredReceipts();
  const index = records.findIndex((record) => record.id === receiptId);

  if (index === -1) {
    return null;
  }

  const record = records[index];
  const now = new Date().toISOString();
  const rerunCount = record.extractionRun.parserVersion.includes('+rerun')
    ? Number.parseInt(record.extractionRun.parserVersion.split('+rerun').pop() ?? '1', 10) + 1
    : 1;
  const nextRecord: StoredReceiptRecord = {
    ...record,
    updatedAt: now,
    status: 'processing',
    note: `${record.header.merchantName} receipt is rerunning extraction so field evidence can be rechecked.`,
    extractionRun: {
      ...record.extractionRun,
      status: 'queued',
      parserVersion: `${record.extractionRun.parserVersion.split('+rerun')[0]}+rerun${rerunCount}`,
      startedAt: now,
      completedAt: null,
      stage: 'queueing_document',
      stageLabel: `Rechecking parsed fields and evidence with ${record.extractionRun.providerLabel}.`,
    },
  };

  records[index] = nextRecord;
  writeStoredReceipts(records);

  return buildStudioPayload(nextRecord);
}

export function saveLiveReceiptHeaderField(
  receiptId: string,
  field: 'merchantName' | 'purchasedAt' | 'grandTotal',
  value: string,
): ReceiptStudioLivePayload | null {
  const records = readStoredReceipts();
  const index = records.findIndex((record) => record.id === receiptId);

  if (index === -1) {
    return null;
  }

  const record = records[index];
  const now = new Date().toISOString();
  const nextHeader = { ...record.header };

  if (field === 'merchantName') {
    nextHeader.merchantName = sanitizeMerchant(value || record.header.merchantName);
  } else if (field === 'purchasedAt') {
    nextHeader.purchasedAt = normalizePurchaseDate(value || record.header.purchasedAt, now);
  } else {
    nextHeader.grandTotal = coerceCurrencyValue(value, record.header.grandTotal);
  }

  const nextRecord = refreshRecordAfterReviewEdit(
    {
      ...record,
      updatedAt: now,
      header: nextHeader,
      lineItems: record.lineItems.map((item) => ({ ...item, reviewState: item.reviewState === 'auto' ? 'edited' : item.reviewState })),
    },
    records.filter((candidate) => candidate.id !== receiptId),
    { syncHeaderGrandTotalToLineItems: false },
  );

  records[index] = nextRecord;
  writeStoredReceipts(records);

  return buildStudioPayload(nextRecord);
}

export function saveLiveReceiptLineItemField(
  receiptId: string,
  lineItemId: string,
  field: 'descriptionNormalized' | 'lineTotal',
  value: string,
): ReceiptStudioLivePayload | null {
  const records = readStoredReceipts();
  const index = records.findIndex((record) => record.id === receiptId);

  if (index === -1) {
    return null;
  }

  const record = records[index];
  const now = new Date().toISOString();
  const nextLineItems = record.lineItems.map((item) => {
    if (item.id !== lineItemId) {
      return item;
    }

    if (field === 'descriptionNormalized') {
      return buildReviewedLineItem(item, titleCase(value || item.descriptionNormalized));
    }

    const nextLineTotal = coerceCurrencyValue(value, item.lineTotal);
    return {
      ...item,
      unitPrice: roundCurrency(nextLineTotal / Math.max(item.quantity, 1)),
      lineTotal: nextLineTotal,
      reviewState: 'edited',
    };
  });

  const nextRecord = refreshRecordAfterReviewEdit(
    {
      ...record,
      updatedAt: now,
      lineItems: nextLineItems,
    },
    records.filter((candidate) => candidate.id !== receiptId),
    { syncHeaderGrandTotalToLineItems: true },
  );

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
  const materializedParsedData = materializeParsedData(record);
  const materializedSearchDocument = materializeSearchDocument(record);
  const nextRecord =
    materializedParsedData === record.parsedData && materializedSearchDocument === record.searchDocument
      ? record
      : {
          ...record,
          parsedData: materializedParsedData,
          searchDocument: materializedSearchDocument,
        };

  if (nextRecord.status !== 'processing') {
    if (
      nextRecord.status === 'trusted'
      && (
        !nextRecord.purchaseProjection
        || !nextRecord.purchaseGraph
        || !nextRecord.purchaseGraph.sourceDocumentRecord
        || !nextRecord.purchaseGraph.extractionRunRecord
        || !nextRecord.purchaseGraph.merchantRecord
        || !nextRecord.purchaseGraph.participantRecords
        || !nextRecord.purchaseGraph.productRecords
        || !nextRecord.purchaseGraph.objectRecords
        || !nextRecord.purchaseGraph.tagRecords
        || !nextRecord.purchaseGraph.memoryRecords
        || !nextRecord.purchaseGraph.locationRecords
        || !nextRecord.purchaseGraph.warrantyRecords
        || !nextRecord.purchaseGraph.returnSupportRecords
        || !nextRecord.purchaseGraph.policyRecords
        || !nextRecord.purchaseGraph.evidenceRecords
        || !nextRecord.purchaseGraph.documentRecords
        || !nextRecord.purchaseGraph.documentLinkRecords
        || !nextRecord.purchaseGraph.semanticRecord
      )
    ) {
      const purchaseProjection = nextRecord.purchaseProjection ?? buildPurchaseProjection(nextRecord, nextRecord.updatedAt);
      return {
        ...nextRecord,
        purchaseProjection,
        purchaseGraph: buildStoredPurchaseGraph(
          {
            ...nextRecord,
            purchaseProjection,
          },
          nextRecord.updatedAt,
        ),
      };
    }

    return nextRecord;
  }

  const nowMs = Date.now();
  const extractionStartedAtMs = Date.parse(nextRecord.extractionRun.startedAt || nextRecord.createdAt);
  const elapsed = Math.max(0, nowMs - extractionStartedAtMs);

  if (elapsed >= EXTRACTION_DELAY_MS) {
    return {
      ...nextRecord,
      updatedAt: new Date(nowMs).toISOString(),
      status: 'needs_review',
      note: `${nextRecord.header.merchantName} receipt is ready for line-item review and evidence-based correction.`,
      extractionRun: {
        ...nextRecord.extractionRun,
        status: 'completed',
        completedAt: new Date(extractionStartedAtMs + EXTRACTION_DELAY_MS).toISOString(),
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
    ...nextRecord,
    extractionRun: {
      ...nextRecord.extractionRun,
      status: 'processing',
      stage: nextStage.stage,
      stageLabel: nextStage.label,
    },
  };
}

function materializeParsedData(record: StoredReceiptRecord): StoredParsedData {
  const parsedData = record.parsedData as Partial<StoredParsedData>;

  if (parsedData.lineItemCandidates && parsedData.requestProvenance && parsedData.providerTrace) {
    return parsedData as StoredParsedData;
  }

  return {
    rawText: parsedData.rawText ?? buildRawText(record.header.merchantName, record.header.purchasedAt, record.lineItems, record.header.grandTotal),
    fieldCandidates:
      parsedData.fieldCandidates?.map((field, index) => ({
        id: field.id ?? `${record.id}_field_${index + 1}`,
        label: field.label,
        value: field.value,
        confidence: field.confidence,
        source: field.source ?? 'derived',
        evidenceSpanId: field.evidenceSpanId ?? null,
      })) ?? [],
    lineItemCandidates:
      parsedData.lineItemCandidates ??
      record.lineItems.map((item) => ({
        id: `${record.id}_candidate_line_${item.lineIndex}`,
        description: item.descriptionNormalized,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
        confidence: item.confidenceScore,
        source: 'summary_fallback' as const,
        thingCandidateHint: item.assetCandidateFlag,
        evidenceSpanId: record.evidenceSpans.find((span) => span.targetObjectId === item.id)?.id ?? null,
      })),
    requestProvenance:
      parsedData.requestProvenance ?? {
        parserMode: 'legacy_materialized',
        parserVersion: record.extractionRun.parserVersion,
        processingNote: 'Parsed-layer records were materialized from stored receipt review data.',
        sourceDocumentId: record.sourceDocument.id,
        sourceDocumentChecksum: record.sourceDocument.checksum,
        sourceFileCount: record.sourceDocument.sourceFiles.length,
        captureChannel: record.sourceDocument.captureChannel,
      },
    providerTrace:
      parsedData.providerTrace ?? {
        providerId: record.extractionRun.providerId,
        providerLabel: record.extractionRun.providerLabel,
        routingMode: record.extractionRun.routingMode,
        evaluationStage: record.extractionRun.evaluationStage,
        fallbackProviderLabel: record.extractionRun.fallbackProviderLabel,
      },
    returnPolicySnippet: parsedData.returnPolicySnippet ?? null,
    warrantySnippet: parsedData.warrantySnippet ?? null,
  };
}

function materializeSearchDocument(record: StoredReceiptRecord) {
  if (record.searchDocument.embeddingTerms?.length && record.searchDocument.embeddingVersion) {
    return record.searchDocument;
  }

  return {
    ...record.searchDocument,
    embeddingTerms: buildEmbeddingTerms(record.header.merchantName, record.lineItems),
    embeddingVersion: 'receipt-embedding-v1',
  };
}

function buildProjectedSourceDocumentRecord(
  record: StoredReceiptRecord,
  purchaseEventId: string,
): ProjectedSourceDocumentRecord {
  return {
    id: record.sourceDocument.id,
    receiptId: record.id,
    purchaseEventId,
    sourceType: record.sourceDocument.sourceType,
    captureChannel: record.sourceDocument.captureChannel,
    fileName: record.sourceDocument.fileName,
    fileCount: record.sourceDocument.sourceFiles.length || 1,
    mimeType: record.sourceDocument.mimeType,
    capturedAt: record.sourceDocument.capturedAt,
    checksum: record.sourceDocument.checksum,
    storageStatus: record.sourceDocument.storageStatus,
    detectedReceiptCount: record.sourceDocument.detectedReceiptCount,
    note: 'The original receipt capture is preserved as the raw source document for this trusted purchase.',
  };
}

function buildProjectedExtractionRunRecord(
  record: StoredReceiptRecord,
  purchaseEventId: string,
): ProjectedExtractionRunRecord {
  return {
    id: record.extractionRun.id,
    receiptId: record.id,
    purchaseEventId,
    sourceDocumentId: record.sourceDocument.id,
    status: record.extractionRun.status,
    parserVersion: record.extractionRun.parserVersion,
    providerId: record.extractionRun.providerId,
    providerLabel: record.extractionRun.providerLabel,
    routingMode: record.extractionRun.routingMode,
    evaluationStage: record.extractionRun.evaluationStage,
    fallbackProviderLabel: record.extractionRun.fallbackProviderLabel,
    startedAt: record.extractionRun.startedAt,
    completedAt: record.extractionRun.completedAt,
    stage: record.extractionRun.stage,
    stageLabel: record.extractionRun.stageLabel,
    note: `This trusted receipt came from ${record.extractionRun.providerLabel} using ${record.extractionRun.parserVersion}.`,
  };
}

function buildProjectedPurchaseEventRecord(record: StoredReceiptRecord): ProjectedPurchaseEventRecord {
  const purchaseProjection = record.purchaseProjection ?? buildPurchaseProjection(record, record.updatedAt);
  const merchantKey = slugify(record.header.merchantName);
  const merchantDirectoryId = `merchant_directory_${merchantKey}`;

  return {
    id: purchaseProjection.purchaseEventId,
    receiptId: record.id,
    sourceDocumentId: record.sourceDocument.id,
    merchantId: `merchant_${slugify(record.header.merchantName)}`,
    merchantDirectoryId,
    merchantName: record.header.merchantName,
    purchasedAt: record.header.purchasedAt,
    grandTotal: record.header.grandTotal,
    currency: record.header.currency,
    lineItemCount: record.lineItems.length,
    retailerProfile: record.structuredData.retailerProfile,
    merchantMatchStatus: record.structuredData.merchantMatchStatus,
    merchantMatchConfidence: record.structuredData.merchantMatchConfidence,
    merchantResolutionSource: record.structuredData.merchantMatchStatus === 'confirmed' ? 'reviewed_receipt' : 'directory_match',
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

function buildProjectedMerchantRecord(record: StoredReceiptRecord, purchaseEvent: ProjectedPurchaseEventRecord): ProjectedMerchantRecord {
  const entry = resolveMerchantDirectoryEntry(record.header.merchantName);

  return {
    id: purchaseEvent.merchantId,
    merchantId: purchaseEvent.merchantId,
    merchantDirectoryId: entry ? entry.id : null,
    displayName: entry?.displayName ?? purchaseEvent.merchantName,
    kind: entry?.kind ?? 'unknown',
    retailerProfile: purchaseEvent.retailerProfile,
    aliases: entry?.aliases ?? [purchaseEvent.merchantName.toLowerCase()],
    purchaseCount: 1,
    trustedSpendTotal: purchaseEvent.grandTotal,
    latestPurchaseAt: purchaseEvent.purchasedAt,
    latestPurchaseEventId: purchaseEvent.id,
    defaultReturnWindowDays: entry?.defaultReturnWindowDays,
    defaultProductCategories: entry?.defaultProductCategories ?? purchaseEvent.productCategories,
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
        productCandidateKey: `product_${slugify(`${record.header.merchantName}-${item.descriptionNormalized}`)}`,
        productCandidateLabel: item.descriptionNormalized,
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

function buildProjectedPurchaseParticipantRecords(
  record: StoredReceiptRecord,
  purchaseEvent: ProjectedPurchaseEventRecord,
  purchaseLineItems: ProjectedPurchaseLineItemRecord[],
  thingRecords: ProjectedThingRecord[],
  memoryRecords: ProjectedMemoryRecord[],
): ProjectedPurchaseParticipantRecord[] {
  const participantCount = Math.max(record.peopleSuggestions.length, 1);
  const spendShare = roundCurrency(purchaseEvent.grandTotal / participantCount);

  return record.peopleSuggestions.map((person) => {
    const linkedThings = thingRecords.filter((thing) => thing.personIds.includes(person.id));
    const linkedMemories = memoryRecords.filter((memory) => memory.personIds.includes(person.id));

    return {
      id: `participant_${purchaseEvent.id}_${person.id}`,
      purchaseEventId: purchaseEvent.id,
      receiptId: record.id,
      personId: person.id,
      displayName: person.displayName,
      relationshipType: person.relationshipType,
      participationRole: resolvePurchaseParticipationRole(person.relationshipType),
      linkedLineItemCount: purchaseLineItems.filter((item) => item.personIds.includes(person.id)).length,
      linkedThingCount: linkedThings.length,
      linkedMemoryCount: linkedMemories.length,
      spendShare,
      confidenceScore: person.id === 'person_self' ? 0.99 : 0.82,
      note:
        person.id === 'person_self'
          ? `${person.displayName} is the primary participant on this reviewed purchase event.`
          : `${person.displayName} is linked through household or shared-context signals on this reviewed purchase event.`,
    };
  });
}

function buildProjectedProductRecords(
  record: StoredReceiptRecord,
  purchaseLineItems: ProjectedPurchaseLineItemRecord[],
): ProjectedProductRecord[] {
  return purchaseLineItems.map((item) => ({
    id: item.productCandidateKey,
    purchaseEventId: item.purchaseEventId,
    receiptId: item.receiptId,
    sourceLineItemId: item.sourceLineItemId,
    purchasedAt: item.purchasedAt,
    merchantName: item.merchantName,
    currency: item.currency,
    displayName: item.productCandidateLabel,
    canonicalLabel: item.productCandidateLabel,
    category: item.category,
    subcategory: item.subcategory,
    matchStatus: item.productMatchStatus,
    matchConfidence: item.productMatchConfidence,
    thingCandidate: item.assetCandidateFlag,
    linkedThingId: item.thingId,
    lineTotal: item.lineTotal,
    householdTags: item.householdTags,
    lemTags: item.lemTags,
    evidenceSpanIds: item.evidenceSpanIds,
    personIds: item.personIds,
    note:
      item.productMatchStatus === 'unmatched'
        ? `${item.description} is still an unmatched product candidate from receipt review.`
        : `${item.productCandidateLabel} is a ${item.productMatchStatus} product candidate grounded in the reviewed receipt.`,
  }));
}

function buildProjectedObjectRecords(productRecords: ProjectedProductRecord[]): ProjectedObjectRecord[] {
  return productRecords.map((product) => {
    const entry = resolveObjectDirectoryEntry(product.displayName);
    return {
      id: entry?.id ?? `object_${slugify(product.displayName)}`,
      objectDirectoryId: entry?.id ?? null,
      displayName: product.displayName,
      category: entry?.category ?? product.category,
      subcategory: entry?.subcategory ?? product.subcategory,
      householdTags: entry?.householdTags ?? product.householdTags,
      lemTags: entry?.lemTags ?? product.lemTags,
      keywords: entry?.keywords ?? [product.displayName.toLowerCase()],
      thingCandidate: entry?.thingCandidate ?? product.thingCandidate,
      purchaseCount: 1,
      trustedSpendTotal: product.lineTotal,
      latestPurchaseAt: product.purchasedAt,
      linkedThingIds: product.linkedThingId ? [product.linkedThingId] : [],
      linkedProductIds: [product.id],
    };
  });
}

function buildProjectedTagRecords(
  record: StoredReceiptRecord,
  purchaseEvent: ProjectedPurchaseEventRecord,
  productRecords: ProjectedProductRecord[],
  objectRecords: ProjectedObjectRecord[],
): ProjectedTagRecord[] {
  const tagMap = new Map<string, ProjectedTagRecord>();

  const upsertTag = (params: {
    framework: ProjectedTagRecord['framework'];
    label: string;
    spend: number;
    linkedThingIds?: string[];
    linkedProductIds?: string[];
    linkedObjectIds?: string[];
    note: string;
  }) => {
    const normalizedLabel = slugify(params.label);
    const id = `tag_${params.framework}_${normalizedLabel}`;
    const existing = tagMap.get(id);
    const nextRecord: ProjectedTagRecord = {
      id,
      framework: params.framework,
      label: params.label,
      normalizedLabel,
      receiptIds: [record.id],
      purchaseEventIds: [purchaseEvent.id],
      linkedThingIds: params.linkedThingIds ?? [],
      linkedProductIds: params.linkedProductIds ?? [],
      linkedObjectIds: params.linkedObjectIds ?? [],
      trustedSpendTotal: roundCurrency(params.spend),
      note: params.note,
    };

    if (!existing) {
      tagMap.set(id, nextRecord);
      return;
    }

    tagMap.set(id, {
      ...existing,
      linkedThingIds: Array.from(new Set([...existing.linkedThingIds, ...nextRecord.linkedThingIds])),
      linkedProductIds: Array.from(new Set([...existing.linkedProductIds, ...nextRecord.linkedProductIds])),
      linkedObjectIds: Array.from(new Set([...existing.linkedObjectIds, ...nextRecord.linkedObjectIds])),
      trustedSpendTotal: roundCurrency(existing.trustedSpendTotal + nextRecord.trustedSpendTotal),
    });
  };

  purchaseEvent.taxTags.forEach((tag) => {
    upsertTag({
      framework: 'tax',
      label: tag,
      spend: purchaseEvent.grandTotal,
      note: 'Tax tags summarize how this trusted purchase may matter for future reporting and household understanding.',
    });
  });

  purchaseEvent.lifestyleTags.forEach((tag) => {
    upsertTag({
      framework: 'lifestyle',
      label: tag,
      spend: purchaseEvent.grandTotal,
      note: 'Lifestyle tags capture the consumer context behind this purchase event.',
    });
  });

  purchaseEvent.productCategories.forEach((tag) => {
    upsertTag({
      framework: 'product_category',
      label: tag,
      spend: purchaseEvent.grandTotal,
      note: 'Product category tags organize trusted purchases into consumer-facing ownership groupings.',
    });
  });

  upsertTag({
    framework: 'vendor_context',
    label: purchaseEvent.retailerProfile,
    spend: purchaseEvent.grandTotal,
    note: 'Vendor-context tags capture the retailer profile and shared-library enrichment behind this purchase.',
  });

  productRecords.forEach((product) => {
    const linkedObjectIds = objectRecords.filter((objectRecord) => objectRecord.linkedProductIds.includes(product.id)).map((objectRecord) => objectRecord.id);

    product.householdTags.forEach((tag) => {
      upsertTag({
        framework: 'household',
        label: tag,
        spend: product.lineTotal,
        linkedThingIds: product.linkedThingId ? [product.linkedThingId] : [],
        linkedProductIds: [product.id],
        linkedObjectIds,
        note: 'Household tags connect line-item and product facts to real household needs and routines.',
      });
    });

    product.lemTags.forEach((tag) => {
      upsertTag({
        framework: 'lem',
        label: tag,
        spend: product.lineTotal,
        linkedThingIds: product.linkedThingId ? [product.linkedThingId] : [],
        linkedProductIds: [product.id],
        linkedObjectIds,
        note: 'LEM tags stay as a meaning layer over trusted records instead of becoming the system of record.',
      });
    });
  });

  return Array.from(tagMap.values());
}

function buildProjectedPurchaseReceiptRecord(
  purchaseEvent: ProjectedPurchaseEventRecord,
  purchaseLineItems: ProjectedPurchaseLineItemRecord[],
  memoryRecords: ProjectedMemoryRecord[],
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
    memoryIds: memoryRecords.filter((memory) => memory.purchaseEventId === purchaseEvent.id).map((memory) => memory.id),
  };
}

function buildProjectedThingRecord(product: ProjectedProductRecord, record?: StoredReceiptRecord): ProjectedThingRecord {
  const returnWindowEndsAt = product.thingCandidate ? addDays(product.purchasedAt, inferReturnWindowDays(product.merchantName)) : undefined;
  const warrantyEndsAt = product.thingCandidate ? addDays(product.purchasedAt, 365) : undefined;
  const sourceDocumentId = record?.sourceDocument.id ?? `srcdoc_${product.receiptId}`;
  const supportLabels = [
    'Receipt linked',
    returnWindowEndsAt ? 'Return policy tracked' : 'Return window closed',
    warrantyEndsAt ? 'Warranty stub ready' : 'No warranty stub',
  ];

  return {
    id: product.linkedThingId ?? `thing_${slugify(`${product.receiptId}-${product.displayName}`)}`,
    purchaseEventId: product.purchaseEventId,
    sourceDocumentId,
    displayName: product.displayName,
    category: product.category,
    subcategory: product.subcategory,
    status: inferThingStatus(product.purchasedAt),
    purchasePrice: product.lineTotal,
    currency: product.currency,
    acquiredAt: product.purchasedAt,
    merchantName: product.merchantName,
    receiptId: product.receiptId,
    notes: `${product.merchantName} product candidate trusted from receipt review and ready for ownership follow-up.`,
    warrantyEndsAt,
    returnWindowEndsAt,
    badgeLabels: buildThingBadges(returnWindowEndsAt, warrantyEndsAt, product.purchasedAt),
    supportLabels,
    linkedDocumentCount: 1,
    personIds: product.personIds,
    memoryIds: [],
  };
}

function buildProjectedMemoryRecords(
  record: StoredReceiptRecord,
  purchaseEvent: ProjectedPurchaseEventRecord,
  purchaseLineItems: ProjectedPurchaseLineItemRecord[],
  thingRecords: ProjectedThingRecord[],
): ProjectedMemoryRecord[] {
  const primarySuggestion = record.memorySuggestions[0];

  if (!primarySuggestion || !shouldProjectMemoryCandidate(record, purchaseLineItems, thingRecords)) {
    return [];
  }

  const profile = inferMemoryProfile(record, purchaseLineItems, thingRecords);

  return [
    {
      id: primarySuggestion.id,
      purchaseEventId: purchaseEvent.id,
      receiptId: record.id,
      title: profile.title,
      suggestedTitle: primarySuggestion.suggestedTitle,
      memoryState: 'candidate',
      memoryType: profile.memoryType,
      significance: profile.significance,
      startsAt: record.header.purchasedAt,
      endsAt: undefined,
      placeLabel: profile.placeLabel,
      summary: profile.summary,
      notes: profile.notes,
      receiptIds: [record.id],
      personIds: record.peopleSuggestions.map((person) => person.id),
      thingIds: thingRecords.map((thing) => thing.id),
    },
  ];
}

function buildProjectedLocationRecords(
  record: StoredReceiptRecord,
  purchaseEvent: ProjectedPurchaseEventRecord,
  memoryRecords: ProjectedMemoryRecord[],
  thingRecords: ProjectedThingRecord[],
): ProjectedLocationRecord[] {
  const label = memoryRecords[0]?.placeLabel ?? purchaseEvent.merchantName;
  const normalizedLabel = slugify(label);
  const locationKind =
    normalizedLabel === 'home'
      ? 'home'
      : record.structuredData.retailerProfile === 'known service provider'
        ? 'service_context'
        : 'merchant_place';

  return [
    {
      id: `location_${purchaseEvent.id}_${normalizedLabel}`,
      receiptId: record.id,
      purchaseEventId: purchaseEvent.id,
      label,
      normalizedLabel,
      locationKind,
      linkedThingIds: thingRecords.map((thing) => thing.id),
      linkedMemoryIds: memoryRecords.map((memory) => memory.id),
      linkedPersonIds: purchaseEvent.personIds,
      note:
        locationKind === 'home'
          ? 'This trusted purchase appears to support an at-home routine or ownership moment.'
          : `This trusted purchase is anchored to ${label} as part of the vendor and memory context.`,
    },
  ];
}

function shouldProjectMemoryCandidate(
  record: StoredReceiptRecord,
  purchaseLineItems: ProjectedPurchaseLineItemRecord[],
  thingRecords: ProjectedThingRecord[],
) {
  const hasNonSelfPerson = record.peopleSuggestions.some((person) => person.id !== 'person_self');
  const hasExperienceSignal = record.structuredData.lifestyleTags.some((tag) => ['sports', 'food at home', 'home setup'].includes(tag));
  const hasMeaningfulThing = thingRecords.length > 0;
  const hasContextCategory = purchaseLineItems.some((item) => ['Kids', 'Home', 'Kitchen'].includes(item.category));

  return hasNonSelfPerson || hasExperienceSignal || hasMeaningfulThing || hasContextCategory;
}

function inferMemoryProfile(
  record: StoredReceiptRecord,
  purchaseLineItems: ProjectedPurchaseLineItemRecord[],
  thingRecords: ProjectedThingRecord[],
) {
  const merchant = record.header.merchantName;
  const hasNonSelfPerson = record.peopleSuggestions.some((person) => person.id !== 'person_self');
  const personLabel = record.peopleSuggestions.find((person) => person.id !== 'person_self')?.displayName ?? 'your household';
  const joinedItems = joinMemoryItems(purchaseLineItems);

  if (record.structuredData.lifestyleTags.includes('sports') || purchaseLineItems.some((item) => item.category === 'Kids')) {
    return {
      title: `${merchant} game day prep`,
      memoryType: 'family event',
      significance: 'high' as const,
      placeLabel: merchant,
      summary: `Sports-related purchases and people context suggest a strong family-event candidate anchored by ${merchant}.`,
      notes: `Candidate created from trusted receipt signals including ${joinedItems} and linked people like ${personLabel}.`,
    };
  }

  if (record.structuredData.lifestyleTags.includes('home setup') || purchaseLineItems.some((item) => item.category === 'Home')) {
    return {
      title: `${merchant} home setup day`,
      memoryType: 'home project',
      significance: 'medium' as const,
      placeLabel: merchant,
      summary: `A trusted home-oriented purchase from ${merchant} looks like the start of a project or setup moment.`,
      notes: `Candidate created from home setup signals around ${joinedItems}.`,
    };
  }

  if (record.structuredData.lifestyleTags.includes('food at home') || purchaseLineItems.some((item) => item.category === 'Kitchen')) {
    return {
      title: `${merchant} meal prep moment`,
      memoryType: 'family routine',
      significance: hasNonSelfPerson ? 'medium' as const : 'light' as const,
      placeLabel: 'Home',
      summary: `${merchant} appears to support a household routine rather than staying only as a transaction.`,
      notes: `Candidate created from kitchen and food-at-home signals like ${joinedItems}${hasNonSelfPerson ? ` with ${personLabel} in the graph` : ''}.`,
    };
  }

  if (hasNonSelfPerson) {
    return {
      title: `${merchant} shared moment`,
      memoryType: 'social',
      significance: 'medium' as const,
      placeLabel: merchant,
      summary: `This receipt is already connected to ${personLabel}, which makes it a good candidate for memory review.`,
      notes: `Candidate created from trusted receipt links to ${personLabel} and ${joinedItems}.`,
    };
  }

  return {
    title: thingRecords[0] ? `${thingRecords[0].displayName} setup moment` : `${merchant} purchase moment`,
    memoryType: 'purchase moment',
    significance: thingRecords[0] ? 'medium' as const : 'light' as const,
    placeLabel: merchant,
    summary: `A trusted purchase from ${merchant} now has enough structure to be reviewed as a lightweight memory candidate.`,
    notes: `Candidate created from ${joinedItems}.`,
  };
}

function joinMemoryItems(purchaseLineItems: ProjectedPurchaseLineItemRecord[]) {
  const labels = purchaseLineItems.slice(0, 3).map((item) => item.description);

  if (!labels.length) {
    return 'the receipt details';
  }

  if (labels.length === 1) {
    return labels[0];
  }

  if (labels.length === 2) {
    return `${labels[0]} and ${labels[1]}`;
  }

  return `${labels.slice(0, -1).join(', ')}, and ${labels.at(-1)}`;
}

function buildProjectedSemanticRecord(
  record: StoredReceiptRecord,
  purchaseEvent: ProjectedPurchaseEventRecord,
  purchaseLineItems: ProjectedPurchaseLineItemRecord[],
  thingRecords: ProjectedThingRecord[],
  memoryRecords: ProjectedMemoryRecord[],
): ProjectedSemanticRecord {
  return {
    id: `semantic_${record.id}`,
    receiptId: record.id,
    purchaseEventId: purchaseEvent.id,
    sourceDocumentId: record.sourceDocument.id,
    merchantName: purchaseEvent.merchantName,
    purchasedAt: purchaseEvent.purchasedAt,
    retrievalScope: 'trusted_receipt',
    textPreview: record.searchDocument.textPreview,
    keywords: record.searchDocument.keywords,
    embeddingTerms: record.searchDocument.embeddingTerms,
    embeddingVersion: record.searchDocument.embeddingVersion,
    lineHighlights: purchaseLineItems.slice(0, 3).map((item) => item.description),
    thingIds: thingRecords.map((thing) => thing.id),
    memoryIds: memoryRecords.map((memory) => memory.id),
    personIds: purchaseEvent.personIds,
    note: `${purchaseEvent.merchantName} is indexed as a trusted receipt retrieval record grounded in reviewed purchase data.`,
  };
}

function buildProjectedWarrantyRecords(thingRecords: ProjectedThingRecord[]): ProjectedWarrantyRecord[] {
  return thingRecords
    .filter((thing) => Boolean(thing.warrantyEndsAt))
    .map((thing) => ({
      id: `warranty_${thing.id}`,
      thingId: thing.id,
      purchaseEventId: thing.purchaseEventId,
      receiptId: thing.receiptId,
      providerName: `${thing.merchantName} / Manufacturer`,
      coverageType: 'manufacturer',
      startsAt: thing.acquiredAt,
      endsAt: thing.warrantyEndsAt ?? thing.acquiredAt,
      status: 'candidate',
      source: 'receipt_candidate',
      note: 'Warranty stub created from a trusted receipt and durable-goods heuristics. Review before relying on exact coverage.',
    }));
}

function buildProjectedReturnSupportRecords(thingRecords: ProjectedThingRecord[]): ProjectedReturnSupportRecord[] {
  return thingRecords
    .filter((thing) => Boolean(thing.returnWindowEndsAt))
    .map((thing) => ({
      id: `return_${thing.id}`,
      thingId: thing.id,
      purchaseEventId: thing.purchaseEventId,
      receiptId: thing.receiptId,
      merchantName: thing.merchantName,
      startsAt: thing.acquiredAt,
      windowEndsAt: thing.returnWindowEndsAt ?? thing.acquiredAt,
      status: thing.returnWindowEndsAt && Date.parse(thing.returnWindowEndsAt) > Date.now() ? 'open' : 'closed',
      policyLabel: `${thing.merchantName} return window`,
      source: 'receipt_candidate',
      note: 'Return support is inferred from the trusted receipt date and merchant return-window heuristics. Review before relying on the exact deadline.',
    }));
}

function buildProjectedPolicyRecords(
  warrantyRecords: ProjectedWarrantyRecord[],
  returnSupportRecords: ProjectedReturnSupportRecord[],
): ProjectedPolicyRecord[] {
  const warrantyPolicies = warrantyRecords.map((warranty) => ({
    id: `policy_${warranty.id}`,
    thingId: warranty.thingId,
    purchaseEventId: warranty.purchaseEventId,
    receiptId: warranty.receiptId,
    policyKind: 'warranty' as const,
    title: `${warranty.providerName} warranty policy`,
    providerName: warranty.providerName,
    status: warranty.status,
    effectiveAt: warranty.startsAt,
    endsAt: warranty.endsAt,
    source: warranty.source,
    linkedSupportRecordId: warranty.id,
    note: warranty.note,
  }));
  const returnPolicies = returnSupportRecords.map((returnSupport) => ({
    id: `policy_${returnSupport.id}`,
    thingId: returnSupport.thingId,
    purchaseEventId: returnSupport.purchaseEventId,
    receiptId: returnSupport.receiptId,
    policyKind: 'return' as const,
    title: `${returnSupport.merchantName} return policy`,
    providerName: returnSupport.merchantName,
    status: returnSupport.status,
    effectiveAt: returnSupport.startsAt,
    endsAt: returnSupport.windowEndsAt,
    source: returnSupport.source,
    linkedSupportRecordId: returnSupport.id,
    note: returnSupport.note,
  }));

  return [...warrantyPolicies, ...returnPolicies];
}

function buildProjectedEvidenceRecords(
  record: StoredReceiptRecord,
  purchaseEvent: ProjectedPurchaseEventRecord,
  purchaseLineItems: ProjectedPurchaseLineItemRecord[],
): ProjectedEvidenceRecord[] {
  return record.evidenceSpans.map((span) => {
    const linkedLineItem = purchaseLineItems.find((item) => item.sourceLineItemId === span.targetObjectId);

    return {
      id: span.id,
      receiptId: record.id,
      purchaseEventId: purchaseEvent.id,
      targetObjectType: span.targetObjectType,
      targetRecordId:
        span.targetObjectType === 'purchase_event'
          ? purchaseEvent.id
          : (linkedLineItem?.id ?? span.targetObjectId),
      label: span.label,
      evidenceType: span.evidenceType,
      pageNumber: span.pageNumber,
      snippet: span.snippet,
      linkedThingIds: linkedLineItem?.thingId ? [linkedLineItem.thingId] : [],
      note:
        span.targetObjectType === 'purchase_event'
          ? 'Header evidence remains linked to the trusted purchase event.'
          : 'Line-item evidence remains linked to the reviewed purchase line item and any promoted Thing.',
    };
  });
}

function buildProjectedThingDocumentRecords(
  record: StoredReceiptRecord,
  thingRecords: ProjectedThingRecord[],
  warrantyRecords: ProjectedWarrantyRecord[],
): ProjectedThingDocumentRecord[] {
  return thingRecords.flatMap((thing) => {
    const receiptDocument: ProjectedThingDocumentRecord = {
      id: `doc_receipt_${thing.id}`,
      thingId: thing.id,
      receiptId: thing.receiptId,
      sourceDocumentId: record.sourceDocument.id,
      title: `${record.header.merchantName} receipt`,
      documentRole: 'receipt',
      documentType: record.sourceDocument.sourceType,
    };
    const warrantyRecord = warrantyRecords.find((candidate) => candidate.thingId === thing.id);

    return warrantyRecord
      ? [
          receiptDocument,
          {
            id: `doc_warranty_${thing.id}`,
            thingId: thing.id,
            receiptId: thing.receiptId,
            sourceDocumentId: record.sourceDocument.id,
            title: `${thing.displayName} warranty stub`,
            documentRole: 'warranty_stub',
            documentType: record.sourceDocument.sourceType,
          },
        ]
      : [receiptDocument];
  });
}

function buildProjectedDocumentLinkRecords(
  record: StoredReceiptRecord,
  purchaseEvent: ProjectedPurchaseEventRecord,
  thingRecords: ProjectedThingRecord[],
  memoryRecords: ProjectedMemoryRecord[],
  warrantyRecords: ProjectedWarrantyRecord[],
): ProjectedDocumentLinkRecord[] {
  const baseLinks: ProjectedDocumentLinkRecord[] = [
    {
      id: `doclink_event_${purchaseEvent.id}`,
      sourceDocumentId: record.sourceDocument.id,
      receiptId: record.id,
      purchaseEventId: purchaseEvent.id,
      targetObjectType: 'purchase_event',
      targetObjectId: purchaseEvent.id,
      targetLabel: purchaseEvent.merchantName,
      documentRole: 'source_document',
      note: 'The original source document is the raw evidence anchor for this purchase event.',
    },
  ];

  const thingLinks = thingRecords.map((thing) => ({
    id: `doclink_thing_${thing.id}`,
    sourceDocumentId: record.sourceDocument.id,
    receiptId: record.id,
    purchaseEventId: purchaseEvent.id,
    targetObjectType: 'thing' as const,
    targetObjectId: thing.id,
    targetLabel: thing.displayName,
    documentRole: 'receipt' as const,
    note: 'This Thing is linked back to the reviewed receipt document for ownership support.',
  }));

  const warrantyLinks = warrantyRecords.map((warranty) => ({
    id: `doclink_warranty_${warranty.id}`,
    sourceDocumentId: record.sourceDocument.id,
    receiptId: record.id,
    purchaseEventId: purchaseEvent.id,
    targetObjectType: 'warranty' as const,
    targetObjectId: warranty.id,
    targetLabel: warranty.providerName,
    documentRole: 'warranty_stub' as const,
    note: 'Warranty support is attached to the same source document until better coverage documents exist.',
  }));

  const memoryLinks = memoryRecords.map((memory) => ({
    id: `doclink_memory_${memory.id}`,
    sourceDocumentId: record.sourceDocument.id,
    receiptId: record.id,
    purchaseEventId: purchaseEvent.id,
    targetObjectType: 'memory' as const,
    targetObjectId: memory.id,
    targetLabel: memory.title,
    documentRole: 'source_document' as const,
    note: 'This memory candidate stays grounded in the original source document that triggered it.',
  }));

  return [...baseLinks, ...thingLinks, ...warrantyLinks, ...memoryLinks];
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

function buildStoredPurchaseGraph(record: StoredReceiptRecord, savedAt: string): StoredPurchaseGraphRecords {
  const purchaseProjection = record.purchaseProjection ?? buildPurchaseProjection(record, savedAt);
  const projectedRecord = {
    ...record,
    purchaseProjection,
  };
  const purchaseEvent = buildProjectedPurchaseEventRecord(projectedRecord);
  const sourceDocumentRecord = buildProjectedSourceDocumentRecord(projectedRecord, purchaseEvent.id);
  const extractionRunRecord = buildProjectedExtractionRunRecord(projectedRecord, purchaseEvent.id);
  const merchantRecord = buildProjectedMerchantRecord(projectedRecord, purchaseEvent);
  const purchaseLineItems = buildProjectedPurchaseLineItemRecords(projectedRecord);
  const productRecords = buildProjectedProductRecords(projectedRecord, purchaseLineItems);
  const objectRecords = buildProjectedObjectRecords(productRecords);
  const tagRecords = buildProjectedTagRecords(projectedRecord, purchaseEvent, productRecords, objectRecords);
  const baseThingRecords = productRecords
    .filter((product) => product.thingCandidate && product.linkedThingId)
    .map((product) => buildProjectedThingRecord(product, projectedRecord));
  const memoryRecords = buildProjectedMemoryRecords(projectedRecord, purchaseEvent, purchaseLineItems, baseThingRecords);
  const thingRecords = baseThingRecords.map((thing) => ({
    ...thing,
    memoryIds: memoryRecords.filter((memory) => memory.thingIds.includes(thing.id)).map((memory) => memory.id),
  }));
  const locationRecords = buildProjectedLocationRecords(projectedRecord, purchaseEvent, memoryRecords, thingRecords);
  const semanticRecord = buildProjectedSemanticRecord(projectedRecord, purchaseEvent, purchaseLineItems, thingRecords, memoryRecords);
  const warrantyRecords = buildProjectedWarrantyRecords(thingRecords);
  const returnSupportRecords = buildProjectedReturnSupportRecords(thingRecords);
  const policyRecords = buildProjectedPolicyRecords(warrantyRecords, returnSupportRecords);
  const evidenceRecords = buildProjectedEvidenceRecords(projectedRecord, purchaseEvent, purchaseLineItems);
  const documentRecords = buildProjectedThingDocumentRecords(projectedRecord, thingRecords, warrantyRecords);
  const documentLinkRecords = buildProjectedDocumentLinkRecords(
    projectedRecord,
    purchaseEvent,
    thingRecords,
    memoryRecords,
    warrantyRecords,
  );
  const participantRecords = buildProjectedPurchaseParticipantRecords(
    projectedRecord,
    purchaseEvent,
    purchaseLineItems,
    thingRecords,
    memoryRecords,
  );

  return {
    savedAt,
    sourceDocumentRecord,
    extractionRunRecord,
    merchantRecord,
    purchaseEvent,
    purchaseLineItems,
    participantRecords,
    productRecords,
    objectRecords,
    tagRecords,
    thingRecords,
    memoryRecords,
    locationRecords,
    warrantyRecords,
    returnSupportRecords,
    policyRecords,
    evidenceRecords,
    documentRecords,
    documentLinkRecords,
    semanticRecord,
  };
}

function getStoredPurchaseGraph(record: StoredReceiptRecord): StoredPurchaseGraphRecords {
  return record.purchaseGraph ?? buildStoredPurchaseGraph(record, record.updatedAt);
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
    duplicateCandidates:
      record.status === 'processing'
        ? []
        : record.duplicateCandidates.map((candidate) => ({
            ...candidate,
            action: `route:/ingest/${candidate.matchedReceiptId}`,
          })),
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

function refreshRecordAfterReviewEdit(
  record: StoredReceiptRecord,
  siblingRecords: StoredReceiptRecord[],
  options: { syncHeaderGrandTotalToLineItems: boolean },
): StoredReceiptRecord {
  const merchant = sanitizeMerchant(record.header.merchantName);
  const purchasedAt = normalizePurchaseDate(record.header.purchasedAt, record.updatedAt);
  const lineItems = record.lineItems.map((item) => buildReviewedLineItem(item, item.descriptionNormalized));
  const grandTotal = options.syncHeaderGrandTotalToLineItems
    ? roundCurrency(lineItems.reduce((sum, item) => sum + item.lineTotal, 0))
    : roundCurrency(record.header.grandTotal);
  const selectedLineItemId = lineItems.some((item) => item.id === record.selectedLineItemId)
    ? record.selectedLineItemId
    : lineItems[0]?.id ?? null;
  const returnPolicySnippet = lineItems.some((item) => item.assetCandidateFlag)
    ? 'Return policy candidate detected: keep original receipt for item-level support.'
    : null;
  const warrantySnippet = lineItems.some((item) => item.assetCandidateFlag)
    ? 'Warranty candidate detected from durable-goods language and merchant pattern.'
    : null;
  const merchantProfile = buildRetailerProfile(merchant);
  const duplicateCandidates = buildDuplicateCandidates(siblingRecords, merchant, purchasedAt, grandTotal);
  const evidenceSpans = buildEvidenceSpans(record.id, lineItems, merchant, purchasedAt, grandTotal);

  const nextRecord: StoredReceiptRecord = {
    ...record,
    note: `${merchant} receipt changes saved. Parsed and structured layers now reflect the reviewed values.`,
    header: {
      ...record.header,
      merchantName: merchant,
      purchasedAt,
      grandTotal,
    },
    parsedData: {
      ...record.parsedData,
      rawText: buildRawText(merchant, purchasedAt, lineItems, grandTotal),
      fieldCandidates: [
        updateParsedFieldCandidate(record.parsedData.fieldCandidates[0], `${record.id}_field_merchant`, 'Merchant', merchant, 0.99, evidenceSpans),
        updateParsedFieldCandidate(record.parsedData.fieldCandidates[1], `${record.id}_field_date`, 'Purchase date', purchasedAt, 0.98, evidenceSpans),
        updateParsedFieldCandidate(record.parsedData.fieldCandidates[2], `${record.id}_field_total`, 'Grand total', `$${grandTotal.toFixed(2)}`, 0.97, evidenceSpans),
      ],
      lineItemCandidates: lineItems.map((item, index) =>
        updateParsedLineItemCandidate(record.parsedData.lineItemCandidates[index], item, record.id, evidenceSpans),
      ),
      returnPolicySnippet,
      warrantySnippet,
    },
    lineItems,
    selectedLineItemId,
    evidenceSpans,
    duplicateCandidates,
    structuredData: {
      ...record.structuredData,
      merchantMatchStatus: 'confirmed',
      merchantMatchConfidence: 0.98,
      thingCandidateCount: lineItems.filter((item) => item.assetCandidateFlag).length,
      returnPolicyStatus: returnPolicySnippet ? 'candidate' : 'not_found',
      warrantyStatus: warrantySnippet ? 'candidate' : 'not_found',
      retailerProfile: merchantProfile,
      taxTags: buildTaxTags(lineItems, merchant),
      lifestyleTags: buildLifestyleTags(lineItems, merchant),
      productCategories: buildProductCategories(lineItems),
      returnWindowLabel: lineItems.some((item) => item.assetCandidateFlag) ? 'Likely returnable purchase detected' : 'No notable returnability signal',
      warrantySupportLabel: lineItems.some((item) => item.assetCandidateFlag) ? 'Durable-goods warranty candidate detected' : 'No warranty signal detected',
    },
    searchDocument: {
      status: 'indexed',
      keywords: buildSearchKeywords(merchant, lineItems),
      textPreview: buildSearchPreview(merchant, lineItems),
      embeddingTerms: buildEmbeddingTerms(merchant, lineItems),
      embeddingVersion: record.searchDocument.embeddingVersion || 'receipt-embedding-v1',
    },
    alerts: buildAlerts({
      duplicateCandidates,
      merchant,
      lineItems,
      merchantProfile,
      sourceDocument: record.sourceDocument,
    }),
  };

  if (nextRecord.status === 'trusted') {
    nextRecord.purchaseProjection = buildPurchaseProjection(nextRecord, nextRecord.updatedAt);
    nextRecord.purchaseGraph = buildStoredPurchaseGraph(nextRecord, nextRecord.updatedAt);
  }

  return nextRecord;
}

function buildReviewedLineItem(item: ReceiptLineItemRecord, description: string): ReceiptLineItemRecord {
  const normalized = titleCase(description || item.descriptionNormalized);
  const objectEntry = resolveObjectDirectoryEntry(normalized);
  const assetCandidateFlag = objectEntry?.thingCandidate ?? looksLikeThing(normalized);

  return {
    ...item,
    descriptionNormalized: normalized,
    descriptionRaw: normalized.toUpperCase(),
    reviewState: 'edited',
    assetCandidateFlag,
    productMatchStatus: assetCandidateFlag ? 'confirmed' : 'unmatched',
    productMatchConfidence: assetCandidateFlag ? Math.max(item.productMatchConfidence, 0.88) : 0.42,
    householdTags: objectEntry?.householdTags ?? inferHouseholdTags(normalized),
    lemTags: objectEntry?.lemTags ?? inferLemTags(normalized),
  };
}

function updateParsedFieldCandidate(
  existing: ParsedFieldCandidate | undefined,
  id: string,
  label: string,
  value: string,
  confidence: number,
  evidenceSpans: EvidenceSpanRecord[],
): ParsedFieldCandidate {
  return {
    id,
    label,
    value,
    confidence,
    source: existing?.source ?? 'derived',
    evidenceSpanId: evidenceSpans.find((span) => span.label.toLowerCase() === label.toLowerCase())?.id ?? null,
  };
}

function updateParsedLineItemCandidate(
  existing: ParsedLineItemCandidate | undefined,
  item: ReceiptLineItemRecord,
  receiptId: string,
  evidenceSpans: EvidenceSpanRecord[],
): ParsedLineItemCandidate {
  return {
    id: existing?.id ?? `${receiptId}_candidate_line_${item.lineIndex}`,
    description: item.descriptionNormalized,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    lineTotal: item.lineTotal,
    confidence: Math.max(existing?.confidence ?? item.confidenceScore, item.confidenceScore),
    source: existing?.source ?? 'summary_fallback',
    thingCandidateHint: item.assetCandidateFlag,
    evidenceSpanId: evidenceSpans.find((span) => span.targetObjectId === item.id)?.id ?? null,
  };
}

function buildParsedData(params: {
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
  evidenceSpans: EvidenceSpanRecord[];
  lineItems: ReceiptLineItemRecord[];
  merchant: string;
  parserResult: ReturnType<typeof parseReceiptCaptureInput>;
  receiptDate: string;
  receiptId: string;
  sourceDocument: StoredSourceDocument;
  total: number;
}): StoredParsedData {
  const { draft, evidenceSpans, lineItems, merchant, parserResult, receiptDate, receiptId, sourceDocument, total } = params;
  const candidateSource = draft.itemCandidates?.length ? 'ocr' : 'summary_fallback';
  const merchantEvidence = evidenceSpans.find((span) => span.id === `${receiptId}_evidence_merchant`) ?? null;
  const dateEvidence = evidenceSpans.find((span) => span.id === `${receiptId}_evidence_date`) ?? null;
  const totalEvidence = evidenceSpans.find((span) => span.id === `${receiptId}_evidence_total`) ?? null;

  return {
    rawText: buildRawText(merchant, receiptDate, lineItems, total),
    fieldCandidates: [
      {
        id: `${receiptId}_field_merchant`,
        label: 'Merchant',
        value: merchant,
        confidence: draft.itemCandidates?.length ? 0.98 : 0.96,
        source: draft.itemCandidates?.length ? 'ocr' : 'derived',
        evidenceSpanId: merchantEvidence?.id ?? null,
      },
      {
        id: `${receiptId}_field_date`,
        label: 'Purchase date',
        value: receiptDate,
        confidence: draft.itemCandidates?.length ? 0.94 : 0.9,
        source: draft.itemCandidates?.length ? 'ocr' : 'derived',
        evidenceSpanId: dateEvidence?.id ?? null,
      },
      {
        id: `${receiptId}_field_total`,
        label: 'Grand total',
        value: `$${total.toFixed(2)}`,
        confidence: draft.itemCandidates?.length ? 0.84 : 0.88,
        source: draft.itemCandidates?.length ? 'ocr' : 'derived',
        evidenceSpanId: totalEvidence?.id ?? null,
      },
    ],
    lineItemCandidates: (draft.itemCandidates?.length ? draft.itemCandidates : lineItems).slice(0, 6).map((item, index) => ({
      id: `${receiptId}_candidate_line_${index + 1}`,
      description: 'descriptionNormalized' in item ? item.descriptionNormalized : titleCase(item.description),
      quantity: item.quantity,
      unitPrice: roundCurrency(item.unitPrice),
      lineTotal: roundCurrency(item.lineTotal),
      confidence: coerceConfidenceScore('confidence' in item ? item.confidence : item.confidenceScore),
      source: candidateSource,
      thingCandidateHint:
        'assetCandidateFlag' in item
          ? item.assetCandidateFlag
          : (resolveObjectDirectoryEntry(titleCase(item.description))?.thingCandidate ?? looksLikeThing(titleCase(item.description))),
      evidenceSpanId: evidenceSpans.find((span) => span.id === `${receiptId}_evidence_line_${index + 1}`)?.id ?? null,
    })),
    requestProvenance: {
      parserMode: parserResult.parserMode,
      parserVersion: parserResult.parserVersion,
      processingNote: parserResult.processingNote,
      sourceDocumentId: sourceDocument.id,
      sourceDocumentChecksum: sourceDocument.checksum,
      sourceFileCount: sourceDocument.sourceFiles.length,
      captureChannel: sourceDocument.captureChannel,
    },
    providerTrace: {
      providerId: parserResult.ocrRoute.provider.id,
      providerLabel: parserResult.ocrRoute.provider.displayName,
      routingMode: parserResult.ocrRoute.routingMode,
      evaluationStage: parserResult.ocrRoute.evaluationStage,
      fallbackProviderLabel: parserResult.ocrRoute.fallbackProvider?.displayName ?? null,
    },
    returnPolicySnippet: null,
    warrantySnippet: null,
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

function resolvePurchaseParticipationRole(relationshipType: string): ProjectedPurchaseParticipantRecord['participationRole'] {
  if (relationshipType === 'self') {
    return 'self';
  }

  if (['spouse', 'child', 'partner', 'parent'].includes(relationshipType)) {
    return 'household_member';
  }

  return 'shared_context';
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

function buildEmbeddingTerms(merchant: string, lineItems: ReceiptLineItemRecord[]) {
  const terms = new Set<string>();
  const merchantEntry = resolveMerchantDirectoryEntry(merchant);

  tokenizeInto(merchant, terms);
  merchantEntry?.aliases.forEach((alias) => tokenizeInto(alias, terms));
  merchantEntry?.defaultProductCategories.forEach((category) => tokenizeInto(category, terms));

  lineItems.forEach((item) => {
    tokenizeInto(item.descriptionNormalized, terms);
    item.householdTags.forEach((tag) => tokenizeInto(tag.replace(/_/g, ' '), terms));
    item.lemTags.forEach((tag) => tokenizeInto(tag.replace(/_/g, ' '), terms));

    const objectEntry = resolveObjectDirectoryEntry(item.descriptionNormalized);
    objectEntry?.keywords.forEach((keyword) => tokenizeInto(keyword, terms));
    objectEntry?.householdTags.forEach((tag) => tokenizeInto(tag.replace(/_/g, ' '), terms));
    objectEntry?.lemTags.forEach((tag) => tokenizeInto(tag.replace(/_/g, ' '), terms));
  });

  expandSemanticAliases(Array.from(terms)).forEach((term) => terms.add(term));

  return Array.from(terms).sort();
}

function buildSearchQueryTerms(query: string) {
  const terms = new Set<string>();
  tokenizeInto(query, terms);
  expandSemanticAliases(Array.from(terms)).forEach((term) => terms.add(term));
  return Array.from(terms);
}

function findBestEvidenceSpan(
  record: StoredReceiptRecord,
  purchaseLineItems: ProjectedPurchaseLineItemRecord[],
  queryTerms: string[],
) {
  const matchingLineItem = purchaseLineItems.find((item) =>
    queryTerms.some((term) =>
      item.description.toLowerCase().includes(term)
      || item.householdTags.some((tag) => tag.replace(/_/g, ' ').includes(term))
      || item.lemTags.some((tag) => tag.replace(/_/g, ' ').includes(term)),
    ),
  );

  if (matchingLineItem) {
    return record.evidenceSpans.find((span) => span.targetObjectId === matchingLineItem.sourceLineItemId) ?? null;
  }

  return record.evidenceSpans.find((span) => span.targetObjectType === 'purchase_line_item') ?? record.evidenceSpans[0] ?? null;
}

function buildGroundedCitations(
  record: StoredReceiptRecord,
  topThing: ProjectedThingRecord | null,
  topPerson: StoredReceiptRecord['peopleSuggestions'][number] | null,
  topEvidence: EvidenceSpanRecord | null,
) {
  const citations: GroundedReceiptAnswer['citations'] = [
    {
      type: 'receipt',
      id: record.id,
      label: `${record.header.merchantName} receipt`,
      action: `route:/ingest/${record.id}`,
    },
  ];

  if (topThing) {
    citations.push({
      type: 'thing',
      id: topThing.id,
      label: topThing.displayName,
      action: `route:/things/${topThing.id}`,
    });
  }

  if (topPerson) {
    citations.push({
      type: 'person',
      id: topPerson.id,
      label: topPerson.displayName,
      action: `route:/people/${topPerson.id}`,
    });
  }

  if (topEvidence) {
    citations.push({
      type: 'evidence',
      id: topEvidence.id,
      label: `Evidence: ${topEvidence.label}`,
      action: `route:/ingest/${record.id}`,
      snippet: topEvidence.snippet,
    });
  }

  return citations;
}

function buildGroundedStructuredResults(
  rankedMatches: Array<{
    match: SemanticReceiptSearchResult;
    record: StoredReceiptRecord;
    purchaseGraph: StoredPurchaseGraphRecords;
  }>,
) {
  return rankedMatches.flatMap(({ match, record, purchaseGraph }, index) => {
    const receiptResult: GroundedReceiptAnswer['structuredResults'][number] = {
      id: `grounded-receipt-${record.id}`,
      kind: 'receipt',
      title: `${record.header.merchantName} receipt`,
      body: `${formatGroundedDate(record.header.purchasedAt)} · ${purchaseGraph.purchaseLineItems.length} line items · matched on ${match.matchedTerms.slice(0, 3).join(', ') || 'stored receipt terms'}.`,
      actionLabel: 'Review receipt',
      action: `route:/ingest/${record.id}`,
      chips: [
        record.structuredData.retailerProfile,
        ...purchaseGraph.purchaseLineItems.slice(0, 2).map((item) => item.description),
      ],
    };

    const thingResult = purchaseGraph.thingRecords[0]
      ? {
          id: `grounded-thing-${purchaseGraph.thingRecords[0].id}`,
          kind: 'thing' as const,
          title: purchaseGraph.thingRecords[0].displayName,
          body: `${purchaseGraph.thingRecords[0].category} thing promoted from receipt review with linked support details ready.`,
          actionLabel: 'Open Thing',
          action: `route:/things/${purchaseGraph.thingRecords[0].id}`,
          chips: purchaseGraph.thingRecords[0].supportLabels.slice(0, 3),
        }
      : null;

    return index === 0 && thingResult ? [receiptResult, thingResult] : [receiptResult];
  });
}

function buildGroundedFollowUps(
  record: StoredReceiptRecord,
  topThing: ProjectedThingRecord | null,
  topPerson: StoredReceiptRecord['peopleSuggestions'][number] | null,
) {
  const followUps = ['Review the receipt'];

  if (topThing) {
    followUps.push(`Open ${topThing.displayName}`);
  }

  if (topPerson) {
    followUps.push(`Show ${topPerson.displayName}`);
  }

  followUps.push(`What else did I buy at ${record.header.merchantName}?`);

  return followUps;
}

function formatGroundedDate(value: string) {
  return value.split('T')[0] ?? value;
}

function joinWithAnd(values: string[]) {
  if (!values.length) {
    return 'captured line items';
  }

  if (values.length === 1) {
    return values[0];
  }

  if (values.length === 2) {
    return `${values[0]} and ${values[1]}`;
  }

  return `${values.slice(0, -1).join(', ')}, and ${values.at(-1)}`;
}

function tokenizeInto(value: string, target: Set<string>) {
  const normalized = value.toLowerCase().replace(/[^a-z0-9\s]+/g, ' ');
  const phrase = normalized.replace(/\s+/g, ' ').trim();

  if (!phrase) {
    return;
  }

  target.add(phrase);
  phrase.split(' ').filter(Boolean).forEach((part) => target.add(part));
}

function expandSemanticAliases(terms: string[]) {
  const expansions = new Set<string>();
  const aliasMap = buildSemanticAliasMap();

  terms.forEach((term) => {
    aliasMap.get(term)?.forEach((alias) => expansions.add(alias));
  });

  return Array.from(expansions);
}

let semanticAliasMapCache: Map<string, string[]> | null = null;

function buildSemanticAliasMap() {
  if (semanticAliasMapCache) {
    return semanticAliasMapCache;
  }

  const map = new Map<string, string[]>();
  const register = (key: string, aliases: string[]) => {
    map.set(key, Array.from(new Set(aliases)));
  };

  register('air fryer', ['fried food machine', 'kitchen appliance', 'appliance']);
  register('fried food machine', ['air fryer', 'kitchen appliance']);
  register('storage bench', ['entryway furniture', 'bench', 'home organization']);
  register('wall hooks', ['entryway hardware', 'home organization']);
  register('banana', ['produce', 'groceries']);
  register('groceries', ['banana', 'produce', 'food at home']);
  register('target', ['general merchandise', 'home']);
  register('safeway', ['groceries', 'produce', 'market']);

  listObjectDirectoryEntries().forEach((entry) => {
    entry.keywords.forEach((keyword) => {
      const aliases = [
        entry.category.toLowerCase(),
        entry.subcategory.toLowerCase(),
        ...entry.householdTags.map((tag) => tag.replace(/_/g, ' ')),
        ...entry.lemTags.map((tag) => tag.replace(/_/g, ' ')),
      ];
      register(keyword.toLowerCase(), [...(map.get(keyword.toLowerCase()) ?? []), ...aliases]);
    });
  });

  listMerchantDirectoryEntries().forEach((entry) => {
    entry.aliases.forEach((alias) => {
      register(alias.toLowerCase(), [...(map.get(alias.toLowerCase()) ?? []), ...entry.defaultProductCategories.map((value) => value.toLowerCase())]);
    });
  });

  semanticAliasMapCache = map;
  return map;
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
  duplicateCandidates: DuplicateCandidateRecord[];
  merchant: string;
  lineItems: ReceiptLineItemRecord[];
  merchantProfile: string;
  sourceDocument: StoredSourceDocument;
}) {
  const alerts: StoredReceiptRecord['alerts'] = [];

  if (params.duplicateCandidates.length) {
    const topCandidate = params.duplicateCandidates[0];
    alerts.push({
      id: nextId('alert_dup'),
      kind: 'duplicate',
      level: 'issue',
      title: 'Possible duplicate receipt',
      body: `We found a similar ${topCandidate?.matchedMerchantName ?? params.merchant} receipt from ${topCandidate?.matchedPurchasedAt.slice(0, 10) ?? 'recently'}. Review only if this looks like the same purchase.`,
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

function buildDuplicateCandidates(
  records: StoredReceiptRecord[],
  merchant: string,
  purchasedAt: string,
  total: number,
): DuplicateCandidateRecord[] {
  return records
    .filter((record) => {
    const sameMerchant = record.header.merchantName.toLowerCase() === merchant.toLowerCase();
    const sameDay = record.header.purchasedAt.slice(0, 10) === purchasedAt.slice(0, 10);
    const totalDelta = Math.abs(record.header.grandTotal - total);

    return sameMerchant && sameDay && totalDelta < 3;
    })
    .map((record) => {
      const totalDelta = roundCurrency(Math.abs(record.header.grandTotal - total));
      const confidenceScore = Math.max(0.72, roundCurrency(0.98 - (totalDelta / 10)));

      return {
        id: `dup_${record.id}_${slugify(`${merchant}-${purchasedAt}`)}`,
        matchedReceiptId: record.id,
        matchedMerchantName: record.header.merchantName,
        matchedPurchasedAt: record.header.purchasedAt,
        matchedGrandTotal: record.header.grandTotal,
        matchedStatus: record.status,
        totalDelta,
        confidenceScore,
        note: `Possible duplicate based on same merchant, same purchase day, and only $${totalDelta.toFixed(2)} difference in total.`,
      };
    })
    .sort((left, right) =>
      right.confidenceScore - left.confidenceScore
      || left.totalDelta - right.totalDelta
      || right.matchedPurchasedAt.localeCompare(left.matchedPurchasedAt),
    );
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

function coerceCurrencyValue(value: string, fallback: number) {
  const numeric = Number.parseFloat(value.replace(/[^0-9.-]+/g, ''));
  return Number.isFinite(numeric) ? roundCurrency(numeric) : fallback;
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
