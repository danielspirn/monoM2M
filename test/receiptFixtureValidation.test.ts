import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createLiveReceiptBatch,
  getLiveReceiptStudioPayload,
  resetLiveReceiptStore,
} from '@/mocks/receiptWorkflowStore';
import { receiptFixtureValidationCases } from '@/test/fixtures/receipts/validationCases';

describe('receipt fixture validation harness', () => {
  beforeEach(() => {
    resetLiveReceiptStore();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-30T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses the uploaded grocery fixture to validate quiet single-receipt enrichment', () => {
    const result = createLiveReceiptBatch(receiptFixtureValidationCases.grocery.input);

    vi.advanceTimersByTime(2200);

    const payload = getLiveReceiptStudioPayload(result.primaryReceiptId);

    expect(payload).toBeTruthy();
    expect(payload?.sourceDocument.sourceFiles).toEqual(receiptFixtureValidationCases.grocery.input.fixtureFiles);
    expect(payload?.captureSession.detectedReceiptCount).toBe(1);
    expect(payload?.structuredData.retailerProfile).toBe('known retailer');
    expect(payload?.structuredData.lifestyleTags).toContain('food at home');
    expect(payload?.alerts.filter((alert) => alert.level === 'issue')).toHaveLength(0);
  });

  it('uses the uploaded service invoice fixture to validate non-retail handling', () => {
    const result = createLiveReceiptBatch(receiptFixtureValidationCases.serviceInvoice.input);

    vi.advanceTimersByTime(2200);

    const payload = getLiveReceiptStudioPayload(result.primaryReceiptId);

    expect(payload).toBeTruthy();
    expect(payload?.sourceDocument.sourceFiles).toEqual(receiptFixtureValidationCases.serviceInvoice.input.fixtureFiles);
    expect(payload?.structuredData.retailerProfile).toBe('known service provider');
    expect(payload?.structuredData.warrantySupportLabel).toBe('No warranty signal detected');
  });

  it('uses the uploaded duplicate pair to validate duplicate alerting', () => {
    createLiveReceiptBatch(receiptFixtureValidationCases.duplicatePair.firstInput);
    vi.advanceTimersByTime(2200);

    const second = createLiveReceiptBatch(receiptFixtureValidationCases.duplicatePair.secondInput);
    vi.advanceTimersByTime(2200);

    const payload = getLiveReceiptStudioPayload(second.primaryReceiptId);

    expect(payload).toBeTruthy();
    expect(payload?.sourceDocument.sourceFiles).toEqual(receiptFixtureValidationCases.duplicatePair.secondInput.fixtureFiles);
    expect(payload?.alerts.some((alert) => alert.kind === 'duplicate' && alert.level === 'issue')).toBe(true);
  });

  it('uses multiple uploaded files to validate batch capture lineage', () => {
    const result = createLiveReceiptBatch(receiptFixtureValidationCases.multiReceiptBatch.input);

    vi.advanceTimersByTime(2200);

    const payload = getLiveReceiptStudioPayload(result.primaryReceiptId);

    expect(result.detectedReceiptCount).toBe(3);
    expect(payload).toBeTruthy();
    expect(payload?.sourceDocument.sourceFiles).toEqual(receiptFixtureValidationCases.multiReceiptBatch.input.fixtureFiles);
    expect(payload?.captureSession.detectedReceiptCount).toBe(3);
    expect(payload?.captureSession.siblings).toHaveLength(3);
    expect(payload?.captureSession.siblings.map((receipt) => receipt.merchantName)).toEqual(['House Cleaning', 'Safeway', 'Restaurant Payment']);
    expect(payload?.alerts.some((alert) => alert.body.includes('3 receipts'))).toBe(true);
  });
});
