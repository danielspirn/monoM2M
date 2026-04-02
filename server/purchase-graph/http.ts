import type { IncomingMessage, ServerResponse } from 'node:http';

import type {
  TrustedPurchaseGraphGetResponse,
  TrustedPurchaseGraphListResponse,
  TrustedPurchaseGraphUpsertRequest,
  TrustedPurchaseGraphUpsertResponse,
} from '../../contracts/schema/integrations/trusted-purchase-graph.contract';

import {
  getTrustedPurchaseGraphRecordById,
  listTrustedPurchaseGraphRecords,
  upsertTrustedPurchaseGraphRecord,
} from './store';

export async function handleTrustedPurchaseGraphHttpRequest(req: IncomingMessage, res: ServerResponse) {
  try {
    if (req.method === 'GET') {
      const recordId = readRecordIdFromUrl(req.url);

      if (recordId) {
        const record = await getTrustedPurchaseGraphRecordById(recordId);

        if (!record) {
          sendJson(res, 404, { error: `Trusted purchase graph record ${recordId} was not found` });
          return;
        }

        sendJson<TrustedPurchaseGraphGetResponse>(res, 200, { record });
        return;
      }

      const records = await listTrustedPurchaseGraphRecords();
      sendJson<TrustedPurchaseGraphListResponse>(res, 200, { records });
      return;
    }

    if (req.method !== 'POST' && req.method !== 'PUT') {
      sendJson(res, 405, { error: 'Method not allowed' });
      return;
    }

    const body = await readJsonBody<TrustedPurchaseGraphUpsertRequest>(req);
    const record = await upsertTrustedPurchaseGraphRecord(body.record);
    sendJson<TrustedPurchaseGraphUpsertResponse>(res, 200, { record });
  } catch (error) {
    sendJson(res, 500, {
      error: error instanceof Error ? error.message : 'Unknown trusted purchase graph error',
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

function readRecordIdFromUrl(rawUrl: string | undefined) {
  if (!rawUrl) {
    return null;
  }

  const parsed = new URL(rawUrl, 'http://localhost');
  const pathSegments = parsed.pathname.split('/').filter(Boolean);
  const lastSegment = pathSegments[pathSegments.length - 1];

  if (!lastSegment || lastSegment === 'trusted-purchase-graph') {
    return parsed.searchParams.get('recordId');
  }

  return decodeURIComponent(lastSegment);
}
