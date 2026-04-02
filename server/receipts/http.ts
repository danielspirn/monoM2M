import { mkdir, rm, writeFile } from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

import type { ReceiptOcrBackendRequest } from '../../contracts/schema/integrations/receipt-ocr-adapter.contract';
import type {
  ReceiptProcessingCreateRequest,
  ReceiptProcessingCreateResponse,
  ReceiptProcessingGetResponse,
  ReceiptProcessingListResponse,
} from '../../contracts/schema/integrations/receipt-processing.contract';
import { deriveReceiptOcrSummary } from '../ocr/normalize';
import { executeGeminiReceiptOcrFromFile } from '../ocr/gemini';
import { prepareReceiptOcrExecution } from '../ocr/gateway';
import { executeOpenAiReceiptOcrFromFile } from '../ocr/openai';

import { buildDocumentChecksum, getProcessedReceiptRecordById, listProcessedReceiptRecords, persistProcessedReceiptRecord } from './store';

const LIVE_PARSER_VERSION = 'live_backend_ocr_v2';

export async function handleReceiptProcessingHttpRequest(req: IncomingMessage, res: ServerResponse) {
  if (req.method === 'GET') {
    const recordId = readRecordIdFromUrl(req.url);

    if (recordId) {
      const record = await getProcessedReceiptRecordById(recordId);

      if (!record) {
        sendJson(res, 404, { error: `Receipt processing record ${recordId} was not found` });
        return;
      }

      sendJson<ReceiptProcessingGetResponse>(res, 200, { record });
      return;
    }

    const records = await listProcessedReceiptRecords();
    sendJson<ReceiptProcessingListResponse>(res, 200, { records });
    return;
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  try {
    const body = await readJsonBody<ReceiptProcessingCreateRequest>(req);
    const fileBuffer = Buffer.from(body.base64Data, 'base64');
    const tempDir = path.join(os.tmpdir(), 'm2m-receipt-processing');
    await mkdir(tempDir, { recursive: true });
    const tempFilePath = path.join(tempDir, `${Date.now()}-${sanitizeFileName(body.fileName)}`);
    const sourceDocumentId = `srcdoc_${randomUUID()}`;
    const extractionRunId = `extract_${randomUUID()}`;

    await writeFile(tempFilePath, fileBuffer);

    try {
      const request: ReceiptOcrBackendRequest = {
        tenantId: body.tenantId ?? 'local-dev',
        householdId: body.householdId,
        sourceDocumentId,
        extractionRunId,
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
      const record = await persistProcessedReceiptRecord({
        request,
        execution,
        result,
        summary,
        fileName: body.fileName,
        byteSize: fileBuffer.byteLength,
        checksum: buildDocumentChecksum(fileBuffer),
        parserVersion: LIVE_PARSER_VERSION,
      });

      sendJson<ReceiptProcessingCreateResponse>(res, 200, {
        record,
        ocrPayload: {
          providerId: result.providerId,
          providerLabel: record.extractionRun.providerLabel,
          modelName: result.modelName,
          parserVersion: LIVE_PARSER_VERSION,
          rawText: result.rawText,
          merchantName: summary.merchantName,
          purchaseDate: summary.purchaseDate,
          grandTotal: summary.grandTotal,
          fieldCandidates: result.fieldCandidates,
          lineItemCandidates: result.lineItemCandidates,
        },
      });
    } finally {
      await rm(tempFilePath, { force: true });
    }
  } catch (error) {
    sendJson(res, 500, {
      error: error instanceof Error ? error.message : 'Unknown receipt processing error',
    });
  }
}

async function readJsonBody<T>(req: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as T;
}

function sendJson<T>(res: ServerResponse, statusCode: number, payload: T) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function sanitizeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '_');
}

function readRecordIdFromUrl(rawUrl: string | undefined) {
  if (!rawUrl) {
    return null;
  }

  const parsed = new URL(rawUrl, 'http://localhost');
  const pathSegments = parsed.pathname.split('/').filter(Boolean);
  const lastSegment = pathSegments[pathSegments.length - 1];

  if (!lastSegment || lastSegment === 'receipt-processing') {
    return parsed.searchParams.get('recordId');
  }

  return decodeURIComponent(lastSegment);
}
