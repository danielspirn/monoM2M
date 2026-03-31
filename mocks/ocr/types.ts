export type ReceiptOcrInputKind =
  | 'single_receipt_image'
  | 'multi_receipt_image'
  | 'receipt_pdf'
  | 'receipt_video_frame_set';

export type ReceiptOcrVendorId = 'internal' | 'google' | 'openai';

export type ReceiptOcrProviderId =
  | 'internal_fixture_catalog'
  | 'google_gemini_2_5_flash'
  | 'openai_gpt_4o_mini';

export type ReceiptOcrRoutingMode =
  | 'fixture_catalog_short_circuit'
  | 'vendor_primary'
  | 'vendor_fallback'
  | 'manual_seed';

export type ReceiptOcrEvaluationStage =
  | 'not_required'
  | 'shadow_eval_required'
  | 'fallback_approved'
  | 'hold';

export type ReceiptOcrProviderProfile = {
  id: ReceiptOcrProviderId;
  vendorId: ReceiptOcrVendorId;
  displayName: string;
  modelName: string;
  asOfDate: string;
  supportedInputs: ReceiptOcrInputKind[];
  supportsStructuredOutputs: boolean;
  supportsFileUploads: boolean;
  supportsBatch: boolean;
  inputPriceUsdPer1M: string;
  outputPriceUsdPer1M: string;
  batchInputPriceUsdPer1M?: string;
  batchOutputPriceUsdPer1M?: string;
  sourceUrl?: string;
  strengths: string[];
  riskNotes: string[];
};

export type ReceiptOcrEvaluationPolicy = {
  version: string;
  overallMinimumScore: number;
  lineItemMinimumScore: number;
  duplicatePrecisionMinimumScore: number;
  splitAccuracyMinimumScore: number;
  minimumCostSavingsRatioForFallback: number;
};

export type ReceiptOcrEvaluationScorecard = {
  overallScore: number;
  merchantAccuracy: number;
  dateAccuracy: number;
  totalAccuracy: number;
  lineItemAccuracy: number;
  splitAccuracy: number;
  duplicatePrecision: number;
  estimatedCostSavingsRatio: number;
};

export type ReceiptOcrRouteSelection = {
  inputKind: ReceiptOcrInputKind;
  routingMode: ReceiptOcrRoutingMode;
  provider: ReceiptOcrProviderProfile;
  fallbackProvider: ReceiptOcrProviderProfile | null;
  evaluationPolicy: ReceiptOcrEvaluationPolicy;
  evaluationStage: ReceiptOcrEvaluationStage;
  recommendedForProduction: boolean;
  reason: string;
};
