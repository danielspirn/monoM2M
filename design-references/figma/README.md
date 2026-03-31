# Figma MCP Design References

This directory is the repo-side connection point between Money to Memories and the Figma MCP tools.

Use it when you want Codex to inspect the real Figma design structure instead of relying only on exported PNGs or SVGs.

## Why this exists

Hero screens are helpful, but they flatten important design information:
- layer hierarchy
- spacing and grouping
- reusable components
- tokens and variables
- alternate states and variants

By storing stable Figma file keys and node IDs here, we can ask Codex to read the actual design nodes through MCP with tools like:
- `figma_get_design_context`
- `figma_get_metadata`
- `figma_get_screenshot`
- `figma_get_variable_defs`

## Workflow

1. Copy the Figma URL for the frame or component you want tied to a route.
2. Run `npm run figma:parse-url -- "<your-figma-url>"`.
3. Paste the returned `fileKey` and `nodeId` into `design-references/figma/route-node-registry.json`.
4. Keep one primary node per route state that we actively implement or review.
5. When asking Codex to compare UI against Figma, point it at the registry instead of pasting raw URLs.

## Registry rules

- Prefer route-aligned entries over generic "misc" frames.
- Keep user-facing routes together:
  - `/home`
  - `/things`
  - `/people`
  - `/memories`
  - `/settings`
  - `/account`
  - `/plans`
- Add shell references separately for:
  - bottom navigation
  - FAB sheet
  - drawer
  - top bar
- Use notes to describe the intended state, such as `populated`, `empty`, `premium`, or `detail`.
- Do not delete older references until they have been replaced by a newer canonical node.

## Using the registry with Codex

Once the registry is populated, requests like these become reliable:

- "Compare `/things` against the canonical Figma node."
- "Read the shell frame and update the FAB sheet to match it more closely."
- "Inspect variables for the `/memories` timeline frame."
- "Pull a screenshot and metadata for the `/people` overview node."

## Notes

- The MCP connection is authenticated per user, not per repo.
- This repo file is the missing shared memory so future work can target the right design nodes repeatedly.
- If a Figma URL uses a branch URL, the parser will return the branch key as the MCP `fileKey`.
