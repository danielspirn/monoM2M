import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { LiveReceiptGraphRecord } from '../../contracts/schema/integrations/live-receipt-graph.contract';

type LiveReceiptGraphStoreFile = {
  version: 'v1';
  records: LiveReceiptGraphRecord[];
};

const DEFAULT_STORE_PATH = path.join(process.cwd(), 'server', '.local', 'live-receipt-graph-store.json');

export async function upsertLiveReceiptGraphRecord(record: LiveReceiptGraphRecord): Promise<LiveReceiptGraphRecord> {
  const store = await readLiveReceiptGraphStore();
  const nextRecord = {
    ...record,
    syncedAt: new Date().toISOString(),
  };
  store.records = [
    nextRecord,
    ...store.records.filter((candidate) => candidate.id !== record.id),
  ].slice(0, 200);
  await writeLiveReceiptGraphStore(store);
  return nextRecord;
}

export async function listLiveReceiptGraphRecords(): Promise<LiveReceiptGraphRecord[]> {
  const store = await readLiveReceiptGraphStore();
  return store.records;
}

export async function getLiveReceiptGraphRecordById(recordId: string): Promise<LiveReceiptGraphRecord | null> {
  const store = await readLiveReceiptGraphStore();
  return store.records.find((record) => record.id === recordId) ?? null;
}

export async function clearLiveReceiptGraphStore() {
  await rm(resolveLiveReceiptGraphStorePath(), { force: true });
}

function resolveLiveReceiptGraphStorePath() {
  return process.env.LIVE_RECEIPT_GRAPH_STORE_PATH || DEFAULT_STORE_PATH;
}

async function readLiveReceiptGraphStore(): Promise<LiveReceiptGraphStoreFile> {
  const storePath = resolveLiveReceiptGraphStorePath();

  try {
    const raw = await readFile(storePath, 'utf8');
    const parsed = JSON.parse(raw) as LiveReceiptGraphStoreFile;
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

async function writeLiveReceiptGraphStore(store: LiveReceiptGraphStoreFile) {
  const storePath = resolveLiveReceiptGraphStorePath();
  await mkdir(path.dirname(storePath), { recursive: true });
  await writeFile(storePath, `${JSON.stringify(store, null, 2)}\n`, 'utf8');
}
