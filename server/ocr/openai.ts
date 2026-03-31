import { readFile } from 'node:fs/promises';
import path from 'node:path';

import type {
  ReceiptOcrBackendRequest,
  ReceiptOcrBackendResult,
} from '@/contracts/schema/integrations/receipt-ocr-adapter.contract';

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';

type OpenAiReceiptOcrJson = {
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

type OpenAiResponsesApiResponse = {
  id?: string;
  output_text?: string;
};

export async function executeOpenAiReceiptOcrFromFile(params: {
  request: ReceiptOcrBackendRequest;
  filePath: string;
  apiKey?: string;
  fetchImpl?: typeof fetch;
}): Promise<ReceiptOcrBackendResult> {
  const apiKey = params.apiKey ?? process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required for live OpenAI OCR calls.');
  }

  const fileBuffer = await readFile(params.filePath);
  const mimeType = params.request.sourceMimeType || inferMimeTypeFromPath(params.filePath);
  const response = await (params.fetchImpl ?? fetch)(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(buildOpenAiReceiptOcrRequestBody({
      prompt: buildOpenAiReceiptOcrPrompt(params.request),
      mimeType,
      base64Data: fileBuffer.toString('base64'),
      fileName: path.basename(params.filePath),
    })),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI OCR request failed with ${response.status}: ${body}`);
  }

  const payload = (await response.json()) as OpenAiResponsesApiResponse;
  const text = payload.output_text?.trim();

  if (!text) {
    throw new Error('OpenAI OCR response did not contain any output_text.');
  }

  const parsed = JSON.parse(text) as OpenAiReceiptOcrJson;
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
    providerId: 'openai_gpt_4o_mini',
    modelName: 'gpt-4o-mini',
    authMode: 'openai_api_key',
    vendorRequestId: payload.id,
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

export function buildOpenAiReceiptOcrRequestBody(params: {
  prompt: string;
  mimeType: string;
  base64Data: string;
  fileName: string;
}) {
  const filePart = params.mimeType === 'application/pdf'
    ? {
        type: 'input_file',
        filename: params.fileName,
        file_data: `data:${params.mimeType};base64,${params.base64Data}`,
      }
    : {
        type: 'input_image',
        image_url: `data:${params.mimeType};base64,${params.base64Data}`,
      };

  return {
    model: 'gpt-4o-mini',
    input: [
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: params.prompt,
          },
          filePart,
        ],
      },
    ],
    text: {
      format: {
        type: 'json_schema',
        name: 'receipt_ocr',
        strict: true,
        schema: {
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
                additionalProperties: false,
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
                additionalProperties: false,
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
                      additionalProperties: false,
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
                      additionalProperties: false,
                    },
                  },
                },
                required: ['candidateId', 'rawText', 'fieldCandidates', 'lineItems'],
                additionalProperties: false,
              },
            },
          },
          required: ['rawText', 'fieldCandidates', 'lineItems', 'receiptCandidates'],
          additionalProperties: false,
        },
      },
    },
  };
}

function buildOpenAiReceiptOcrPrompt(request: ReceiptOcrBackendRequest) {
  const splitInstruction = request.captureChannel === 'multi_receipt_photo'
    ? 'If multiple receipts are visible, return receiptCandidates with one candidate per receipt and mirror the best candidate at the top level.'
    : 'Treat the upload as one receipt unless the evidence clearly shows otherwise.';
  const pdfInstruction = request.sourceMimeType === 'application/pdf'
    ? 'This upload may be a PDF, so inspect the document directly and preserve receiptCandidates when one file contains multiple receipt sections.'
    : 'This upload is an image-based receipt capture.';

  return [
    'Extract receipt OCR facts for Money to Memories.',
    pdfInstruction,
    splitInstruction,
    'Return only JSON matching the provided schema.',
    'Preserve rawText separately from structured candidates.',
    'Extract merchant, purchase date, subtotal, tax, total, return policy, warranty details, and line items when visible.',
    'For service invoices, use billed services or task descriptions as line items.',
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
