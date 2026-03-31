import { act } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resetLiveReceiptStore } from '@/mocks/receiptWorkflowStore';
import { App } from './App';

describe('Milestone 1 shell', () => {
  beforeEach(() => {
    resetLiveReceiptStore();
  });

  afterEach(() => {
    vi.useRealTimers();
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

    fireEvent.click(screen.getByRole('button', { name: /open add or ask menu/i }));
    fireEvent.click(screen.getByText('Add Receipt'));

    fireEvent.click(screen.getByRole('button', { name: 'Process receipt capture' }));

    expect(screen.getByText('Extraction running')).toBeTruthy();

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

    fireEvent.click(screen.getByRole('button', { name: /open add or ask menu/i }));
    fireEvent.click(screen.getByText('Add Receipt'));
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

    fireEvent.click(screen.getByRole('button', { name: /open add or ask menu/i }));
    fireEvent.click(screen.getByText('Add Receipt'));
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

    fireEvent.click(screen.getByRole('button', { name: /open add or ask menu/i }));
    fireEvent.click(screen.getByText('Add Receipt'));

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

    fireEvent.click(screen.getByRole('button', { name: /open add or ask menu/i }));
    fireEvent.click(screen.getByText('Add Receipt'));

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
    expect(screen.getByText('Evidence links')).toBeTruthy();
    expect(screen.getAllByText('Linked documents').length).toBeGreaterThan(0);
    expect(screen.getByText('Document links')).toBeTruthy();
    expect(screen.getByText('Tag graph')).toBeTruthy();
    expect(screen.getByText('Retrieval profile')).toBeTruthy();
    expect(screen.getByText('Capture provenance')).toBeTruthy();
    expect(screen.getByText('Merchant record')).toBeTruthy();
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

  it('can preload a real uploaded fixture into the receipt capture flow', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /open add or ask menu/i }));
    fireEvent.click(screen.getByText('Add Receipt'));

    fireEvent.change(screen.getByLabelText('Uploaded fixture'), { target: { value: 'Safeway grocery receipt' } });

    expect((screen.getByLabelText('Merchant') as HTMLInputElement).value).toBe('Safeway');
    expect((screen.getByLabelText('Capture source') as HTMLSelectElement).value).toBe('Upload photo');
    expect((screen.getByLabelText('Extracted summary') as HTMLTextAreaElement).value).toContain('bananas');
  });

  it('can choose a real uploaded receipt image and process it through review', () => {
    vi.useFakeTimers();

    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /open add or ask menu/i }));
    fireEvent.click(screen.getByText('Add Receipt'));

    const fileInput = screen.getByLabelText('Choose receipt image or video');
    const file = new File(['receipt'], 'IMG_7573.jpeg', { type: 'image/jpeg' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    expect((screen.getByLabelText('Merchant') as HTMLInputElement).value).toBe('Safeway');

    fireEvent.click(screen.getByRole('button', { name: 'Process receipt capture' }));

    act(() => {
      vi.advanceTimersByTime(2200);
    });

    expect(screen.getByRole('heading', { name: 'Safeway' })).toBeTruthy();
    expect(screen.getAllByText('Raw document').length).toBeGreaterThan(0);
    expect(screen.getByText('Uploaded files')).toBeTruthy();
  });

  it('shows persisted OCR line-item candidates and parser provenance for unknown uploaded files', () => {
    vi.useFakeTimers();

    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /open add or ask menu/i }));
    fireEvent.click(screen.getByText('Add Receipt'));

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

    fireEvent.click(screen.getByRole('button', { name: /open add or ask menu/i }));
    fireEvent.click(screen.getByText('Add Receipt'));

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

    fireEvent.click(screen.getByRole('button', { name: /open add or ask menu/i }));
    fireEvent.click(screen.getByText('Add Receipt'));

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
  });

  it('submits the form when return is pressed in a receipt field', () => {
    vi.useFakeTimers();

    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /open add or ask menu/i }));
    fireEvent.click(screen.getByText('Add Receipt'));

    fireEvent.change(screen.getByLabelText('Merchant'), { target: { value: 'Target' } });
    fireEvent.change(screen.getByLabelText('Capture source'), { target: { value: 'Upload photo' } });
    fireEvent.change(screen.getByLabelText('Extracted summary'), { target: { value: 'Air fryer, parchment liners' } });
    fireEvent.keyDown(screen.getByLabelText('Merchant'), { key: 'Enter', code: 'Enter' });

    expect(screen.getByText('Extraction running')).toBeTruthy();
  });

  it('grounds agent chat answers in trusted receipt data', () => {
    vi.useFakeTimers();

    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /open add or ask menu/i }));
    fireEvent.click(screen.getByText('Add Receipt'));

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

    fireEvent.click(screen.getByRole('button', { name: /open add or ask menu/i }));
    fireEvent.click(screen.getByText('Add Receipt'));

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

    fireEvent.click(screen.getByRole('button', { name: /open add or ask menu/i }));
    fireEvent.click(screen.getByText('Add Receipt'));

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
