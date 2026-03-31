#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';

const [filePathArg] = process.argv.slice(2);

if (!filePathArg) {
  console.error('Usage: npm run ocr:smoke:openai -- <receipt-file-path>');
  process.exit(1);
}

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error('OPENAI_API_KEY must be set in the environment.');
  process.exit(1);
}

const filePath = path.resolve(process.cwd(), filePathArg);
const fileBuffer = await readFile(filePath);
const mimeType = inferMimeType(filePath);

const response = await fetch(OPENAI_RESPONSES_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  },
  body: JSON.stringify({
    model: 'gpt-4o-mini',
    input: [
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: [
              'Extract receipt OCR facts for Money to Memories.',
              'Return only JSON matching the provided schema.',
              'Preserve rawText, fieldCandidates, lineItems, and receiptCandidates when multiple receipts are visible.',
              'Use conservative confidence values and do not invent missing fields.',
            ].join(' '),
          },
          mimeType === 'application/pdf'
            ? {
                type: 'input_file',
                filename: path.basename(filePath),
                file_data: `data:${mimeType};base64,${fileBuffer.toString('base64')}`,
              }
            : {
                type: 'input_image',
                image_url: `data:${mimeType};base64,${fileBuffer.toString('base64')}`,
              },
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
  }),
});

if (!response.ok) {
  console.error(await response.text());
  process.exit(1);
}

const payload = await response.json();
const parsed = JSON.parse(payload.output_text);
const primaryCandidate = Array.isArray(parsed.receiptCandidates) && parsed.receiptCandidates.length ? parsed.receiptCandidates[0] : parsed;

console.log(JSON.stringify({
  provider: 'openai_gpt_4o_mini',
  model: 'gpt-4o-mini',
  filePath,
  receiptCandidateCount: Array.isArray(parsed.receiptCandidates) ? parsed.receiptCandidates.length : 1,
  merchant: findFieldValue(primaryCandidate, ['merchant', 'store', 'vendor', 'retailer']),
  purchaseDate: findFieldValue(primaryCandidate, ['purchase date', 'date', 'transaction date', 'invoice date']),
  grandTotal: findFieldValue(primaryCandidate, ['grand total', 'total', 'amount due']),
  lineItemCount: Array.isArray(primaryCandidate.lineItems) ? primaryCandidate.lineItems.length : 0,
}, null, 2));

function findFieldValue(parsed, labels) {
  const candidates = Array.isArray(parsed.fieldCandidates) ? parsed.fieldCandidates : [];
  const normalizedLabels = labels.map((label) => label.toLowerCase());
  const match = candidates.find((field) =>
    normalizedLabels.some((label) => String(field.label ?? '').toLowerCase().includes(label)),
  );

  return match?.value ?? null;
}

function inferMimeType(filePathValue) {
  const extension = path.extname(filePathValue).toLowerCase();

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
