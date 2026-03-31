import type { ReceiptOcrBackendRequest, ReceiptOcrProviderId } from '@/contracts/schema/integrations/receipt-ocr-adapter.contract';

import type { PreparedReceiptOcrExecution } from './gateway';

export type ReceiptOcrProviderTransportEnvelope = {
  providerId: ReceiptOcrProviderId;
  transport: 'sdk_or_http';
  modelName: string;
  authMode: PreparedReceiptOcrExecution['authMode'];
  sourceDocumentId: string;
  extractionRunId: string;
  payload: Record<string, unknown>;
};

export function buildReceiptOcrTransportEnvelope(
  request: ReceiptOcrBackendRequest,
  prepared: PreparedReceiptOcrExecution,
): ReceiptOcrProviderTransportEnvelope {
  if (prepared.providerId === 'google_gemini_2_5_flash') {
    return {
      providerId: prepared.providerId,
      transport: 'sdk_or_http',
      modelName: prepared.modelName,
      authMode: prepared.authMode,
      sourceDocumentId: request.sourceDocumentId,
      extractionRunId: request.extractionRunId,
      payload: {
        modality: request.sourceMimeType,
        sourceObjectPath: request.sourceObjectPath,
        prompt: prepared.prompt,
        responseFormat: 'json',
      },
    };
  }

  return {
    providerId: prepared.providerId,
    transport: 'sdk_or_http',
    modelName: prepared.modelName,
    authMode: prepared.authMode,
    sourceDocumentId: request.sourceDocumentId,
    extractionRunId: request.extractionRunId,
    payload: {
      modality: request.sourceMimeType,
      sourceObjectPath: request.sourceObjectPath,
      prompt: prepared.prompt,
      responseFormat: 'json',
    },
  };
}
