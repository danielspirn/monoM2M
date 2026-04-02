import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { PreparedReceiptOcrExecution } from '../ocr/gateway';
import type { ReceiptOcrBackendRequest, ReceiptOcrBackendResult } from '../../contracts/schema/integrations/receipt-ocr-adapter.contract';
import type {
  ReceiptProcessingRecord,
  ReceiptProcessingSummary,
} from '../../contracts/schema/integrations/receipt-processing.contract';

type ReceiptProcessingStoreFile = {
  version: 'v1';
  records: ReceiptProcessingRecord[];
};

type PersistProcessedReceiptParams = {
  request: ReceiptOcrBackendRequest;
  execution: PreparedReceiptOcrExecution;
  result: ReceiptOcrBackendResult;
  summary: ReceiptProcessingSummary;
  fileName: string;
  byteSize: number;
  checksum: string;
  parserVersion: string;
};

const DEFAULT_STORE_PATH = path.join(process.cwd(), 'server', '.local', 'receipt-processing-store.json');

export async function persistProcessedReceiptRecord(params: PersistProcessedReceiptParams): Promise<ReceiptProcessingRecord> {
  const store = await readReceiptProcessingStore();
  const createdAt = new Date().toISOString();
  const providerLabel = toProviderLabel(params.result.providerId);
  const record: ReceiptProcessingRecord = {
    id: `receiptproc_${randomUUID()}`,
    createdAt,
    sourceDocument: {
      id: params.request.sourceDocumentId,
      tenantId: params.request.tenantId,
      householdId: params.request.householdId ?? null,
      fileName: params.fileName,
      mimeType: params.request.sourceMimeType,
      captureChannel: params.request.captureChannel,
      checksum: params.checksum,
      byteSize: params.byteSize,
      createdAt,
      storageMode: 'dev_local_json',
    },
    extractionRun: {
      id: params.request.extractionRunId,
      status: 'completed',
      providerId: params.result.providerId,
      providerLabel,
      modelName: params.result.modelName,
      parserVersion: params.parserVersion,
      promptVersion: params.execution.promptVersion,
      startedAt: createdAt,
      completedAt: createdAt,
      vendorRequestId: params.result.vendorRequestId ?? null,
      processingMs: params.result.processingMs ?? null,
      estimatedCostUsd: params.result.estimatedCostUsd ?? null,
      documentMode: params.result.documentMode ?? null,
    },
    ocr: {
      summary: params.summary,
      rawText: params.result.rawText,
      fieldCandidates: params.result.fieldCandidates,
      lineItemCandidates: params.result.lineItemCandidates,
    },
  };

  store.records = [record, ...store.records].slice(0, 200);
  await writeReceiptProcessingStore(store);
  return record;
}

export async function listProcessedReceiptRecords(): Promise<ReceiptProcessingRecord[]> {
  const store = await readReceiptProcessingStore();
  return store.records;
}

export async function getProcessedReceiptRecordById(recordId: string): Promise<ReceiptProcessingRecord | null> {
  const store = await readReceiptProcessingStore();
  return store.records.find((record) => record.id === recordId) ?? null;
}

export async function clearReceiptProcessingStore() {
  await rm(resolveReceiptProcessingStorePath(), { force: true });
}

export function buildDocumentChecksum(buffer: Buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function resolveReceiptProcessingStorePath() {
  return process.env.RECEIPT_PROCESSING_STORE_PATH || DEFAULT_STORE_PATH;
}

async function readReceiptProcessingStore(): Promise<ReceiptProcessingStoreFile> {
  const storePath = resolveReceiptProcessingStorePath();

  try {
    const raw = await readFile(storePath, 'utf8');
    const parsed = JSON.parse(raw) as ReceiptProcessingStoreFile;
    return {
      version: 'v1',
      records: Array.isArray(parsed.records) ? parsed.records : [],
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }

    return {
      version: 'v1',
      records: [],
    };
  }
}

async function writeReceiptProcessingStore(store: ReceiptProcessingStoreFile) {
  const storePath = resolveReceiptProcessingStorePath();
  await mkdir(path.dirname(storePath), { recursive: true });
  await writeFile(storePath, `${JSON.stringify(store, null, 2)}\n`, 'utf8');
}

function toProviderLabel(providerId: ReceiptOcrBackendResult['providerId']) {
  return providerId === 'openai_gpt_4o_mini' ? 'OpenAI GPT-4o mini' : 'Google Gemini 2.5 Flash';
}
