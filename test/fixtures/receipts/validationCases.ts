import { getReceiptFixtureScenario } from '@/mocks/receiptFixtureScenarios';

export const receiptFixtureValidationCases = {
  grocery: {
    scenario: getReceiptFixtureScenario('single_grocery_happy_path'),
    input: getReceiptFixtureScenario('single_grocery_happy_path').input,
  },
  serviceInvoice: {
    scenario: getReceiptFixtureScenario('service_invoice_nonstandard'),
    input: getReceiptFixtureScenario('service_invoice_nonstandard').input,
  },
  duplicatePair: {
    scenario: getReceiptFixtureScenario('duplicate_receipt_pair_a'),
    firstInput: getReceiptFixtureScenario('duplicate_receipt_pair_a').input,
    secondInput: getReceiptFixtureScenario('duplicate_receipt_pair_b').input,
  },
  multiReceiptBatch: {
    scenario: getReceiptFixtureScenario('uploaded_multi_receipt_batch'),
    input: getReceiptFixtureScenario('uploaded_multi_receipt_batch').input,
  },
} as const;
