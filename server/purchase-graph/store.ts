import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { TrustedPurchaseGraphRecord } from '../../contracts/schema/integrations/trusted-purchase-graph.contract';

type TrustedPurchaseGraphStoreFile = {
  version: 'v1';
  records: TrustedPurchaseGraphRecord[];
};

const DEFAULT_STORE_PATH = path.join(process.cwd(), 'server', '.local', 'trusted-purchase-graph-store.json');

export async function upsertTrustedPurchaseGraphRecord(record: TrustedPurchaseGraphRecord): Promise<TrustedPurchaseGraphRecord> {
  const store = await readTrustedPurchaseGraphStore();
  const nextRecord = {
    ...record,
    syncedAt: new Date().toISOString(),
  };
  store.records = [
    nextRecord,
    ...store.records.filter((candidate) => candidate.id !== record.id),
  ].slice(0, 200);
  await writeTrustedPurchaseGraphStore(store);
  return nextRecord;
}

export async function listTrustedPurchaseGraphRecords(): Promise<TrustedPurchaseGraphRecord[]> {
  const store = await readTrustedPurchaseGraphStore();
  return store.records;
}

export async function getTrustedPurchaseGraphRecordById(recordId: string): Promise<TrustedPurchaseGraphRecord | null> {
  const store = await readTrustedPurchaseGraphStore();
  return store.records.find((record) => record.id === recordId) ?? null;
}

export async function clearTrustedPurchaseGraphStore() {
  await rm(resolveTrustedPurchaseGraphStorePath(), { force: true });
}

function resolveTrustedPurchaseGraphStorePath() {
  return process.env.TRUSTED_PURCHASE_GRAPH_STORE_PATH || DEFAULT_STORE_PATH;
}

async function readTrustedPurchaseGraphStore(): Promise<TrustedPurchaseGraphStoreFile> {
  const storePath = resolveTrustedPurchaseGraphStorePath();

  try {
    const raw = await readFile(storePath, 'utf8');
    const parsed = JSON.parse(raw) as TrustedPurchaseGraphStoreFile;
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

async function writeTrustedPurchaseGraphStore(store: TrustedPurchaseGraphStoreFile) {
  const storePath = resolveTrustedPurchaseGraphStorePath();
  await mkdir(path.dirname(storePath), { recursive: true });
  await writeFile(storePath, `${JSON.stringify(store, null, 2)}\n`, 'utf8');
}
