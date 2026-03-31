#!/usr/bin/env node

function fail(message) {
  console.error(message);
  process.exit(1);
}

const rawUrl = process.argv[2];

if (!rawUrl) {
  fail('Usage: npm run figma:parse-url -- "<figma-url>"');
}

let parsedUrl;

try {
  parsedUrl = new URL(rawUrl);
} catch {
  fail('The provided value is not a valid URL.');
}

if (!parsedUrl.hostname.includes('figma.com')) {
  fail('Expected a figma.com URL.');
}

const segments = parsedUrl.pathname.split('/').filter(Boolean);
const designIndex = segments.findIndex((segment) => segment === 'design' || segment === 'board');

if (designIndex === -1 || segments.length <= designIndex + 1) {
  fail('Could not locate a Figma file key in the URL.');
}

const branchIndex = segments.findIndex((segment) => segment === 'branch');
const fileKey = branchIndex !== -1 && segments.length > branchIndex + 1 ? segments[branchIndex + 1] : segments[designIndex + 1];
const nodeId = parsedUrl.searchParams.get('node-id');

if (!nodeId) {
  fail('The URL is missing the node-id query parameter.');
}

const normalizedNodeId = nodeId.replace(/-/g, ':');

const payload = {
  figmaUrl: rawUrl,
  fileKey,
  nodeId: normalizedNodeId,
};

console.log(JSON.stringify(payload, null, 2));
