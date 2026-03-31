import { receiptFixtureScenarios } from './receiptFixtureScenarios';
import ocrSnapshots from '../test/fixtures/receipts/ocr/geminiSnapshots.json';
import { buildFixtureCatalogOcrRoute, buildManualSeedOcrRoute, selectReceiptOcrRoute } from './ocr/routingPolicy';
import type { ReceiptOcrInputKind, ReceiptOcrRouteSelection } from './ocr/types';
import type { CreateReceiptInput } from './receiptWorkflowStore';

type ReceiptDraft = {
  merchant: string;
  purchaseDate: string;
  summary: string;
  itemCandidates?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    confidence: number;
  }>;
};

export type ReceiptParserResult = {
  parserVersion: string;
  parserMode: 'fixture_catalog_match' | 'file_name_match' | 'live_ocr_snapshot' | 'vendor_candidate' | 'manual_seed';
  ocrRoute: ReceiptOcrRouteSelection;
  drafts: ReceiptDraft[];
  processingNote: string;
};

type ReceiptFixtureDraft = {
  files: string[];
  draft: ReceiptDraft;
};

const fixtureDrafts: ReceiptFixtureDraft[] = receiptFixtureScenarios.map((scenario) => ({
  files: scenario.input.fixtureFiles,
  draft: {
    merchant: scenario.input.merchant,
    purchaseDate: scenario.input.purchaseDate,
    summary: scenario.input.summary,
  },
}));

type OcrSnapshotRecord = {
  filePath: string;
  merchant: string | null;
  purchaseDate: string | null;
  grandTotal: string | null;
  itemCandidates: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    confidence: number;
  }>;
};

const geminiSnapshotRecords = (ocrSnapshots.snapshots as OcrSnapshotRecord[]) ?? [];

export function parseReceiptCaptureInput(input: CreateReceiptInput): ReceiptParserResult {
  const fixtureFiles = input.fixtureFiles?.filter(Boolean) ?? [];
  const inputKind = resolveReceiptOcrInputKind(input, fixtureFiles);

  if (fixtureFiles.length) {
    if (fixtureFiles.length === 1) {
      const exactDrafts = resolveExactFixtureDrafts(fixtureFiles);

      if (exactDrafts.length) {
        return {
          parserVersion: 'receipt-fixture-parser-v1',
          parserMode: 'fixture_catalog_match',
          ocrRoute: buildFixtureCatalogOcrRoute(
            'Exact fixture match short-circuited external OCR and seeded a deterministic receipt draft.',
            inputKind,
          ),
          drafts: exactDrafts,
          processingNote: 'Uploaded file matched the receipt fixture library and was parsed into a receipt draft automatically.',
        };
      }
    }

    const fileMatchedDrafts = resolveFileMatchedDrafts(fixtureFiles, input);

    if (fileMatchedDrafts.length) {
      return {
        parserVersion: 'receipt-file-name-parser-v1',
        parserMode: 'file_name_match',
        ocrRoute: buildFixtureCatalogOcrRoute(
          'Known uploaded file names matched the fixture library, so external OCR was skipped for this mock flow.',
          inputKind,
        ),
        drafts: fileMatchedDrafts,
        processingNote:
          fileMatchedDrafts.length > 1
            ? 'Uploaded file names matched known receipt patterns and were split into individual drafts.'
            : 'Uploaded file name matched a known receipt pattern and was parsed into a receipt draft.',
      };
    }

    const snapshotDrafts = resolveGeminiSnapshotDrafts(fixtureFiles, input);

    if (snapshotDrafts.length) {
      return {
        parserVersion: 'receipt-gemini-snapshot-v1',
        parserMode: 'live_ocr_snapshot',
        ocrRoute: buildFixtureCatalogOcrRoute(
          'A stored live Gemini OCR snapshot was found for this uploaded file and seeded parsed item candidates.',
          inputKind,
        ),
        drafts: snapshotDrafts,
        processingNote: 'Uploaded file matched a stored Gemini OCR snapshot and was seeded with OCR-derived item candidates.',
      };
    }

    const ocrRoute = selectReceiptOcrRoute({
      inputKind,
      preferLowerCost: false,
    });

    return {
      parserVersion: `receipt-${ocrRoute.provider.vendorId}-router-v1`,
      parserMode: 'vendor_candidate',
      ocrRoute,
      drafts: [],
      processingNote: `${ocrRoute.provider.displayName} is the current OCR route candidate for this upload. ${ocrRoute.reason}`,
    };
  }

  return {
    parserVersion: 'receipt-manual-seed-v1',
    parserMode: 'manual_seed',
    ocrRoute: buildManualSeedOcrRoute(
      'No upload was attached, so the receipt flow falls back to the user-provided seed fields.',
      inputKind,
    ),
    drafts: [],
    processingNote: 'Uploaded files did not match a known parser profile, so receipt capture will use the provided merchant, date, and summary seed.',
  };
}

function resolveReceiptOcrInputKind(input: CreateReceiptInput, fixtureFiles: string[]): ReceiptOcrInputKind {
  const source = input.source.toLowerCase();

  if (source.includes('pdf')) {
    return 'receipt_pdf';
  }

  if (source.includes('video')) {
    return 'receipt_video_frame_set';
  }

  if (fixtureFiles.length > 1 || source.includes('multi')) {
    return 'multi_receipt_image';
  }

  return 'single_receipt_image';
}

function resolveExactFixtureDrafts(fixtureFiles: string[]) {
  const sortedInput = [...fixtureFiles].sort();

  return receiptFixtureScenarios
    .filter((scenario) => hasSameFiles(scenario.input.fixtureFiles, sortedInput))
    .map((scenario) => ({
      merchant: scenario.input.merchant,
      purchaseDate: scenario.input.purchaseDate,
      summary: scenario.input.summary,
    }));
}

function resolveFileMatchedDrafts(fixtureFiles: string[], input: CreateReceiptInput) {
  const knownMatches = fixtureFiles.flatMap((filePath) => {
    const matched = fixtureDrafts.find((entry) => entry.files.includes(filePath));

    if (matched) {
      return [matched.draft];
    }

    return [];
  });

  if (!knownMatches.length) {
    return [];
  }

  const matchedDrafts = fixtureFiles.flatMap((filePath) => {
    const matched = fixtureDrafts.find((entry) => entry.files.includes(filePath));

    if (matched) {
      return [matched.draft];
    }

    return [buildFallbackDraftForFile(filePath, input)];
  });

  return dedupeDrafts(matchedDrafts).slice(0, 4);
}

function resolveGeminiSnapshotDrafts(fixtureFiles: string[], input: CreateReceiptInput) {
  return fixtureFiles.flatMap((filePath) => {
    const snapshot = geminiSnapshotRecords.find((record) => record.filePath === filePath);

    if (!snapshot) {
      return [];
    }

    const itemDescriptions = snapshot.itemCandidates
      .map((item) => item.description)
      .filter(Boolean)
      .slice(0, 4);

    return [{
      merchant: snapshot.merchant || input.merchant || 'Uploaded Receipt',
      purchaseDate: snapshot.purchaseDate || input.purchaseDate,
      summary: itemDescriptions.length ? itemDescriptions.join(', ') : input.summary,
      itemCandidates: snapshot.itemCandidates,
    }];
  });
}

function buildFallbackDraftForFile(filePath: string, input: CreateReceiptInput): ReceiptDraft {
  const fileName = filePath.split('/').pop() ?? 'Uploaded receipt';
  const label = fileName.replace(/\.[a-z0-9]+$/i, '').replace(/[_-]+/g, ' ').trim();

  return {
    merchant: input.merchant || 'Uploaded Receipt',
    purchaseDate: input.purchaseDate,
    summary: input.summary || `${label} uploaded for receipt parsing`,
  };
}

function dedupeDrafts(drafts: ReceiptDraft[]) {
  const seen = new Set<string>();

  return drafts.filter((draft) => {
    const key = `${draft.merchant}|${draft.purchaseDate}|${draft.summary}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function hasSameFiles(left: string[], right: string[]) {
  if (left.length !== right.length) {
    return false;
  }

  const leftSorted = [...left].sort();
  return leftSorted.every((value, index) => value === right[index]);
}
