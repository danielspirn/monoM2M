import type {
  ReceiptOcrAuthMode,
  ReceiptOcrBackendRequest,
  ReceiptOcrProviderId,
} from '@/contracts/schema/integrations/receipt-ocr-adapter.contract';

import { resolveReceiptOcrRuntimeConfig, type ReceiptOcrRuntimeConfig } from './config';
import { buildReceiptOcrPrompt } from './prompt';

export type PreparedReceiptOcrExecution = {
  providerId: ReceiptOcrProviderId;
  modelName: string;
  authMode: ReceiptOcrAuthMode;
  documentStorageMode: 'proxy_through_backend' | 'signed_storage_upload';
  liveCallReady: boolean;
  promptVersion: string;
  prompt: string;
  fileHandlingStrategy: 'backend_fetches_private_source' | 'signed_storage_url';
  reason: string;
  missingSecrets: string[];
};

export function prepareReceiptOcrExecution(
  request: ReceiptOcrBackendRequest,
  runtimeConfig = resolveReceiptOcrRuntimeConfig(),
): PreparedReceiptOcrExecution {
  const providerId = resolveProviderId(request, runtimeConfig);
  const provider = runtimeConfig.providers[providerId];

  if (!provider) {
    throw new Error(`Receipt OCR provider "${providerId}" is not registered.`);
  }

  const prompt = buildReceiptOcrPrompt(request);

  return {
    providerId,
    modelName: provider.modelName,
    authMode: provider.authMode,
    documentStorageMode: runtimeConfig.documentStorageMode,
    liveCallReady: provider.configured,
    promptVersion: 'receipt-ocr-server-prompt-v1',
    prompt,
    fileHandlingStrategy:
      runtimeConfig.documentStorageMode === 'signed_storage_upload'
        ? 'signed_storage_url'
        : 'backend_fetches_private_source',
    reason: provider.configured
      ? `Backend provider ${providerId} is configured and ready for a live OCR call.`
      : `Backend provider ${providerId} is selected, but secrets are not configured yet.`,
    missingSecrets: provider.missingSecrets,
  };
}

function resolveProviderId(
  request: ReceiptOcrBackendRequest,
  runtimeConfig: ReceiptOcrRuntimeConfig,
): ReceiptOcrProviderId {
  const requestedProviderId = request.requestedProviderId;

  if (requestedProviderId) {
    return requestedProviderId;
  }

  if (runtimeConfig.providers.google_gemini_2_5_flash.configured) {
    return 'google_gemini_2_5_flash';
  }

  if (request.fallbackAllowed && runtimeConfig.providers.openai_gpt_4o_mini.configured) {
    return 'openai_gpt_4o_mini';
  }

  return 'google_gemini_2_5_flash';
}
