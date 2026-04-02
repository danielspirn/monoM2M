import type { IncomingMessage, ServerResponse } from 'node:http';

import type {
  LiveReceiptGraphGetResponse,
  LiveReceiptGraphListResponse,
  LiveReceiptGraphUpsertRequest,
  LiveReceiptGraphUpsertResponse,
} from '../../contracts/schema/integrations/live-receipt-graph.contract';

import {
  getLiveReceiptGraphRecordById,
  listLiveReceiptGraphRecords,
  upsertLiveReceiptGraphRecord,
} from './store';

export async function handleLiveReceiptGraphHttpRequest(req: IncomingMessage, res: ServerResponse) {
  try {
    if (req.method === 'GET') {
      const recordId = readRecordIdFromUrl(req.url);

      if (recordId) {
        const record = await getLiveReceiptGraphRecordById(recordId);

        if (!record) {
          sendJson(res, 404, { error: `Live receipt graph record ${recordId} was not found` });
          return;
        }

        sendJson<LiveReceiptGraphGetResponse>(res, 200, { record });
        return;
      }

      const records = await listLiveReceiptGraphRecords();
      sendJson<LiveReceiptGraphListResponse>(res, 200, { records });
      return;
    }

    if (req.method !== 'POST' && req.method !== 'PUT') {
      sendJson(res, 405, { error: 'Method not allowed' });
      return;
    }

    const body = await readJsonBody<LiveReceiptGraphUpsertRequest>(req);
    const record = await upsertLiveReceiptGraphRecord(body.record);
    sendJson<LiveReceiptGraphUpsertResponse>(res, 200, { record });
  } catch (error) {
    sendJson(res, 500, {
      error: error instanceof Error ? error.message : 'Unknown live receipt graph error',
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

  if (!lastSegment || lastSegment === 'live-receipt-graph') {
    return parsed.searchParams.get('recordId');
  }

  return decodeURIComponent(lastSegment);
}
