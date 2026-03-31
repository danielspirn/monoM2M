import catalog from '../test/fixtures/receipts/library/catalog.json';

type CatalogScenario = {
  id: string;
  file?: string;
  files?: string[];
  label: string;
  notes: string;
};

type CatalogEntry = {
  fileName: string;
  relativePath: string;
};

type ReceiptFixtureScenarioInput = {
  merchant: string;
  purchaseDate: string;
  source: string;
  summary: string;
  fixtureFiles: string[];
};

export type ReceiptFixtureScenario = {
  id: string;
  label: string;
  notes: string;
  input: ReceiptFixtureScenarioInput;
};

type ReceiptDraftLike = {
  merchant?: string;
  date?: string;
  source?: string;
  summary?: string;
  fixtureScenario?: string;
  selectedFileNames?: string;
};

const curatedScenarios = catalog.curatedScenarios as CatalogScenario[];
const catalogEntries = catalog.entries as CatalogEntry[];

export const noReceiptFixtureScenarioLabel = 'No uploaded fixture';

function getCatalogScenario(id: string) {
  const scenario = curatedScenarios.find((entry) => entry.id === id);

  if (!scenario) {
    throw new Error(`Missing curated receipt scenario: ${id}`);
  }

  return scenario;
}

export const receiptFixtureScenarios: ReceiptFixtureScenario[] = [
  {
    id: 'single_grocery_happy_path',
    label: 'Safeway grocery receipt',
    notes: getCatalogScenario('single_grocery_happy_path').notes,
    input: {
      merchant: 'Safeway',
      purchaseDate: '2025-05-22T12:30:00-07:00',
      source: 'Upload photo',
      summary: 'Bon Ami granola, bananas, produce',
      fixtureFiles: [getCatalogScenario('single_grocery_happy_path').file!],
    },
  },
  {
    id: 'restaurant_payment_slip',
    label: 'Restaurant card payment slip',
    notes: getCatalogScenario('restaurant_payment_slip').notes,
    input: {
      merchant: 'Restaurant Payment',
      purchaseDate: '2025-05-22T19:20:00-07:00',
      source: 'Upload photo',
      summary: 'Card payment slip, subtotal, tip, total',
      fixtureFiles: [getCatalogScenario('restaurant_payment_slip').file!],
    },
  },
  {
    id: 'service_invoice_nonstandard',
    label: 'Cleaning invoice',
    notes: getCatalogScenario('service_invoice_nonstandard').notes,
    input: {
      merchant: 'House Cleaning',
      purchaseDate: '2023-03-28T12:00:00-07:00',
      source: 'Upload photo',
      summary: 'Bathrooms, kitchen, glass sliders, dusting, floors mop linoleum',
      fixtureFiles: [getCatalogScenario('service_invoice_nonstandard').file!],
    },
  },
  {
    id: 'duplicate_receipt_pair_a',
    label: 'Duplicate pair copy A',
    notes: `${getCatalogScenario('duplicate_receipt_pair').notes} First copy.`,
    input: {
      merchant: 'Household Market',
      purchaseDate: '2025-11-03T18:20:00-08:00',
      source: 'Upload photo',
      summary: 'Pantry refill, paper towels, cleaning spray',
      fixtureFiles: [getCatalogScenario('duplicate_receipt_pair').files![0]],
    },
  },
  {
    id: 'duplicate_receipt_pair_b',
    label: 'Duplicate pair copy B',
    notes: `${getCatalogScenario('duplicate_receipt_pair').notes} Second copy.`,
    input: {
      merchant: 'Household Market',
      purchaseDate: '2025-11-03T18:20:00-08:00',
      source: 'Upload photo',
      summary: 'Pantry refill, paper towels, cleaning spray',
      fixtureFiles: [getCatalogScenario('duplicate_receipt_pair').files![1]],
    },
  },
  {
    id: 'uploaded_multi_receipt_batch',
    label: 'Uploaded multi-receipt batch',
    notes: 'Three real uploaded files grouped into one batch capture to validate splitting behavior.',
    input: {
      merchant: 'Mixed upload',
      purchaseDate: '2026-03-30T09:00:00-07:00',
      source: 'Multi-receipt photo',
      summary: 'Mixed uploaded receipt batch',
      fixtureFiles: [
        getCatalogScenario('single_grocery_happy_path').file!,
        getCatalogScenario('restaurant_payment_slip').file!,
        getCatalogScenario('service_invoice_nonstandard').file!,
      ],
    },
  },
];

export const receiptFixtureScenarioOptions = [
  noReceiptFixtureScenarioLabel,
  ...receiptFixtureScenarios.map((scenario) => scenario.label),
];

export function getReceiptFixtureScenario(id: string) {
  const scenario = receiptFixtureScenarios.find((entry) => entry.id === id);

  if (!scenario) {
    throw new Error(`Missing receipt fixture scenario: ${id}`);
  }

  return scenario;
}

export function findReceiptFixtureScenarioByLabel(label?: string | null) {
  if (!label || label === noReceiptFixtureScenarioLabel) {
    return null;
  }

  return receiptFixtureScenarios.find((scenario) => scenario.label === label) ?? null;
}

export function applyReceiptFixtureScenarioToDraft<T extends ReceiptDraftLike>(draft: T, label: string): T {
  const scenario = findReceiptFixtureScenarioByLabel(label);

  if (!scenario) {
    return {
      ...draft,
      fixtureScenario: label,
    };
  }

  return {
    ...draft,
    fixtureScenario: scenario.label,
    selectedFileNames: scenario.input.fixtureFiles.map((file) => file.split('/').pop() ?? file).join(', '),
    merchant: scenario.input.merchant,
    date: scenario.input.purchaseDate,
    source: scenario.input.source,
    summary: scenario.input.summary,
  };
}

function findFixtureFilesByNames(fileNames: string[]) {
  const requested = new Set(fileNames);
  return catalogEntries
    .filter((entry) => requested.has(entry.fileName))
    .map((entry) => entry.relativePath);
}

function hasSameFiles(left: string[], right: string[]) {
  if (left.length !== right.length) {
    return false;
  }

  const leftSorted = [...left].sort();
  const rightSorted = [...right].sort();
  return leftSorted.every((value, index) => value === rightSorted[index]);
}

export function findReceiptFixtureScenarioByFileNames(fileNames: string[]) {
  if (!fileNames.length) {
    return null;
  }

  const fixtureFiles = findFixtureFilesByNames(fileNames);

  if (!fixtureFiles.length) {
    return null;
  }

  return receiptFixtureScenarios.find((scenario) => hasSameFiles(scenario.input.fixtureFiles, fixtureFiles)) ?? null;
}

export function applyReceiptFilesToDraft<T extends ReceiptDraftLike>(draft: T, fileNames: string[]): T {
  const normalizedNames = fileNames.filter(Boolean);

  if (!normalizedNames.length) {
    return {
      ...draft,
      selectedFileNames: '',
    };
  }

  const scenario = findReceiptFixtureScenarioByFileNames(normalizedNames);

  if (scenario) {
    return {
      ...applyReceiptFixtureScenarioToDraft(draft, scenario.label),
      selectedFileNames: normalizedNames.join(', '),
    };
  }

  return {
    ...draft,
    fixtureScenario: noReceiptFixtureScenarioLabel,
    selectedFileNames: normalizedNames.join(', '),
    source: normalizedNames.length > 1 ? 'Multi-receipt photo' : draft.source || 'Upload photo',
  };
}

export function resolveReceiptFixtureFilesFromDraft(draft: ReceiptDraftLike) {
  const scenario = findReceiptFixtureScenarioByLabel(draft.fixtureScenario);

  if (scenario) {
    return scenario.input.fixtureFiles;
  }

  const selectedFileNames = draft.selectedFileNames
    ?.split(',')
    .map((value) => value.trim())
    .filter(Boolean) ?? [];

  return findFixtureFilesByNames(selectedFileNames);
}
