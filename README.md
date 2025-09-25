# Dryvestment Content Pack

This repository packages the Dryvestment brief generator’s reference material as a
self-contained data set. It lets us evolve copy, citations, and playlists in a
content-focused workflow before the app consumes a compiled bundle.

## Contents

- `content/bds_pack.json` – master JSON defining openers, guides, key points,
  counters, next steps, sources, and audience overrides. The structure matches
  the schema currently consumed by the Labs UI.
- `content/*.md` – long-form one pagers that surface as optional attachments in
  the brief builder (fiduciary playbook, JLENS rebuttals, etc.).

## Current JSON Shape (2025-09-25)

Top-level keys in `bds_pack.json`:

| Key                      | Type   | Purpose                                                      |
| ------------------------ | ------ | ------------------------------------------------------------ |
| `version`                | string | Content pack version tag                                     |
| `openers`                | object | Generic opening paragraphs                                   |
| `identity_openers`       | object | Identity + venue specific openers                            |
| `identity_guides`        | object | "Ask / implementation / reporting / risk" blocks per identity |
| `one_pagers`             | array  | Optional attachment descriptors (id, title, markdown)        |
| `key_points`             | array  | Default talking points                                       |
| `key_points_by_entity`   | object | Identity-specific talking point overrides                    |
| `screening_knowledge`    | object | Shared “screening is intelligence” copy                      |
| `venue_notes`            | object | Venue-specific reminders                                     |
| `counters`               | array  | Canonical claim/response/citation tuples                     |
| `counter_sets`           | object | Claim lists grouped by audience (`family_friends`, etc.)     |
| `model_resolution`       | string | Sample resolution language                                   |
| `next_steps`             | array  | General action checklist                                     |
| `next_steps_by_entity`   | object | Additional steps for individuals/family audiences            |
| `sources`                | array  | Shared bibliography                                          |
| `further_reading`        | array  | Optional extra links                                         |
| `policy_alignment`       | object | Messaging fragments for alignment section                    |
| `government_policy_snippet` | string | Issuer-specific policy note                               |
| `cio_note` / `cio_links` | string/array | CIO framing and supporting references                   |

Counter and source sets refer back to the canonical lists by grouping claim IDs
or source entries for each audience type.

## Validation & Roadmap

- No automated validation is bundled yet. Consumers should continue using the
  existing Labs tooling until we introduce JSON Schema and playlists.
- Planned refactor (tracked separately) will normalize nodes, playlists, and
  provenance metadata as discussed in the Dryvestment planning docs.

## Usage

1. Clone the repository (or install via the distribution method we publish).
2. Import `content/bds_pack.json` into the brief generator build step.
3. Attach one-pager markdown files when you need optional attachments.

> ⚠️ Educational use only. All narratives reflect Ethical Capital Labs research
> and do not constitute investment advice.
