import { describe, expect, it } from 'vitest';

import type { ReceiptOcrBackendRequest } from '@/contracts/schema/integrations/receipt-ocr-adapter.contract';

import { resolveReceiptOcrRuntimeConfig } from './config';
import { prepareReceiptOcrExecution } from './gateway';
import { buildReceiptOcrTransportEnvelope } from './providers';

const baseRequest: ReceiptOcrBackendRequest = {
  tenantId: 'tenant_demo',
  householdId: 'household_demo',
  sourceDocumentId: 'srcdoc_123',
  extractionRunId: 'extract_123',
  sourceMimeType: 'image/jpeg',
  sourceObjectPath: 'private/receipts/srcdoc_123.jpg',
  captureChannel: 'upload_photo',
  fallbackAllowed: true,
};

describe('receipt OCR gateway', () => {
  it('prepares Gemini execution when Gemini credentials are present', () => {
    const runtime = resolveReceiptOcrRuntimeConfig({
      env: {
        GEMINI_API_KEY: 'gemini-secret',
      },
    });

    const prepared = prepareReceiptOcrExecution(baseRequest, runtime);

    expect(prepared.providerId).toBe('google_gemini_2_5_flash');
    expect(prepared.liveCallReady).toBe(true);
    expect(prepared.promptVersion).toBe('receipt-ocr-server-prompt-v1');
  });

  it('can route to the fallback when requested and configured', () => {
    const runtime = resolveReceiptOcrRuntimeConfig({
      env: {
        OPENAI_API_KEY: 'openai-secret',
      },
    });

    const prepared = prepareReceiptOcrExecution(
      {
        ...baseRequest,
        requestedProviderId: 'openai_gpt_4o_mini',
      },
      runtime,
    );

    expect(prepared.providerId).toBe('openai_gpt_4o_mini');
    expect(prepared.liveCallReady).toBe(true);

    const transport = buildReceiptOcrTransportEnvelope(baseRequest, prepared);
    expect(transport.payload).toMatchObject({
      sourceObjectPath: 'private/receipts/srcdoc_123.jpg',
      responseFormat: 'json',
    });
  });

  it('surfaces missing backend secrets without changing the client flow', () => {
    const runtime = resolveReceiptOcrRuntimeConfig({
      env: {},
    });

    const prepared = prepareReceiptOcrExecution(baseRequest, runtime);

    expect(prepared.providerId).toBe('google_gemini_2_5_flash');
    expect(prepared.liveCallReady).toBe(false);
    expect(prepared.missingSecrets).toEqual(['GEMINI_API_KEY']);
  });
});
