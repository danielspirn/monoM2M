import { getReceiptOcrProviderProfile } from './providerProfiles';
import type {
  ReceiptOcrEvaluationPolicy,
  ReceiptOcrEvaluationScorecard,
  ReceiptOcrEvaluationStage,
  ReceiptOcrInputKind,
} from './types';

export const receiptOcrEvaluationPolicyV1: ReceiptOcrEvaluationPolicy = {
  version: 'receipt-ocr-eval-v1',
  overallMinimumScore: 0.92,
  lineItemMinimumScore: 0.9,
  duplicatePrecisionMinimumScore: 0.98,
  splitAccuracyMinimumScore: 0.9,
  minimumCostSavingsRatioForFallback: 0.35,
};

export type ReceiptOcrEvaluationMetrics = {
  merchantAccuracy: number;
  dateAccuracy: number;
  totalAccuracy: number;
  lineItemAccuracy: number;
  splitAccuracy: number;
  duplicatePrecision: number;
  estimatedPrimaryCostUsd: number;
  estimatedFallbackCostUsd: number;
};

export function createReceiptOcrEvaluationScorecard(
  metrics: ReceiptOcrEvaluationMetrics,
): ReceiptOcrEvaluationScorecard {
  const overallScore = roundScore(
    metrics.merchantAccuracy * 0.22
      + metrics.dateAccuracy * 0.12
      + metrics.totalAccuracy * 0.2
      + metrics.lineItemAccuracy * 0.28
      + metrics.splitAccuracy * 0.1
      + metrics.duplicatePrecision * 0.08,
  );

  const estimatedCostSavingsRatio = metrics.estimatedPrimaryCostUsd > 0
    ? roundScore((metrics.estimatedPrimaryCostUsd - metrics.estimatedFallbackCostUsd) / metrics.estimatedPrimaryCostUsd)
    : 0;

  return {
    overallScore,
    merchantAccuracy: roundScore(metrics.merchantAccuracy),
    dateAccuracy: roundScore(metrics.dateAccuracy),
    totalAccuracy: roundScore(metrics.totalAccuracy),
    lineItemAccuracy: roundScore(metrics.lineItemAccuracy),
    splitAccuracy: roundScore(metrics.splitAccuracy),
    duplicatePrecision: roundScore(metrics.duplicatePrecision),
    estimatedCostSavingsRatio,
  };
}

export function evaluateFallbackReadiness(params: {
  inputKind: ReceiptOcrInputKind;
  scorecard: ReceiptOcrEvaluationScorecard;
}): {
  stage: ReceiptOcrEvaluationStage;
  approved: boolean;
  reason: string;
} {
  const { inputKind, scorecard } = params;

  if (inputKind !== 'single_receipt_image') {
    return {
      stage: 'hold',
      approved: false,
      reason: 'Fallback routing is limited to single receipt images until PDF, video, and split-receipt evals pass.',
    };
  }

  if (scorecard.overallScore < receiptOcrEvaluationPolicyV1.overallMinimumScore) {
    return {
      stage: 'hold',
      approved: false,
      reason: 'Fallback vendor is below the overall receipt OCR quality threshold.',
    };
  }

  if (scorecard.lineItemAccuracy < receiptOcrEvaluationPolicyV1.lineItemMinimumScore) {
    return {
      stage: 'hold',
      approved: false,
      reason: 'Fallback vendor is not yet accurate enough on line-item extraction.',
    };
  }

  if (scorecard.duplicatePrecision < receiptOcrEvaluationPolicyV1.duplicatePrecisionMinimumScore) {
    return {
      stage: 'hold',
      approved: false,
      reason: 'Fallback vendor is not yet precise enough for duplicate detection safety.',
    };
  }

  if (scorecard.splitAccuracy < receiptOcrEvaluationPolicyV1.splitAccuracyMinimumScore) {
    return {
      stage: 'hold',
      approved: false,
      reason: 'Fallback vendor is not yet reliable enough on grouped receipt splitting.',
    };
  }

  if (scorecard.estimatedCostSavingsRatio < receiptOcrEvaluationPolicyV1.minimumCostSavingsRatioForFallback) {
    return {
      stage: 'hold',
      approved: false,
      reason: 'Fallback vendor does not deliver enough savings to justify vendor switching risk.',
    };
  }

  return {
    stage: 'fallback_approved',
    approved: true,
    reason: 'Fallback vendor passed the receipt OCR eval gate and clears the savings threshold.',
  };
}

export function describeReceiptOcrDecision() {
  const primary = getReceiptOcrProviderProfile('google_gemini_2_5_flash');
  const fallback = getReceiptOcrProviderProfile('openai_gpt_4o_mini');

  return `${primary.displayName} is the default OCR route. ${fallback.displayName} can only take over after shared receipt evals approve it for the requested input kind.`;
}

function roundScore(value: number) {
  return Math.round(value * 1000) / 1000;
}
