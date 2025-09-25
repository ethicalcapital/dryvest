import { z } from 'zod';

export const TargetsSchema = z
  .object({
    identity: z.array(z.string()).min(1).optional(),
    audience: z.array(z.string()).min(1).optional(),
    venue: z.array(z.string()).min(1).optional(),
    level: z.array(z.string()).min(1).optional(),
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
    })
    .optional(),
});

export type SchemaDocument = z.infer<typeof SchemaDocumentSchema>;

export interface Dataset {
  version: string;
  manifest: Manifest;
  schema: SchemaDocument;
  nodes: Node[];
  playlists: Playlist[];
  nodeIndex: Record<string, Node>;
  playlistById: Record<string, Playlist>;
  playlistsByKind: Record<string, Playlist[]>;
}

export const BriefContextSchema = z
  .object({
    identity: z.string().optional(),
    audience: z.string().optional(),
    venue: z.string().optional(),
    level: z.string().optional(),
  })
  .strict();

export type BriefContext = z.infer<typeof BriefContextSchema>;
