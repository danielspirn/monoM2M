import { readFile } from 'node:fs/promises';
import path from 'node:path';

import type {
  ReceiptOcrBackendRequest,
  ReceiptOcrBackendResult,
} from '@/contracts/schema/integrations/receipt-ocr-adapter.contract';

const GEMINI_GENERATE_CONTENT_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

type GeminiReceiptOcrJson = {
  rawText: string;
  fieldCandidates: Array<{
    label: string;
    value: string;
    confidence: number;
  }>;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
      lineTotal: number;
      confidence: number;
    }>;
  receiptCandidates?: Array<{
    candidateId?: string;
    rawText: string;
    fieldCandidates: Array<{
      label: string;
      value: string;
      confidence: number;
    }>;
    lineItems: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
      confidence: number;
    }>;
  }>;
};

type GeminiGenerateContentResponse = {
  responseId?: string;
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

export async function executeGeminiReceiptOcrFromFile(params: {
  request: ReceiptOcrBackendRequest;
  filePath: string;
  apiKey?: string;
  fetchImpl?: typeof fetch;
}): Promise<ReceiptOcrBackendResult> {
  const apiKey = params.apiKey ?? process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is required for live Gemini OCR calls.');
  }

  const fileBuffer = await readFile(params.filePath);
  const mimeType = params.request.sourceMimeType || inferMimeTypeFromPath(params.filePath);
  const response = await (params.fetchImpl ?? fetch)(GEMINI_GENERATE_CONTENT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify(buildGeminiReceiptOcrRequestBody({
      prompt: buildLiveReceiptOcrPrompt(params.request),
      mimeType,
      base64Data: fileBuffer.toString('base64'),
    })),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Gemini OCR request failed with ${response.status}: ${body}`);
  }

  const payload = (await response.json()) as GeminiGenerateContentResponse;
  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('').trim();

  if (!text) {
    throw new Error('Gemini OCR response did not contain any text output.');
  }

  const parsed = JSON.parse(text) as GeminiReceiptOcrJson;
  const normalizedReceiptCandidates = (parsed.receiptCandidates ?? []).map((candidate, index) => ({
    candidateId: candidate.candidateId ?? `receipt_candidate_${index + 1}`,
    rawText: candidate.rawText,
    fieldCandidates: candidate.fieldCandidates ?? [],
    lineItemCandidates: (candidate.lineItems ?? []).map((item) => ({
      description: item.description,
      quantity: coerceNumber(item.quantity, 1),
      unitPrice: coerceNumber(item.unitPrice, 0),
      lineTotal: coerceNumber(item.lineTotal, 0),
      confidence: coerceConfidence(item.confidence),
    })),
  }));
  const primaryCandidate = normalizedReceiptCandidates[0];

  return {
    providerId: 'google_gemini_2_5_flash',
    modelName: 'gemini-2.5-flash',
    authMode: 'gemini_api_key',
    vendorRequestId: payload.responseId,
    documentMode:
      params.request.sourceMimeType === 'application/pdf'
        ? 'pdf_document'
        : params.request.captureChannel === 'multi_receipt_photo'
          ? 'multi_receipt'
          : 'single_receipt',
    rawText: primaryCandidate?.rawText ?? parsed.rawText,
    fieldCandidates: primaryCandidate?.fieldCandidates ?? parsed.fieldCandidates ?? [],
    lineItemCandidates: primaryCandidate?.lineItemCandidates ?? (parsed.lineItems ?? []).map((item) => ({
      description: item.description,
      quantity: coerceNumber(item.quantity, 1),
      unitPrice: coerceNumber(item.unitPrice, 0),
      lineTotal: coerceNumber(item.lineTotal, 0),
      confidence: coerceConfidence(item.confidence),
    })),
    receiptCandidates: normalizedReceiptCandidates.length ? normalizedReceiptCandidates : undefined,
  };
}

export function buildGeminiReceiptOcrRequestBody(params: {
  prompt: string;
  mimeType: string;
  base64Data: string;
}) {
  return {
    contents: [
      {
        parts: [
          {
            text: params.prompt,
          },
          {
            inline_data: {
              mime_type: params.mimeType,
              data: params.base64Data,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json',
      responseJsonSchema: {
        type: 'object',
        properties: {
          rawText: { type: 'string' },
          fieldCandidates: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                label: { type: 'string' },
                value: { type: 'string' },
                confidence: { type: 'number' },
              },
              required: ['label', 'value', 'confidence'],
            },
          },
          lineItems: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                description: { type: 'string' },
                quantity: { type: 'number' },
                unitPrice: { type: 'number' },
                lineTotal: { type: 'number' },
                confidence: { type: 'number' },
              },
              required: ['description', 'quantity', 'unitPrice', 'lineTotal', 'confidence'],
            },
          },
          receiptCandidates: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                candidateId: { type: 'string' },
                rawText: { type: 'string' },
                fieldCandidates: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      label: { type: 'string' },
                      value: { type: 'string' },
                      confidence: { type: 'number' },
                    },
                    required: ['label', 'value', 'confidence'],
                  },
                },
                lineItems: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      description: { type: 'string' },
                      quantity: { type: 'number' },
                      unitPrice: { type: 'number' },
                      lineTotal: { type: 'number' },
                      confidence: { type: 'number' },
                    },
                    required: ['description', 'quantity', 'unitPrice', 'lineTotal', 'confidence'],
                  },
                },
              },
              required: ['rawText', 'fieldCandidates', 'lineItems'],
            },
          },
        },
        required: ['rawText', 'fieldCandidates', 'lineItems'],
      },
    },
  };
}

function buildLiveReceiptOcrPrompt(request: ReceiptOcrBackendRequest) {
  const splitInstruction = request.captureChannel === 'multi_receipt_photo'
    ? 'If there are multiple receipts in the image, return receiptCandidates with one candidate per visible receipt, ordered by readability, and also mirror the best candidate at the top level.'
    : 'Treat the document as one receipt unless the evidence clearly contradicts that.';
  const pdfInstruction = request.sourceMimeType === 'application/pdf'
    ? 'This upload may be a PDF. Read the document pages directly and preserve receiptCandidates when one PDF contains multiple receipt sections or attachments.'
    : 'This upload is an image-based receipt capture.';

  return [
    'Extract receipt OCR facts for Money to Memories.',
    pdfInstruction,
    splitInstruction,
    'Return only JSON that matches the provided schema.',
    'Set rawText to the best plain-text OCR transcript you can read from the image.',
    'Populate fieldCandidates with merchant, purchase date, subtotal, tax, total, card/tender, return policy, and warranty details when visible.',
    'Populate lineItems with receipt line items only.',
    'For service invoices, estimate lineItems from billed services or task descriptions even when the document is not formatted like a store receipt.',
    'If multiple services are listed in one invoice, return one line item per distinct service or task when visible.',
    'Use conservative confidence values and do not invent missing fields.',
  ].join(' ');
}

function inferMimeTypeFromPath(filePath: string) {
  const extension = path.extname(filePath).toLowerCase();

  switch (extension) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    case '.pdf':
      return 'application/pdf';
    default:
      return 'application/octet-stream';
  }
}

function coerceNumber(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function coerceConfidence(value: unknown) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0.5;
  }

  return Math.max(0, Math.min(1, value));
}
