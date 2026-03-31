import type { ReceiptOcrBackendRequest } from '@/contracts/schema/integrations/receipt-ocr-adapter.contract';

export function buildReceiptOcrPrompt(request: ReceiptOcrBackendRequest) {
  const groupedUploadInstruction = request.captureChannel === 'multi_receipt_photo'
    ? 'If the upload contains multiple receipts, separate them into independent receipt candidates before extracting fields and line items, and preserve a top-ranked primary candidate.'
    : 'Treat the upload as a single receipt unless the evidence clearly shows otherwise.';
  const pdfInstruction = request.sourceMimeType === 'application/pdf'
    ? 'The source may be a PDF document, so preserve page-aware receipt candidates when the file includes multiple sections or attached receipts.'
    : 'The source is an image-based capture.';

  return [
    'You are extracting purchase facts from a consumer receipt for Money to Memories.',
    'Return normalized JSON only.',
    'Preserve evidence-first behavior: do not invent merchants, totals, dates, line items, warranty facts, or return policies.',
    pdfInstruction,
    groupedUploadInstruction,
    'Extract merchant, purchase date, total, and line items with confidence values.',
    'Keep raw text separate from structured candidates.',
  ].join(' ');
}
