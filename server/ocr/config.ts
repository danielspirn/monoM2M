import type {
  ReceiptOcrAuthMode,
  ReceiptOcrBackendEnvironment,
  ReceiptOcrProviderId,
} from '@/contracts/schema/integrations/receipt-ocr-adapter.contract';

export type ReceiptOcrProviderRuntimeConfig = {
  providerId: ReceiptOcrProviderId;
  configured: boolean;
  authMode: ReceiptOcrAuthMode;
  missingSecrets: string[];
  modelName: string;
};

export type ReceiptOcrRuntimeConfig = {
  environment: ReceiptOcrBackendEnvironment;
  documentStorageMode: 'proxy_through_backend' | 'signed_storage_upload';
  providers: Record<ReceiptOcrProviderId, ReceiptOcrProviderRuntimeConfig>;
};

export function resolveReceiptOcrRuntimeConfig(params?: {
  environment?: ReceiptOcrBackendEnvironment;
  env?: Record<string, string | undefined>;
  documentStorageMode?: 'proxy_through_backend' | 'signed_storage_upload';
}): ReceiptOcrRuntimeConfig {
  const environment = params?.environment ?? 'local';
  const env = params?.env ?? process.env;
  const documentStorageMode = params?.documentStorageMode ?? 'proxy_through_backend';

  const geminiAuthMode: ReceiptOcrAuthMode =
    hasVertexCredentials(env) ? 'vertex_adc' : 'gemini_api_key';

  return {
    environment,
    documentStorageMode,
    providers: {
      google_gemini_2_5_flash: {
        providerId: 'google_gemini_2_5_flash',
        configured: hasGeminiCredentials(env),
        authMode: geminiAuthMode,
        missingSecrets: collectGeminiMissingSecrets(env, geminiAuthMode),
        modelName: 'gemini-2.5-flash',
      },
      openai_gpt_4o_mini: {
        providerId: 'openai_gpt_4o_mini',
        configured: Boolean(env.OPENAI_API_KEY),
        authMode: 'openai_api_key',
        missingSecrets: env.OPENAI_API_KEY ? [] : ['OPENAI_API_KEY'],
        modelName: 'gpt-4o-mini',
      },
    },
  };
}

function hasGeminiCredentials(env: Record<string, string | undefined>) {
  return hasVertexCredentials(env) || Boolean(env.GEMINI_API_KEY || env.GOOGLE_API_KEY);
}

function hasVertexCredentials(env: Record<string, string | undefined>) {
  return Boolean(env.GOOGLE_CLOUD_PROJECT && env.VERTEX_AI_LOCATION);
}

function collectGeminiMissingSecrets(
  env: Record<string, string | undefined>,
  authMode: ReceiptOcrAuthMode,
) {
  if (authMode === 'vertex_adc') {
    const missing: string[] = [];

    if (!env.GOOGLE_CLOUD_PROJECT) {
      missing.push('GOOGLE_CLOUD_PROJECT');
    }

    if (!env.VERTEX_AI_LOCATION) {
      missing.push('VERTEX_AI_LOCATION');
    }

    return missing;
  }

  return env.GEMINI_API_KEY || env.GOOGLE_API_KEY ? [] : ['GEMINI_API_KEY'];
}
