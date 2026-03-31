import { describe, expect, it } from 'vitest';

import { resolveReceiptOcrRuntimeConfig } from './config';

describe('receipt OCR runtime config', () => {
  it('marks Gemini as configured when a backend API key is present', () => {
    const runtime = resolveReceiptOcrRuntimeConfig({
      env: {
        GEMINI_API_KEY: 'gemini-secret',
      },
    });

    expect(runtime.providers.google_gemini_2_5_flash.configured).toBe(true);
    expect(runtime.providers.google_gemini_2_5_flash.authMode).toBe('gemini_api_key');
    expect(runtime.providers.google_gemini_2_5_flash.missingSecrets).toEqual([]);
  });

  it('prefers Vertex auth metadata when project and location are present', () => {
    const runtime = resolveReceiptOcrRuntimeConfig({
      environment: 'production',
      env: {
        GOOGLE_CLOUD_PROJECT: 'm2m-prod',
        VERTEX_AI_LOCATION: 'us-central1',
      },
    });

    expect(runtime.providers.google_gemini_2_5_flash.configured).toBe(true);
    expect(runtime.providers.google_gemini_2_5_flash.authMode).toBe('vertex_adc');
  });

  it('reports missing secrets when neither provider is configured', () => {
    const runtime = resolveReceiptOcrRuntimeConfig({
      env: {},
    });

    expect(runtime.providers.google_gemini_2_5_flash.configured).toBe(false);
    expect(runtime.providers.google_gemini_2_5_flash.missingSecrets).toEqual(['GEMINI_API_KEY']);
    expect(runtime.providers.openai_gpt_4o_mini.configured).toBe(false);
    expect(runtime.providers.openai_gpt_4o_mini.missingSecrets).toEqual(['OPENAI_API_KEY']);
  });
});
