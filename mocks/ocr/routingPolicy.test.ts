import { describe, expect, it } from 'vitest';

import { createReceiptOcrEvaluationScorecard } from './evaluationHarness';
import { selectReceiptOcrRoute } from './routingPolicy';

describe('receipt OCR routing policy', () => {
  it('keeps Gemini as the default OCR route while fallback evals are still pending', () => {
    const route = selectReceiptOcrRoute({
      inputKind: 'single_receipt_image',
    });

    expect(route.provider.id).toBe('google_gemini_2_5_flash');
    expect(route.fallbackProvider?.id).toBe('openai_gpt_4o_mini');
    expect(route.recommendedForProduction).toBe(false);
    expect(route.evaluationStage).toBe('shadow_eval_required');
  });

  it('allows the lower-cost fallback only after the eval gate is satisfied', () => {
    const route = selectReceiptOcrRoute({
      inputKind: 'single_receipt_image',
      preferLowerCost: true,
      fallbackScorecard: createReceiptOcrEvaluationScorecard({
        merchantAccuracy: 0.98,
        dateAccuracy: 0.95,
        totalAccuracy: 0.97,
        lineItemAccuracy: 0.94,
        splitAccuracy: 0.93,
        duplicatePrecision: 0.99,
        estimatedPrimaryCostUsd: 1,
        estimatedFallbackCostUsd: 0.45,
      }),
    });

    expect(route.provider.id).toBe('openai_gpt_4o_mini');
    expect(route.fallbackProvider?.id).toBe('google_gemini_2_5_flash');
    expect(route.recommendedForProduction).toBe(true);
    expect(route.evaluationStage).toBe('fallback_approved');
  });

  it('holds fallback routing for PDFs even if a cheaper scorecard exists', () => {
    const route = selectReceiptOcrRoute({
      inputKind: 'receipt_pdf',
      preferLowerCost: true,
      fallbackScorecard: createReceiptOcrEvaluationScorecard({
        merchantAccuracy: 0.99,
        dateAccuracy: 0.99,
        totalAccuracy: 0.99,
        lineItemAccuracy: 0.99,
        splitAccuracy: 0.99,
        duplicatePrecision: 0.99,
        estimatedPrimaryCostUsd: 1,
        estimatedFallbackCostUsd: 0.2,
      }),
    });

    expect(route.provider.id).toBe('google_gemini_2_5_flash');
    expect(route.fallbackProvider).toBeNull();
    expect(route.evaluationStage).toBe('shadow_eval_required');
  });
});
