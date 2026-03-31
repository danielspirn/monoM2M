import { receiptOcrEvaluationPolicyV1, evaluateFallbackReadiness } from './evaluationHarness';
import { getReceiptOcrProviderProfile } from './providerProfiles';
import type {
  ReceiptOcrEvaluationScorecard,
  ReceiptOcrInputKind,
  ReceiptOcrRouteSelection,
} from './types';

export function buildFixtureCatalogOcrRoute(reason: string, inputKind: ReceiptOcrInputKind): ReceiptOcrRouteSelection {
  return {
    inputKind,
    routingMode: 'fixture_catalog_short_circuit',
    provider: getReceiptOcrProviderProfile('internal_fixture_catalog'),
    fallbackProvider: null,
    evaluationPolicy: receiptOcrEvaluationPolicyV1,
    evaluationStage: 'not_required',
    recommendedForProduction: false,
    reason,
  };
}

export function buildManualSeedOcrRoute(reason: string, inputKind: ReceiptOcrInputKind): ReceiptOcrRouteSelection {
  return {
    inputKind,
    routingMode: 'manual_seed',
    provider: getReceiptOcrProviderProfile('internal_fixture_catalog'),
    fallbackProvider: null,
    evaluationPolicy: receiptOcrEvaluationPolicyV1,
    evaluationStage: 'not_required',
    recommendedForProduction: false,
    reason,
  };
}

export function selectReceiptOcrRoute(params: {
  inputKind: ReceiptOcrInputKind;
  preferLowerCost?: boolean;
  fallbackScorecard?: ReceiptOcrEvaluationScorecard;
}): ReceiptOcrRouteSelection {
  const { inputKind, preferLowerCost = false, fallbackScorecard } = params;
  const primary = getReceiptOcrProviderProfile('google_gemini_2_5_flash');
  const fallback = inputKind === 'single_receipt_image'
    ? getReceiptOcrProviderProfile('openai_gpt_4o_mini')
    : null;

  if (preferLowerCost && fallback && fallbackScorecard) {
    const fallbackDecision = evaluateFallbackReadiness({
      inputKind,
      scorecard: fallbackScorecard,
    });

    if (fallbackDecision.approved) {
      return {
        inputKind,
        routingMode: 'vendor_fallback',
        provider: fallback,
        fallbackProvider: primary,
        evaluationPolicy: receiptOcrEvaluationPolicyV1,
        evaluationStage: fallbackDecision.stage,
        recommendedForProduction: true,
        reason: `${fallbackDecision.reason} ${fallback.displayName} is cheaper for single-receipt image OCR, so the route can switch when cost pressure matters.`,
      };
    }
  }

  return {
    inputKind,
    routingMode: 'vendor_primary',
    provider: primary,
    fallbackProvider: fallback,
    evaluationPolicy: receiptOcrEvaluationPolicyV1,
    evaluationStage: 'shadow_eval_required',
    recommendedForProduction: false,
    reason:
      fallback
        ? `${primary.displayName} stays primary until the shared fallback eval clears single-receipt image quality and savings gates.`
        : `${primary.displayName} is the only approved route for this receipt input kind right now.`,
  };
}
