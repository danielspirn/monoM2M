#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const cwd = process.cwd();
const receiptRoot = path.join(cwd, 'receipt_images');
const outputDir = path.join(cwd, 'test', 'fixtures', 'receipts', 'library');
const outputFile = path.join(outputDir, 'catalog.json');

const curatedScenarios = [
  {
    id: 'single_grocery_happy_path',
    file: 'receipt_images/IMG_7573.jpeg',
    label: 'Safeway grocery receipt',
    notes: 'Clear single grocery receipt with visible line items and totals.',
  },
  {
    id: 'restaurant_payment_slip',
    file: 'receipt_images/IMG_0030.jpeg',
    label: 'Restaurant card payment slip',
    notes: 'Non-itemized payment slip with merchant, date, and total but limited line-item detail.',
  },
  {
    id: 'service_invoice_nonstandard',
    file: 'receipt_images/IMG_20230404_210830_01.jpeg',
    label: 'Cleaning invoice',
    notes: 'Service invoice variant to validate non-retail receipt handling.',
  },
  {
    id: 'duplicate_receipt_pair',
    files: [
      'receipt_images/IMG_7373.jpeg',
      'receipt_images/IMG_7373 (1).jpeg',
    ],
    label: 'Exact duplicate pair',
    notes: 'Known duplicate files to validate dedupe surfacing.',
  },
];

function listReceiptFiles(root) {
  return readdirSync(root)
    .filter((name) => statSync(path.join(root, name)).isFile())
    .sort();
}

function md5ForFile(filePath) {
  return createHash('md5').update(readFileSync(filePath)).digest('hex');
}

function inferTags(fileName) {
  const lower = fileName.toLowerCase();
  const tags = [];

  if (/\(1\)/.test(fileName)) {
    tags.push('duplicate-name-copy');
  }
  if (/img_\d{4}\.jpeg/.test(lower)) {
    tags.push('mobile-photo');
  }
  if (/image\d+/.test(lower)) {
    tags.push('exported-image');
  }
  if (/invoice/.test(lower)) {
    tags.push('invoice');
  }

  return tags;
}

const files = listReceiptFiles(receiptRoot);
const entries = files.map((name) => {
  const relativePath = path.join('receipt_images', name);
  const absolutePath = path.join(receiptRoot, name);
  const stats = statSync(absolutePath);

  return {
    fileName: name,
    relativePath,
    sizeBytes: stats.size,
    md5: md5ForFile(absolutePath),
    tags: inferTags(name),
  };
});

const duplicateGroups = Object.values(
  entries.reduce((groups, entry) => {
    groups[entry.md5] ??= [];
    groups[entry.md5].push(entry.relativePath);
    return groups;
  }, {})
)
  .filter((group) => group.length > 1)
  .sort((left, right) => left[0].localeCompare(right[0]))
  .map((filesInGroup, index) => ({
    id: `dup_${index + 1}`,
    files: filesInGroup,
  }));

const duplicateIndex = new Map();
duplicateGroups.forEach((group) => {
  group.files.forEach((file) => duplicateIndex.set(file, group.id));
});

const enrichedEntries = entries.map((entry) => ({
  ...entry,
  duplicateGroupId: duplicateIndex.get(entry.relativePath) ?? null,
}));

mkdirSync(outputDir, { recursive: true });

writeFileSync(
  outputFile,
  JSON.stringify(
    {
      version: 1,
      generatedAt: new Date().toISOString(),
      sourceDirectory: 'receipt_images',
      fileCount: enrichedEntries.length,
      duplicateGroupCount: duplicateGroups.length,
      curatedScenarios,
      duplicateGroups,
      entries: enrichedEntries,
    },
    null,
    2
  )
);

console.log(`Indexed ${enrichedEntries.length} receipt images into ${path.relative(cwd, outputFile)}.`);
