import { mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import type { IncomingMessage, ServerResponse } from 'node:http';

import type { ReceiptOcrBackendRequest } from '@/contracts/schema/integrations/receipt-ocr-adapter.contract';

import { deriveReceiptOcrSummary } from './normalize';
import { executeGeminiReceiptOcrFromFile } from './gemini';
import { executeOpenAiReceiptOcrFromFile } from './openai';
import { prepareReceiptOcrExecution } from './gateway';

type ReceiptOcrHttpRequestBody = {
  fileName: string;
  mimeType: string;
  base64Data: string;
  captureChannel: ReceiptOcrBackendRequest['captureChannel'];
  requestedProviderId?: ReceiptOcrBackendRequest['requestedProviderId'];
  fallbackAllowed?: boolean;
};

export async function handleReceiptOcrHttpRequest(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  try {
    const body = await readJsonBody<ReceiptOcrHttpRequestBody>(req);
    const tempDir = path.join(os.tmpdir(), 'm2m-receipt-ocr');
    await mkdir(tempDir, { recursive: true });
    const tempFilePath = path.join(tempDir, `${Date.now()}-${sanitizeFileName(body.fileName)}`);

    await writeFile(tempFilePath, Buffer.from(body.base64Data, 'base64'));

    try {
      const request: ReceiptOcrBackendRequest = {
        tenantId: 'local-dev',
        sourceDocumentId: `srcdoc_${Date.now()}`,
        extractionRunId: `extract_${Date.now()}`,
        sourceMimeType: body.mimeType,
        sourceObjectPath: tempFilePath,
        captureChannel: body.captureChannel,
        requestedProviderId: body.requestedProviderId,
        fallbackAllowed: body.fallbackAllowed ?? true,
      };
      const execution = prepareReceiptOcrExecution(request);

      if (!execution.liveCallReady) {
        throw new Error(`OCR provider ${execution.providerId} is not configured. Missing: ${execution.missingSecrets.join(', ')}`);
      }

      const result = execution.providerId === 'openai_gpt_4o_mini'
        ? await executeOpenAiReceiptOcrFromFile({ request, filePath: tempFilePath })
        : await executeGeminiReceiptOcrFromFile({ request, filePath: tempFilePath });
      const summary = deriveReceiptOcrSummary(result);

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        providerId: result.providerId,
        providerLabel: toProviderLabel(result.providerId),
        modelName: result.modelName,
        parserVersion: 'live_backend_ocr_v1',
        rawText: result.rawText,
        merchantName: summary.merchantName,
        purchaseDate: summary.purchaseDate,
        grandTotal: summary.grandTotal,
        fieldCandidates: result.fieldCandidates,
        lineItemCandidates: result.lineItemCandidates,
      }));
    } finally {
      await rm(tempFilePath, { force: true });
    }
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown OCR error',
    }));
  }
}

async function readJsonBody<T>(req: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as T;
}

function sanitizeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '_');
}

function toProviderLabel(providerId: 'google_gemini_2_5_flash' | 'openai_gpt_4o_mini') {
  return providerId === 'openai_gpt_4o_mini' ? 'OpenAI GPT-4o mini' : 'Google Gemini 2.5 Flash';
}
