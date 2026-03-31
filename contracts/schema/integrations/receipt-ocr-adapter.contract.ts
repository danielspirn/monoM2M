export type ReceiptOcrBackendEnvironment = 'local' | 'staging' | 'production';

export type ReceiptOcrProviderId =
  | 'google_gemini_2_5_flash'
  | 'openai_gpt_4o_mini';

export type ReceiptOcrAuthMode =
  | 'gemini_api_key'
  | 'vertex_adc'
  | 'openai_api_key';

export type ReceiptOcrSecretName =
  | 'GEMINI_API_KEY'
  | 'GOOGLE_API_KEY'
  | 'OPENAI_API_KEY'
  | 'GOOGLE_CLOUD_PROJECT'
  | 'VERTEX_AI_LOCATION'
  | 'RECEIPT_DOCUMENT_SIGNING_SECRET'
  | 'RECEIPT_OCR_WEBHOOK_SECRET';

export type ReceiptOcrSecretRequirement = {
  secretName: ReceiptOcrSecretName;
  environments: ReceiptOcrBackendEnvironment[];
  requiredWhen: string;
  storageLocation: 'server_env' | 'secret_manager' | 'cloud_identity';
  notes: string;
};

export type ReceiptOcrBackendProviderConfig = {
  providerId: ReceiptOcrProviderId;
  enabled: boolean;
  authMode: ReceiptOcrAuthMode;
  secretNames: ReceiptOcrSecretName[];
  fileUploadMode: 'proxy_through_backend' | 'signed_storage_upload';
  supportsBatch: boolean;
};

export type ReceiptOcrBackendRequest = {
  tenantId: string;
  householdId?: string;
  sourceDocumentId: string;
  extractionRunId: string;
  sourceMimeType: string;
  sourceObjectPath: string;
  captureChannel:
    | 'upload_photo'
    | 'multi_receipt_photo'
    | 'quick_snap'
    | 'upload_pdf'
    | 'email_forward'
    | 'video_capture';
  requestedProviderId?: ReceiptOcrProviderId;
  fallbackAllowed: boolean;
};

export type ReceiptOcrBackendResult = {
  providerId: ReceiptOcrProviderId;
  modelName: string;
  authMode: ReceiptOcrAuthMode;
  vendorRequestId?: string;
  processingMs?: number;
  estimatedCostUsd?: number;
  documentMode?: 'single_receipt' | 'multi_receipt' | 'pdf_document';
  rawText: string;
  fieldCandidates: Array<{
    label: string;
    value: string;
    confidence: number;
  }>;
  lineItemCandidates: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    confidence: number;
  }>;
  receiptCandidates?: Array<{
    candidateId: string;
    rawText: string;
    fieldCandidates: Array<{
      label: string;
      value: string;
      confidence: number;
    }>;
    lineItemCandidates: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
      confidence: number;
    }>;
  }>;
};

export const receiptOcrBackendProviderConfigs: ReceiptOcrBackendProviderConfig[] = [
  {
    providerId: 'google_gemini_2_5_flash',
    enabled: true,
    authMode: 'gemini_api_key',
    secretNames: ['GEMINI_API_KEY'],
    fileUploadMode: 'proxy_through_backend',
    supportsBatch: true,
  },
  {
    providerId: 'openai_gpt_4o_mini',
    enabled: true,
    authMode: 'openai_api_key',
    secretNames: ['OPENAI_API_KEY'],
    fileUploadMode: 'proxy_through_backend',
    supportsBatch: true,
  },
];

export const receiptOcrSecretRequirements: ReceiptOcrSecretRequirement[] = [
  {
    secretName: 'GEMINI_API_KEY',
    environments: ['local', 'staging'],
    requiredWhen: 'Using Gemini Developer API from the backend for non-production or early production spikes.',
    storageLocation: 'server_env',
    notes: 'Never expose this to the browser or mobile client.',
  },
  {
    secretName: 'GOOGLE_CLOUD_PROJECT',
    environments: ['staging', 'production'],
    requiredWhen: 'Routing Gemini OCR through Vertex AI-managed infrastructure.',
    storageLocation: 'cloud_identity',
    notes: 'Used with service identity and Application Default Credentials.',
  },
  {
    secretName: 'VERTEX_AI_LOCATION',
    environments: ['staging', 'production'],
    requiredWhen: 'Routing Gemini OCR through Vertex AI-managed infrastructure.',
    storageLocation: 'server_env',
    notes: 'Keep this alongside project and adapter configuration, not in client config.',
  },
  {
    secretName: 'OPENAI_API_KEY',
    environments: ['local', 'staging', 'production'],
    requiredWhen: 'Enabling the lower-cost fallback OCR provider from the backend.',
    storageLocation: 'secret_manager',
    notes: 'Use a project-scoped key and rotate it independently of the Gemini credential.',
  },
  {
    secretName: 'RECEIPT_DOCUMENT_SIGNING_SECRET',
    environments: ['staging', 'production'],
    requiredWhen: 'Issuing short-lived document upload or download signatures for private receipt storage.',
    storageLocation: 'secret_manager',
    notes: 'This becomes mandatory if the client uploads directly to object storage.',
  },
  {
    secretName: 'RECEIPT_OCR_WEBHOOK_SECRET',
    environments: ['staging', 'production'],
    requiredWhen: 'Accepting asynchronous OCR callbacks, batch completions, or provider webhooks.',
    storageLocation: 'secret_manager',
    notes: 'Not needed until webhook-based OCR orchestration exists.',
  },
];
