import { z } from 'zod';

export const TargetsSchema = z
  .object({
    identity: z.array(z.string()).min(1).optional(),
    audience: z.array(z.string()).min(1).optional(),
    venue: z.array(z.string()).min(1).optional(),
    level: z.array(z.string()).min(1).optional(),
    motivation: z.array(z.string()).min(1).optional(),
  })
  .strict();

export type Targets = z.infer<typeof TargetsSchema>;

const BaseNodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  targets: TargetsSchema.optional(),
  tags: z.array(z.string()).optional(),
  provenance: z.any().optional(),
});

export const OpenerNodeSchema = BaseNodeSchema.extend({
  type: z.literal('opener'),
  text: z.string(),
});

export const GuideNodeSchema = BaseNodeSchema.extend({
  type: z.literal('guide'),
  sections: z.object({
    ask: z.string(),
    implementation: z.string(),
    reporting: z.string(),
    risk: z.string(),
  }),
});

export const OnePagerNodeSchema = BaseNodeSchema.extend({
  type: z.literal('one_pager'),
  title: z.string(),
  description: z.string(),
  markdownPath: z.string(),
  defaultSelected: z.boolean().optional(),
});

export const KeyPointNodeSchema = BaseNodeSchema.extend({
  type: z.literal('key_point'),
  title: z.string(),
  body: z.string(),
  citations: z.array(z.string()).optional(),
  assertions: z.array(z.string()).optional(),
});

const PolicyVariantSchema = z.object({
  id: z.string(),
  body: z.string(),
  transforms: z
    .object({
      tone: z.string().optional(),
      length: z.string().optional(),
    })
    .optional(),
});

export const PolicyStatementNodeSchema = BaseNodeSchema.extend({
  type: z.literal('policy_statement'),
  title: z.string(),
  body: z.string().optional(),
  bullets: z.array(z.string()).optional(),
  citations: z.array(z.string()).optional(),
  variants: z.array(PolicyVariantSchema).optional(),
});

export const TemplateSnippetNodeSchema = BaseNodeSchema.extend({
  type: z.literal('template_snippet'),
  title: z.string(),
  markdown: z.string().optional(),
  lines: z.array(z.string()).optional(),
});

export const CounterNodeSchema = BaseNodeSchema.extend({
  type: z.literal('counter'),
  claim: z.string(),
  response: z.string(),
  citations: z.array(z.string()).optional(),
});

export const NextStepNodeSchema = BaseNodeSchema.extend({
  type: z.literal('next_step'),
  text: z.string(),
});

export const SourceNodeSchema = BaseNodeSchema.extend({
  type: z.literal('source'),
  label: z.string(),
  url: z.string(),
  citationText: z.string().optional(),
});

export const NodeSchema = z.discriminatedUnion('type', [
  OpenerNodeSchema,
  GuideNodeSchema,
  OnePagerNodeSchema,
  KeyPointNodeSchema,
  PolicyStatementNodeSchema,
  TemplateSnippetNodeSchema,
  CounterNodeSchema,
  NextStepNodeSchema,
  SourceNodeSchema,
]);

export type Node = z.infer<typeof NodeSchema>;

export const NodesDocumentSchema = z.object({
  version: z.string(),
  nodes: z.array(NodeSchema),
});

export type NodesDocument = z.infer<typeof NodesDocumentSchema>;

export const PlaylistItemSchema = z.object({
  ref: z.string(),
  overrides: z.unknown().optional(),
  conditions: TargetsSchema.optional(),
});

export const PlaylistSchema = z.object({
  id: z.string(),
  kind: z.string(),
  title: z.string(),
  items: z.array(PlaylistItemSchema),
  targets: TargetsSchema.optional(),
});

export type Playlist = z.infer<typeof PlaylistSchema>;

export const PlaylistsDocumentSchema = z.object({
  version: z.string(),
  playlists: z.array(PlaylistSchema),
});

export type PlaylistsDocument = z.infer<typeof PlaylistsDocumentSchema>;

export const ManifestSchema = z.object({
  version: z.string(),
  schema: z.string(),
  nodes: z.string(),
  playlists: z.string(),
  sources: z.string().optional(),
  assertions: z.string().optional(),
  entities: z.string().optional(),
  source: z.string().optional(),
  fallbackVersion: z.string().optional(),
});

export type Manifest = z.infer<typeof ManifestSchema>;

export const SchemaDocumentSchema = z.object({
  version: z.string(),
  createdAt: z.string(),
  taxonomies: z
  .object({
    identity: z.array(z.string()).optional(),
    audience: z.array(z.string()).optional(),
    venue: z.array(z.string()).optional(),
    level: z.array(z.string()).optional(),
    motivation: z.array(z.string()).optional(),
  })
  .optional(),
});

export type SchemaDocument = z.infer<typeof SchemaDocumentSchema>;

export const SourceRecordSchema = z
  .object({
    id: z.string(),
    label: z.string(),
    url: z.string().url(),
    citationText: z.string().optional(),
    tags: z.array(z.string()).optional(),
  })
  .strict();

export type SourceRecord = z.infer<typeof SourceRecordSchema>;

export const SourcesDocumentSchema = z.object({
  version: z.string(),
  sources: z.array(SourceRecordSchema),
});

export type SourcesDocument = z.infer<typeof SourcesDocumentSchema>;

export const AssertionRecordSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    statement: z.string(),
    evidence: z.array(z.string()).min(1),
    supports: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    confidence: z.enum(['low', 'medium', 'high']).optional(),
    author: z.string().optional(),
    reviewer: z.string().optional(),
    lastReviewed: z.string().optional(),
    notes: z.string().optional(),
  })
  .strict();

export type AssertionRecord = z.infer<typeof AssertionRecordSchema>;

export const AssertionsDocumentSchema = z.object({
  version: z.string(),
  assertions: z.array(AssertionRecordSchema),
});

export type AssertionsDocument = z.infer<typeof AssertionsDocumentSchema>;

export const EntityProfileSchema = z
  .object({
    id: z.string(),
    label: z.string(),
    shortDescription: z.string().optional(),
    timeHorizon: z.string().optional(),
    typicalWithdrawal: z.string().optional(),
    governanceStyle: z.string().optional(),
    keyConstraints: z.array(z.string()).optional(),
    stakeholders: z.array(z.string()).optional(),
    assertions: z.array(z.string()).optional(),
    sources: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
  })
  .strict();

export type EntityProfile = z.infer<typeof EntityProfileSchema>;

export const EntitiesDocumentSchema = z.object({
  version: z.string(),
  entities: z.array(EntityProfileSchema),
});

export type EntitiesDocument = z.infer<typeof EntitiesDocumentSchema>;

export interface Dataset {
  version: string;
  manifest: Manifest;
  schema: SchemaDocument;
  nodes: Node[];
  playlists: Playlist[];
  sources: SourceRecord[];
  assertions: AssertionRecord[];
  entities: EntityProfile[];
  nodeIndex: Record<string, Node>;
  sourceIndex: Record<string, SourceRecord>;
  assertionIndex: Record<string, AssertionRecord>;
  entityIndex: Record<string, EntityProfile>;
  playlistById: Record<string, Playlist>;
  playlistsByKind: Record<string, Playlist[]>;
}

export const BriefContextSchema = z
  .object({
    identity: z.string().optional(),
    audience: z.string().optional(),
    venue: z.string().optional(),
    level: z.string().optional(),
    motivation: z.string().optional(),
  })
  .strict();

export type BriefContext = z.infer<typeof BriefContextSchema>;
