import { act } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resetLiveReceiptStore } from '@/mocks/receiptWorkflowStore';
import { App } from './App';

function openAddReceiptComposer() {
  fireEvent.click(screen.getByRole('button', { name: /open add or ask menu/i }));
  fireEvent.click(screen.getAllByText('Add Receipt').find((element) => element.tagName === 'STRONG')?.closest('button') as HTMLElement);
}

describe('Milestone 1 shell', () => {
  beforeEach(() => {
    resetLiveReceiptStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    window.history.pushState({}, '', '/home');
  });

  it('renders the mobile shell with primary navigation', () => {
    render(<App />);

    const navigation = screen.getByRole('navigation', { name: 'Primary navigation' });

    expect(navigation).toBeTruthy();
    expect(screen.getAllByText('Home').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Things').length).toBeGreaterThan(0);
    expect(screen.getAllByText('People').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Memories').length).toBeGreaterThan(0);
  });

  it('navigates to Things from the bottom navigation', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('navigation', { name: 'Primary navigation' }).querySelectorAll('button')[1]);

    expect(screen.getAllByText('Things').length).toBeGreaterThan(0);
    expect(screen.getByText('Consumer-friendly ownership')).toBeTruthy();
  });

  it('opens the FAB menu and exposes the agent entries', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /open add or ask menu/i }));

    expect(screen.getByText('Create')).toBeTruthy();
    expect(screen.getByText('Ask Agent — Chat')).toBeTruthy();
    expect(screen.getByText('Ask Agent — Voice')).toBeTruthy();
  });

  it('creates a multi-receipt capture and advances from processing to review', () => {
    vi.useFakeTimers();

    render(<App />);

    openAddReceiptComposer();

    fireEvent.click(screen.getByRole('button', { name: 'Process receipt capture' }));

    expect(screen.getByText('Extraction running')).toBeTruthy();
    expect(screen.getByText(/Vendor detected:/)).toBeTruthy();
    expect(screen.getByText(/Items detected:/)).toBeTruthy();
    expect(screen.getByText(/Total detected:/)).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(2200);
    });

    expect(screen.getByText('Detected from this upload')).toBeTruthy();
    expect(screen.getByText('Structured purchase')).toBeTruthy();
    expect(screen.getByText('Search and retrieval')).toBeTruthy();
  });

  it('keeps the first detected receipt quiet unless there is an actual issue', () => {
    vi.useFakeTimers();

    render(<App />);

    openAddReceiptComposer();
    fireEvent.click(screen.getByRole('button', { name: 'Process receipt capture' }));

    act(() => {
      vi.advanceTimersByTime(2200);
    });

    expect(screen.getByText('Detected from this upload')).toBeTruthy();
    expect(screen.queryByText('Needs attention')).toBeNull();
  });

  it('marks a captured receipt as trusted from the review screen', () => {
    vi.useFakeTimers();

    render(<App />);

    openAddReceiptComposer();
    fireEvent.click(screen.getByRole('button', { name: 'Process receipt capture' }));

    act(() => {
      vi.advanceTimersByTime(2200);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Mark review complete' }));

    expect(screen.getByRole('heading', { name: 'Receipt trusted' })).toBeTruthy();
  });

  it('projects a trusted durable-goods receipt into Things', () => {
    vi.useFakeTimers();

    render(<App />);

    openAddReceiptComposer();

    fireEvent.change(screen.getByLabelText('Merchant'), { target: { value: 'Target' } });
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-03-08' } });
    fireEvent.change(screen.getByLabelText('Capture source'), { target: { value: 'Upload photo' } });
    fireEvent.change(screen.getByLabelText('Extracted summary'), { target: { value: 'Air fryer, parchment liners' } });
    fireEvent.click(screen.getByRole('button', { name: 'Process receipt capture' }));

    act(() => {
      vi.advanceTimersByTime(2200);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Mark review complete' }));
    fireEvent.click(screen.getByRole('navigation', { name: 'Primary navigation' }).querySelectorAll('button')[1]);

    expect(screen.getByText('Air Fryer')).toBeTruthy();
  });

  it('shows receipt-linked ownership support on promoted Things', () => {
    vi.useFakeTimers();

    render(<App />);

    openAddReceiptComposer();

    fireEvent.change(screen.getByLabelText('Merchant'), { target: { value: 'Target' } });
    fireEvent.change(screen.getByLabelText('Capture source'), { target: { value: 'Upload photo' } });
    fireEvent.change(screen.getByLabelText('Extracted summary'), { target: { value: 'Air fryer, parchment liners' } });
    fireEvent.click(screen.getByRole('button', { name: 'Process receipt capture' }));

    act(() => {
      vi.advanceTimersByTime(2200);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Mark review complete' }));
    fireEvent.click(screen.getByRole('navigation', { name: 'Primary navigation' }).querySelectorAll('button')[1]);
    fireEvent.click(screen.getByText('Air Fryer'));

    expect(screen.getByText('Product record')).toBeTruthy();
    expect(screen.getAllByText('confirmed').length).toBeGreaterThan(0);
    expect(screen.getByText('Warranty stub')).toBeTruthy();
    expect(screen.getByText('Return support')).toBeTruthy();
    expect(screen.getByText('Policy records')).toBeTruthy();
    expect(screen.getByText('Location context')).toBeTruthy();
    expect(screen.getByText('Evidence links')).toBeTruthy();
    expect(screen.getAllByText('Linked documents').length).toBeGreaterThan(0);
    expect(screen.getByText('Document links')).toBeTruthy();
    expect(screen.getByText('Tag graph')).toBeTruthy();
    expect(screen.getByText('Retrieval profile')).toBeTruthy();
    expect(screen.getByText('Capture provenance')).toBeTruthy();
    expect(screen.getByText('Merchant record')).toBeTruthy();
    expect(screen.getByText('merchant place')).toBeTruthy();
    expect(screen.getAllByText('known retailer').length).toBeGreaterThan(0);
    expect(screen.getAllByText('1 trusted purchase').length).toBeGreaterThan(0);
    expect(screen.getByText('Object record')).toBeTruthy();
    expect(screen.getAllByText('organization').length).toBeGreaterThan(0);
    expect(screen.getByText('Air Fryer warranty stub')).toBeTruthy();
    expect(screen.getByText('Ownership support')).toBeTruthy();
    expect(screen.getByText('Receipt linked')).toBeTruthy();
    expect(screen.getByText('Receipt document')).toBeTruthy();
    expect(screen.getAllByText('source_document').length).toBeGreaterThan(0);
    expect(screen.getAllByText('household').length).toBeGreaterThan(0);
    expect(screen.getByText('receipt-embedding-v1')).toBeTruthy();
    expect(screen.getAllByText('upload photo').length).toBeGreaterThan(0);
    expect(screen.getByText('Target return window')).toBeTruthy();
    expect(screen.getByText('Target return policy')).toBeTruthy();
    expect(screen.getAllByText(/Air Fryer/i).length).toBeGreaterThan(0);
  });

  it('shows concrete duplicate candidates during receipt review', () => {
    vi.useFakeTimers();

    render(<App />);

    openAddReceiptComposer();
    fireEvent.change(screen.getByLabelText('Merchant'), { target: { value: 'Safeway' } });
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-03-10' } });
    fireEvent.change(screen.getByLabelText('Capture source'), { target: { value: 'Upload photo' } });
    fireEvent.change(screen.getByLabelText('Extracted summary'), { target: { value: 'Bananas, yogurt' } });
    fireEvent.click(screen.getByRole('button', { name: 'Process receipt capture' }));

    act(() => {
      vi.advanceTimersByTime(2200);
    });

    openAddReceiptComposer();
    fireEvent.change(screen.getByLabelText('Merchant'), { target: { value: 'Safeway' } });
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-03-10' } });
    fireEvent.change(screen.getByLabelText('Capture source'), { target: { value: 'Upload photo' } });
    fireEvent.change(screen.getByLabelText('Extracted summary'), { target: { value: 'Bananas, yogurt' } });
    fireEvent.click(screen.getByRole('button', { name: 'Process receipt capture' }));

    act(() => {
      vi.advanceTimersByTime(2200);
    });

    expect(screen.getByText('Possible duplicates')).toBeTruthy();
    expect(screen.getAllByText('Possible duplicate receipt').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Safeway/i).length).toBeGreaterThan(0);
    expect(screen.getByText('$0.00 delta')).toBeTruthy();
  });

  it('can preload a real uploaded fixture into the receipt capture flow', () => {
    render(<App />);

    openAddReceiptComposer();

    fireEvent.change(screen.getByLabelText('Uploaded fixture'), { target: { value: 'Safeway grocery receipt' } });

    expect((screen.getByLabelText('Merchant') as HTMLInputElement).value).toBe('Safeway');
    expect((screen.getByLabelText('Capture source') as HTMLSelectElement).value).toBe('Upload photo');
    expect((screen.getByLabelText('Extracted summary') as HTMLTextAreaElement).value).toContain('bananas');
  });

  it('can choose a real uploaded receipt image and process it through review', () => {
    vi.useFakeTimers();

    render(<App />);

    openAddReceiptComposer();

    const fileInput = screen.getByLabelText('Choose receipt image or video');
    const file = new File(['receipt'], 'IMG_7573.jpeg', { type: 'image/jpeg' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    expect((screen.getByLabelText('Merchant') as HTMLInputElement).value).toBe('Safeway');
    expect(screen.getByAltText('Receipt preview')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Process receipt capture' }));

    expect(screen.getByAltText('Uploaded receipt preview')).toBeTruthy();
    expect(screen.getByText('Vendor detected: Safeway')).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(2200);
    });

    expect(screen.getByRole('heading', { name: 'Safeway' })).toBeTruthy();
    expect(screen.getAllByText('Raw document').length).toBeGreaterThan(0);
    expect(screen.getByText('Uploaded files')).toBeTruthy();
  });

  it('sends unknown uploaded receipts through backend processing and renders the OCR review', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      json: async () => ({
        record: {
          id: 'receiptproc_1',
          createdAt: '2026-04-01T12:00:00.000Z',
          sourceDocument: {
            id: 'srcdoc_1',
            tenantId: 'local-dev',
            householdId: null,
            fileName: 'fresh-upload.jpeg',
            mimeType: 'image/jpeg',
            captureChannel: 'upload_photo',
            checksum: 'abc123',
            byteSize: 1024,
            createdAt: '2026-04-01T12:00:00.000Z',
            storageMode: 'dev_local_json',
          },
          extractionRun: {
            id: 'extract_1',
            status: 'completed',
            providerId: 'google_gemini_2_5_flash',
            providerLabel: 'Google Gemini 2.5 Flash',
            modelName: 'gemini-2.5-flash',
            parserVersion: 'live_backend_ocr_v2',
            promptVersion: 'receipt-ocr-server-prompt-v1',
            startedAt: '2026-04-01T12:00:00.000Z',
            completedAt: '2026-04-01T12:00:01.000Z',
            vendorRequestId: 'vendor_1',
            processingMs: 850,
            estimatedCostUsd: 0.002,
            documentMode: 'single_receipt',
          },
          ocr: {
            summary: {
              merchantName: 'Backend Grocer',
              purchaseDate: '2026-04-01',
              grandTotal: '12.49',
            },
            rawText: 'BACKEND GROCER\nAPPLES 4.99\nMILK 7.50\nTOTAL 12.49',
            fieldCandidates: [],
            lineItemCandidates: [],
          },
        },
        ocrPayload: {
          providerId: 'google_gemini_2_5_flash',
          providerLabel: 'Google Gemini 2.5 Flash',
          modelName: 'gemini-2.5-flash',
          parserVersion: 'live_backend_ocr_v2',
          rawText: 'BACKEND GROCER\nAPPLES 4.99\nMILK 7.50\nTOTAL 12.49',
          merchantName: 'Backend Grocer',
          purchaseDate: '2026-04-01',
          grandTotal: '12.49',
          fieldCandidates: [
            { label: 'Merchant', value: 'Backend Grocer', confidence: 0.98 },
            { label: 'Purchase date', value: '2026-04-01', confidence: 0.94 },
            { label: 'Grand total', value: '12.49', confidence: 0.95 },
          ],
          lineItemCandidates: [
            { description: 'Apples', quantity: 1, unitPrice: 4.99, lineTotal: 4.99, confidence: 0.9 },
            { description: 'Milk', quantity: 1, unitPrice: 7.5, lineTotal: 7.5, confidence: 0.91 },
          ],
        },
      }),
    } as Response);
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    openAddReceiptComposer();

    const fileInput = screen.getByLabelText('Choose receipt image or video');
    const file = new File(['fresh receipt'], 'fresh-upload.jpeg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'arrayBuffer', {
      value: async () => new TextEncoder().encode('fresh receipt').buffer,
    });
    fireEvent.change(fileInput, { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: 'Process receipt capture' }));

    expect(await screen.findByDisplayValue('Backend Grocer')).toBeTruthy();
    expect(screen.getByText('Google Gemini 2.5 Flash')).toBeTruthy();
    expect(screen.getByDisplayValue('Apples')).toBeTruthy();
    expect(screen.getByText('Backend processing record')).toBeTruthy();
    expect(screen.getByText('receiptproc_1')).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/live-receipt-graph',
      expect.objectContaining({
        method: 'POST',
      }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/receipt-processing',
      expect.objectContaining({
        method: 'POST',
      }),
    );
  });

  it('rehydrates receipt review from the backend live graph when local storage is empty', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (input) => {
      if (input === '/api/live-receipt-graph/receipt_backend_reopen') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            record: {
              id: 'receipt_backend_reopen',
              syncedAt: '2026-04-02T10:00:00.000Z',
              receipt: {
                id: 'receipt_backend_reopen',
                status: 'needs_review',
                sourceType: 'receipt_image',
                capturedAt: '2026-04-02T09:59:00.000Z',
              },
              header: {
                merchantName: 'Backend Restore Mart',
                purchasedAt: '2026-04-02',
                grandTotal: 18.75,
                currency: 'USD',
              },
              sourceDocument: {
                id: 'srcdoc_restore_1',
                fileName: 'restore.jpeg',
                mimeType: 'image/jpeg',
                captureChannel: 'upload_photo',
                sourceFileCount: 1,
                checksum: 'restore-checksum',
                detectedReceiptCount: 1,
              },
              extractionRun: {
                id: 'extract_restore_1',
                status: 'completed',
                stage: 'ready_for_review',
                stageLabel: 'Live OCR complete.',
                providerLabel: 'Google Gemini 2.5 Flash',
                parserVersion: 'live_backend_ocr_v2',
              },
              parsedData: {
                parserMode: 'live_backend_ocr',
                parserVersion: 'live_backend_ocr_v2',
                providerLabel: 'Google Gemini 2.5 Flash',
                sourceFileCount: 1,
                sourceDocumentChecksum: 'restore-checksum',
                backendProcessingRecordId: 'receiptproc_restore_1',
                backendExtractionRunId: 'extract_backend_restore_1',
                backendSourceDocumentId: 'srcdoc_backend_restore_1',
                fieldCandidateCount: 3,
                lineItemCandidateCount: 2,
              },
              lineItems: [
                {
                  id: 'line_restore_1',
                  description: 'Paper Towels',
                  lineTotal: 8.75,
                  reviewState: 'needs_review',
                  thingCandidate: false,
                },
                {
                  id: 'line_restore_2',
                  description: 'Storage Bin',
                  lineTotal: 10,
                  reviewState: 'edited',
                  thingCandidate: true,
                },
              ],
              alertCount: 0,
              duplicateCandidateCount: 0,
              reviewDecisionCount: 0,
            },
          }),
        } as Response;
      }

      throw new Error(`Unexpected fetch: ${String(input)}`);
    });
    vi.stubGlobal('fetch', fetchMock);
    window.history.pushState({}, '', '/ingest/receipt_backend_reopen');

    render(<App />);

    expect(await screen.findByDisplayValue('Backend Restore Mart')).toBeTruthy();
    expect(screen.getByDisplayValue('Paper Towels')).toBeTruthy();
    expect(screen.getByText('receiptproc_restore_1')).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith('/api/live-receipt-graph/receipt_backend_reopen');
  });

  it('restores Home receipt context from the backend live graph list when local storage is empty', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (input) => {
      if (input === '/api/live-receipt-graph') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            records: [
              {
                id: 'receipt_home_restore',
                syncedAt: '2026-04-02T10:00:00.000Z',
                receipt: {
                  id: 'receipt_home_restore',
                  status: 'needs_review',
                  sourceType: 'receipt_image',
                  capturedAt: '2026-04-02T09:58:00.000Z',
                },
                header: {
                  merchantName: 'Home Restore Market',
                  purchasedAt: '2026-04-02',
                  grandTotal: 14.25,
                  currency: 'USD',
                },
                sourceDocument: {
                  id: 'srcdoc_home_restore',
                  fileName: 'home-restore.jpeg',
                  mimeType: 'image/jpeg',
                  captureChannel: 'upload_photo',
                  sourceFileCount: 1,
                  checksum: 'home-restore-checksum',
                  detectedReceiptCount: 1,
                },
                extractionRun: {
                  id: 'extract_home_restore',
                  status: 'completed',
                  stage: 'ready_for_review',
                  stageLabel: 'Ready',
                  providerLabel: 'Google Gemini 2.5 Flash',
                  parserVersion: 'live_backend_ocr_v2',
                },
                parsedData: {
                  parserMode: 'live_backend_ocr',
                  parserVersion: 'live_backend_ocr_v2',
                  providerLabel: 'Google Gemini 2.5 Flash',
                  sourceFileCount: 1,
                  sourceDocumentChecksum: 'home-restore-checksum',
                  backendProcessingRecordId: 'receiptproc_home_restore',
                  backendExtractionRunId: 'extract_backend_home_restore',
                  backendSourceDocumentId: 'srcdoc_backend_home_restore',
                  fieldCandidateCount: 3,
                  lineItemCandidateCount: 1,
                },
                lineItems: [
                  {
                    id: 'line_home_restore',
                    description: 'Coffee Beans',
                    lineTotal: 14.25,
                    reviewState: 'needs_review',
                    thingCandidate: false,
                  },
                ],
                alertCount: 0,
                duplicateCandidateCount: 0,
                reviewDecisionCount: 0,
              },
            ],
          }),
        } as Response;
      }

      throw new Error(`Unexpected fetch: ${String(input)}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    expect(await screen.findByText('Finish reviewing the Home Restore Market receipt')).toBeTruthy();
    expect(screen.getAllByText('Home Restore Market').length).toBeGreaterThan(0);
    expect(fetchMock).toHaveBeenCalledWith('/api/live-receipt-graph');
  });

  it('shows persisted OCR line-item candidates and parser provenance for unknown uploaded files', () => {
    vi.useFakeTimers();

    render(<App />);

    openAddReceiptComposer();

    const fileInput = screen.getByLabelText('Choose receipt image or video');
    const file = new File(['receipt'], 'IMG_7558.jpeg', { type: 'image/jpeg' });

    fireEvent.change(fileInput, { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: 'Process receipt capture' }));

    act(() => {
      vi.advanceTimersByTime(2200);
    });

    expect(screen.getByText('Line-item candidates')).toBeTruthy();
    expect(screen.getByText('Parser provenance')).toBeTruthy();
    expect(screen.getAllByText('Pineapple And Coconut').length).toBeGreaterThan(0);
    expect(screen.getByText('Source checksum')).toBeTruthy();
  });

  it('can rerun extraction from receipt review and return to evidence-backed review', () => {
    vi.useFakeTimers();

    render(<App />);

    openAddReceiptComposer();

    const fileInput = screen.getByLabelText('Choose receipt image or video');
    const file = new File(['receipt'], 'IMG_7558.jpeg', { type: 'image/jpeg' });

    fireEvent.change(fileInput, { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: 'Process receipt capture' }));

    act(() => {
      vi.advanceTimersByTime(2200);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Rerun extraction' }));

    expect(screen.getByText('Extraction running')).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(2200);
    });

    expect(screen.getByText('Evidence trail')).toBeTruthy();
    expect(screen.getAllByText(/evidence linked/i).length).toBeGreaterThan(0);
  });

  it('saves reviewed receipt edits into the live review flow', () => {
    vi.useFakeTimers();

    render(<App />);

    openAddReceiptComposer();

    fireEvent.change(screen.getByLabelText('Merchant'), { target: { value: 'Target' } });
    fireEvent.change(screen.getByLabelText('Capture source'), { target: { value: 'Upload photo' } });
    fireEvent.change(screen.getByLabelText('Extracted summary'), { target: { value: 'Air fryer, parchment liners' } });
    fireEvent.click(screen.getByRole('button', { name: 'Process receipt capture' }));

    act(() => {
      vi.advanceTimersByTime(2200);
    });

    const merchantInput = screen.getByLabelText('Reviewed merchant');
    fireEvent.change(merchantInput, { target: { value: 'Target Run' } });
    fireEvent.blur(merchantInput);

    expect(screen.getByDisplayValue('Target Run')).toBeTruthy();

    const itemInput = screen.getByLabelText('Item 1');
    fireEvent.change(itemInput, { target: { value: 'Air Fryer XL' } });
    fireEvent.blur(itemInput);

    expect(screen.getByDisplayValue('Air Fryer Xl')).toBeTruthy();
    expect(screen.getByText('Review corrections')).toBeTruthy();
    expect(screen.getByText('Review decisions')).toBeTruthy();
    expect(screen.getAllByText('Merchant').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Target Run').length).toBeGreaterThan(0);
  });

  it('submits the form when return is pressed in a receipt field', () => {
    vi.useFakeTimers();

    render(<App />);

    openAddReceiptComposer();

    fireEvent.change(screen.getByLabelText('Merchant'), { target: { value: 'Target' } });
    fireEvent.change(screen.getByLabelText('Capture source'), { target: { value: 'Upload photo' } });
    fireEvent.change(screen.getByLabelText('Extracted summary'), { target: { value: 'Air fryer, parchment liners' } });
    fireEvent.keyDown(screen.getByLabelText('Merchant'), { key: 'Enter', code: 'Enter' });

    expect(screen.getByText('Extraction running')).toBeTruthy();
  });

  it('grounds agent chat answers in trusted receipt data', () => {
    vi.useFakeTimers();

    render(<App />);

    openAddReceiptComposer();

    fireEvent.change(screen.getByLabelText('Merchant'), { target: { value: 'Target' } });
    fireEvent.change(screen.getByLabelText('Capture source'), { target: { value: 'Upload photo' } });
    fireEvent.change(screen.getByLabelText('Extracted summary'), { target: { value: 'Air fryer, parchment liners' } });
    fireEvent.click(screen.getByRole('button', { name: 'Process receipt capture' }));

    act(() => {
      vi.advanceTimersByTime(2200);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Mark review complete' }));
    fireEvent.click(screen.getByRole('button', { name: /open add or ask menu/i }));
    fireEvent.click(screen.getByText('Ask Agent — Chat'));

    expect(screen.getAllByText('What did I buy at Target?').length).toBeGreaterThan(0);
    expect(screen.getByText(/grounded receipt match/i)).toBeTruthy();
    expect(screen.getAllByText('Air Fryer').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Target receipt').length).toBeGreaterThan(0);
  });

  it('projects a trusted receipt into the Memories timeline', () => {
    vi.useFakeTimers();

    render(<App />);

    openAddReceiptComposer();

    fireEvent.change(screen.getByLabelText('Merchant'), { target: { value: 'Target' } });
    fireEvent.change(screen.getByLabelText('Capture source'), { target: { value: 'Upload photo' } });
    fireEvent.change(screen.getByLabelText('Extracted summary'), { target: { value: 'Air fryer, parchment liners' } });
    fireEvent.click(screen.getByRole('button', { name: 'Process receipt capture' }));

    act(() => {
      vi.advanceTimersByTime(2200);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Mark review complete' }));
    fireEvent.click(screen.getByRole('navigation', { name: 'Primary navigation' }).querySelectorAll('button')[4]);

    expect(screen.getAllByText('Memories').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Target .* (day|moment)/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/(project or setup moment|household routine|lightweight memory candidate)/i)).toBeTruthy();
  });

  it('shows structured purchase participation on a linked person', () => {
    vi.useFakeTimers();

    render(<App />);

    openAddReceiptComposer();

    fireEvent.change(screen.getByLabelText('Merchant'), { target: { value: 'Target' } });
    fireEvent.change(screen.getByLabelText('Capture source'), { target: { value: 'Upload photo' } });
    fireEvent.change(screen.getByLabelText('Extracted summary'), { target: { value: 'Air fryer, parchment liners' } });
    fireEvent.click(screen.getByRole('button', { name: 'Process receipt capture' }));

    act(() => {
      vi.advanceTimersByTime(2200);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Mark review complete' }));
    fireEvent.click(screen.getByRole('navigation', { name: 'Primary navigation' }).querySelectorAll('button')[3]);
    fireEvent.click(screen.getAllByText('Shanshan').find((element) => element.tagName === 'H3')?.closest('button') as HTMLElement);

    expect(screen.getByText('Purchase participation')).toBeTruthy();
    expect(screen.getByText('household member')).toBeTruthy();
    expect(screen.getByText('Structured spend share across trusted purchases')).toBeTruthy();
    expect(screen.getByText(/\$\d+\.\d{2} structured spend share/i)).toBeTruthy();
  });
});
