import type { ReceiptOcrProviderId, ReceiptOcrProviderProfile } from './types';

const fixtureCatalogProfile: ReceiptOcrProviderProfile = {
  id: 'internal_fixture_catalog',
  vendorId: 'internal',
  displayName: 'Fixture catalog',
  modelName: 'receipt-fixture-catalog-v1',
  asOfDate: '2026-03-31',
  supportedInputs: ['single_receipt_image', 'multi_receipt_image', 'receipt_pdf', 'receipt_video_frame_set'],
  supportsStructuredOutputs: true,
  supportsFileUploads: false,
  supportsBatch: false,
  inputPriceUsdPer1M: '0.00',
  outputPriceUsdPer1M: '0.00',
  strengths: [
    'Deterministic development fixtures',
    'No external document transfer',
  ],
  riskNotes: [
    'Only covers known repo fixtures.',
    'Not representative of arbitrary user uploads.',
  ],
};

const googleGemini25FlashProfile: ReceiptOcrProviderProfile = {
  id: 'google_gemini_2_5_flash',
  vendorId: 'google',
  displayName: 'Google Gemini OCR',
  modelName: 'gemini-2.5-flash',
  asOfDate: '2026-03-31',
  supportedInputs: ['single_receipt_image', 'multi_receipt_image', 'receipt_pdf', 'receipt_video_frame_set'],
  supportsStructuredOutputs: true,
  supportsFileUploads: true,
  supportsBatch: true,
  inputPriceUsdPer1M: '0.30 (text/image/video)',
  outputPriceUsdPer1M: '2.50',
  batchInputPriceUsdPer1M: '0.15 (text/image/video)',
  batchOutputPriceUsdPer1M: '1.25',
  sourceUrl: 'https://ai.google.dev/gemini-api/docs/pricing',
  strengths: [
    'Broad multimodal coverage for images, PDFs, and video frames',
    'Good fit for one upload splitting into multiple receipts',
    'Supports structured outputs and file upload workflows',
  ],
  riskNotes: [
    'Production rollout should stay gated behind receipt-quality evals.',
    'Prompt and schema changes should be versioned to preserve evidence traceability.',
  ],
};

const openAiGpt4oMiniProfile: ReceiptOcrProviderProfile = {
  id: 'openai_gpt_4o_mini',
  vendorId: 'openai',
  displayName: 'OpenAI OCR fallback',
  modelName: 'gpt-4o-mini',
  asOfDate: '2026-03-31',
  supportedInputs: ['single_receipt_image'],
  supportsStructuredOutputs: true,
  supportsFileUploads: true,
  supportsBatch: true,
  inputPriceUsdPer1M: '0.15',
  outputPriceUsdPer1M: '0.60',
  batchInputPriceUsdPer1M: '0.15',
  batchOutputPriceUsdPer1M: '0.60',
  sourceUrl: 'https://developers.openai.com/api/docs/models/gpt-4o-mini',
  strengths: [
    'Lower-cost fallback for single receipt images',
    'Supports image input and structured outputs',
  ],
  riskNotes: [
    'Fallback is intentionally limited to single-image receipts until split and PDF evals pass.',
    'Do not auto-route sensitive receipt traffic here without passing the shared eval gate.',
  ],
};

export const receiptOcrProviderProfiles: Record<ReceiptOcrProviderId, ReceiptOcrProviderProfile> = {
  internal_fixture_catalog: fixtureCatalogProfile,
  google_gemini_2_5_flash: googleGemini25FlashProfile,
  openai_gpt_4o_mini: openAiGpt4oMiniProfile,
};

export function getReceiptOcrProviderProfile(providerId: ReceiptOcrProviderId) {
  return receiptOcrProviderProfiles[providerId];
}
