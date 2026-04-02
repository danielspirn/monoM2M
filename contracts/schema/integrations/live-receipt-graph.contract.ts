export type LiveReceiptGraphLineItemRecord = {
  id: string;
  description: string;
  lineTotal: number;
  reviewState: 'auto' | 'edited' | 'needs_review';
  thingCandidate: boolean;
};

export type LiveReceiptGraphRecord = {
  id: string;
  syncedAt: string;
  receipt: {
    id: string;
    status: 'processing' | 'needs_review' | 'trusted';
    sourceType: 'receipt_image' | 'receipt_pdf';
    capturedAt: string;
  };
  header: {
    merchantName: string;
    purchasedAt: string;
    grandTotal: number;
    currency: string;
  };
  sourceDocument: {
    id: string;
    fileName: string;
    mimeType: string;
    captureChannel: string;
    sourceFileCount: number;
    checksum: string;
    detectedReceiptCount: number;
  };
  extractionRun: {
    id: string;
    status: 'queued' | 'processing' | 'completed';
    stage: string;
    stageLabel: string;
    providerLabel: string;
    parserVersion: string;
  };
  parsedData: {
    parserMode: string;
    parserVersion: string;
    providerLabel: string;
    sourceFileCount: number;
    sourceDocumentChecksum: string;
    backendProcessingRecordId: string | null;
    backendExtractionRunId: string | null;
    backendSourceDocumentId: string | null;
    fieldCandidateCount: number;
    lineItemCandidateCount: number;
  };
  lineItems: LiveReceiptGraphLineItemRecord[];
  alertCount: number;
  duplicateCandidateCount: number;
  reviewDecisionCount: number;
};

export type LiveReceiptGraphUpsertRequest = {
  record: LiveReceiptGraphRecord;
};

export type LiveReceiptGraphUpsertResponse = {
  record: LiveReceiptGraphRecord;
};

export type LiveReceiptGraphListResponse = {
  records: LiveReceiptGraphRecord[];
};

export type LiveReceiptGraphGetResponse = {
  record: LiveReceiptGraphRecord;
};
