import type {
  ReceiptOcrBackendRequest,
  ReceiptOcrBackendResult,
  ReceiptOcrProviderId,
} from './receipt-ocr-adapter.contract';

export type ReceiptProcessingFieldCandidate = ReceiptOcrBackendResult['fieldCandidates'][number];
export type ReceiptProcessingLineItemCandidate = ReceiptOcrBackendResult['lineItemCandidates'][number];
export type ReceiptProcessingCaptureChannel = ReceiptOcrBackendRequest['captureChannel'];

export type ReceiptProcessingCreateRequest = {
  tenantId?: string;
  householdId?: string;
  fileName: string;
  mimeType: string;
  base64Data: string;
  captureChannel: ReceiptProcessingCaptureChannel;
  requestedProviderId?: ReceiptOcrProviderId;
  fallbackAllowed?: boolean;
};

export type ReceiptProcessingSummary = {
  merchantName: string | null;
  purchaseDate: string | null;
  grandTotal: string | null;
};

export type ReceiptProcessingSourceDocumentRecord = {
  id: string;
  tenantId: string;
  householdId: string | null;
  fileName: string;
  mimeType: string;
  captureChannel: ReceiptProcessingCaptureChannel;
  checksum: string;
  byteSize: number;
  createdAt: string;
  storageMode: 'dev_local_json';
};

export type ReceiptProcessingExtractionRunRecord = {
  id: string;
  status: 'completed';
  providerId: ReceiptOcrProviderId;
  providerLabel: string;
  modelName: string;
  parserVersion: string;
  promptVersion: string;
  startedAt: string;
  completedAt: string;
  vendorRequestId: string | null;
  processingMs: number | null;
  estimatedCostUsd: number | null;
  documentMode: ReceiptOcrBackendResult['documentMode'] | null;
};

export type ReceiptProcessingOcrRecord = {
  summary: ReceiptProcessingSummary;
  rawText: string;
  fieldCandidates: ReceiptProcessingFieldCandidate[];
  lineItemCandidates: ReceiptProcessingLineItemCandidate[];
};

export type ReceiptProcessingRecord = {
  id: string;
  createdAt: string;
  sourceDocument: ReceiptProcessingSourceDocumentRecord;
  extractionRun: ReceiptProcessingExtractionRunRecord;
  ocr: ReceiptProcessingOcrRecord;
};

export type ReceiptProcessingCreateResponse = {
  record: ReceiptProcessingRecord;
  ocrPayload: {
    providerId: ReceiptOcrProviderId;
    providerLabel: string;
    modelName: string;
    parserVersion: string;
    rawText: string;
    merchantName: string | null;
    purchaseDate: string | null;
    grandTotal: string | null;
    fieldCandidates: ReceiptProcessingFieldCandidate[];
    lineItemCandidates: ReceiptProcessingLineItemCandidate[];
  };
};

export type ReceiptProcessingListResponse = {
  records: ReceiptProcessingRecord[];
};
