import { z } from 'zod';

// Base schemas from existing system
export const TargetsSchema = z
  .object({
    identity: z.array(z.string()).min(1).optional(),
    audience: z.array(z.string()).min(1).optional(),
    venue: z.array(z.string()).min(1).optional(),
    level: z.array(z.string()).min(1).optional(),
  })
  .strict();

export type Targets = z.infer<typeof TargetsSchema>;

// Enhanced base node with narrative support
const BaseNodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  targets: TargetsSchema.optional(),
  tags: z.array(z.string()).optional(),
  provenance: z.any().optional(),
  // New fields for narrative integration
  narrative: z.object({
    intro: z.string().optional(),
    context: z.string().optional(),
    transitions: z.record(z.string()).optional(), // Links between structured elements
  }).optional(),
  references: z.array(z.string()).optional(), // Links to encyclopedia entries
  interactiveElements: z.object({
    expandable: z.boolean().optional(),
    tooltip: z.string().optional(),
    sidebarContent: z.string().optional(),
  }).optional(),
});

// NEW: Encyclopedia Entry Node for dictionary-style content
export const EncyclopediaEntrySchema = BaseNodeSchema.extend({
  type: z.literal('encyclopedia_entry'),
  term: z.string(),
  shortDefinition: z.string(),
  category: z.enum([
    'investment_strategy',
    'risk_management',
    'portfolio_construction',
    'ethical_screening',
    'market_mechanics',
    'regulations',
    'financial_instruments'
  ]),
  difficultyLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  detailedExplanation: z.string(),
  // Support for rich narrative content
  examples: z.array(z.string()).optional(),
  relatedTerms: z.array(z.string()).optional(),
  practicalApplications: z.string().optional(),
  commonMisconceptions: z.string().optional(),
  // Etymology or background
  etymology: z.string().optional(),
  historicalContext: z.string().optional(),
});

// Enhanced Key Point with narrative integration
export const EnhancedKeyPointSchema = BaseNodeSchema.extend({
  type: z.literal('key_point'),
  title: z.string(),
  body: z.string(),
  // NEW: Structured narrative elements
  narrativeIntro: z.string().optional(), // "Here's why this matters..."
  narrativeConclusion: z.string().optional(), // "This means that..."
  storytellingElements: z.object({
    anecdote: z.string().optional(),
    analogy: z.string().optional(),
    realWorldExample: z.string().optional(),
  }).optional(),
  citations: z.array(z.string()).optional(),
  // Links to encyclopedia for context
  keyTerms: z.array(z.string()).optional(), // Terms that should link to encyclopedia
});

// Enhanced Counter Arguments with narrative flow
export const EnhancedCounterSchema = BaseNodeSchema.extend({
  type: z.literal('counter'),
  claim: z.string(),
  response: z.string(),
  // NEW: Narrative bridge content
  acknowledgment: z.string().optional(), // "This is a fair concern because..."
  transitionToResponse: z.string().optional(), // "However, the evidence shows..."
  rhetoricalStrategy: z.enum(['empathy', 'logic', 'evidence', 'reframe']).optional(),
  citations: z.array(z.string()).optional(),
});

// NEW: Narrative Article Node for long-form content with embedded structure
export const NarrativeArticleSchema = BaseNodeSchema.extend({
  type: z.literal('narrative_article'),
  title: z.string(),
  subtitle: z.string().optional(),
  author: z.string().optional(),
  publishedDate: z.string().optional(),
  // Full narrative content
  fullText: z.string(),
  // Embedded structured elements
  embeddedElements: z.array(z.object({
    position: z.number(), // Character position in fullText where this element appears
    type: z.enum(['key_point', 'counter', 'definition', 'example', 'citation']),
    elementId: z.string(), // ID of the structured element
    displayMode: z.enum(['inline', 'sidebar', 'tooltip', 'expandable']).optional(),
  })).optional(),
  // Article metadata
  readingTime: z.number().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  category: z.string().optional(),
});

// NEW: Interactive Definition Node for inline contextual help
export const InlineDefinitionSchema = BaseNodeSchema.extend({
  type: z.literal('inline_definition'),
  term: z.string(),
  contextualDefinition: z.string(), // Definition tailored to this specific context
  encyclopediaRef: z.string().optional(), // Link to full encyclopedia entry
  displayStyle: z.enum(['tooltip', 'popover', 'sidebar']).optional(),
});

// Enhanced Source with narrative context
export const EnhancedSourceSchema = BaseNodeSchema.extend({
  type: z.literal('source'),
  label: z.string(),
  url: z.string(),
  citationText: z.string().optional(),
  // NEW: Narrative context
  relevanceContext: z.string().optional(), // Why this source matters in this context
  credibilityNote: z.string().optional(), // Info about source credibility
  sourceType: z.enum(['academic', 'news', 'regulatory', 'industry', 'primary']).optional(),
  publicationDate: z.string().optional(),
  // Integration helpers
  quotePullouts: z.array(z.string()).optional(), // Key quotes to highlight
});

// Existing schemas (maintained for compatibility)
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

export const PolicyStatementNodeSchema = BaseNodeSchema.extend({
  type: z.literal('policy_statement'),
  title: z.string(),
  body: z.string().optional(),
  bullets: z.array(z.string()).optional(),
  citations: z.array(z.string()).optional(),
  variants: z.array(z.object({
    id: z.string(),
    body: z.string(),
    transforms: z.object({
      tone: z.string().optional(),
      length: z.string().optional(),
    }).optional(),
  })).optional(),
});

export const TemplateSnippetNodeSchema = BaseNodeSchema.extend({
  type: z.literal('template_snippet'),
  title: z.string(),
  markdown: z.string().optional(),
  lines: z.array(z.string()).optional(),
});

export const NextStepNodeSchema = BaseNodeSchema.extend({
  type: z.literal('next_step'),
  text: z.string(),
});

// Enhanced discriminated union with new node types
export const EnhancedNodeSchema = z.discriminatedUnion('type', [
  // New enhanced nodes
  EncyclopediaEntrySchema,
  EnhancedKeyPointSchema,
  EnhancedCounterSchema,
  NarrativeArticleSchema,
  InlineDefinitionSchema,
  EnhancedSourceSchema,
  // Existing nodes (maintained for compatibility)
  OpenerNodeSchema,
  GuideNodeSchema,
  OnePagerNodeSchema,
  PolicyStatementNodeSchema,
  TemplateSnippetNodeSchema,
  NextStepNodeSchema,
]);

export type EnhancedNode = z.infer<typeof EnhancedNodeSchema>;

// Enhanced playlist with narrative sequencing
export const EnhancedPlaylistSchema = z.object({
  id: z.string(),
  kind: z.string(),
  title: z.string(),
  description: z.string().optional(),
  narrativeFlow: z.object({
    introduction: z.string().optional(),
    transitionLogic: z.string().optional(), // How items flow together
    conclusion: z.string().optional(),
  }).optional(),
  items: z.array(z.object({
    ref: z.string(),
    overrides: z.unknown().optional(),
    conditions: TargetsSchema.optional(),
    narrativeContext: z.string().optional(), // How this item fits the story
  })),
  targets: TargetsSchema.optional(),
  // New: Content presentation options
  presentationMode: z.enum(['structured', 'narrative', 'hybrid']).optional(),
  interactivityLevel: z.enum(['static', 'expandable', 'fully_interactive']).optional(),
});

// Enhanced dataset structure
export interface EnhancedDataset {
  version: string;
  manifest: Manifest;
  schema: SchemaDocument;
  nodes: EnhancedNode[];
  playlists: EnhancedPlaylist[];
  nodeIndex: Record<string, EnhancedNode>;
  playlistById: Record<string, EnhancedPlaylist>;
  playlistsByKind: Record<string, EnhancedPlaylist[]>;
  // NEW: Enhanced indexes for better performance
  encyclopediaIndex: Record<string, EnhancedNode>; // Quick term lookup
  categoryIndex: Record<string, EnhancedNode[]>; // Nodes by category
  narrativeIndex: Record<string, EnhancedNode>; // Articles with narrative content
  crossReferences: Record<string, string[]>; // Term -> related content
}

// Enhanced schema document with new taxonomies
export const EnhancedSchemaDocumentSchema = z.object({
  version: z.string(),
  createdAt: z.string(),
  taxonomies: z.object({
    identity: z.array(z.string()).optional(),
    audience: z.array(z.string()).optional(),
    venue: z.array(z.string()).optional(),
    level: z.array(z.string()).optional(),
    // NEW: Content taxonomies
    categories: z.array(z.string()).optional(),
    contentTypes: z.array(z.string()).optional(),
    difficultyLevels: z.array(z.string()).optional(),
  }).optional(),
  // NEW: Content integration settings
  integrationSettings: z.object({
    autoLinkTerms: z.boolean().optional(),
    defaultDefinitionDisplay: z.enum(['tooltip', 'popover', 'sidebar']).optional(),
    narrativePriority: z.enum(['structure', 'story', 'balanced']).optional(),
  }).optional(),
});

// Manifest schema (maintained for compatibility)
export const ManifestSchema = z.object({
  version: z.string(),
  schema: z.string(),
  nodes: z.string(),
  playlists: z.string(),
  source: z.string().optional(),
  fallbackVersion: z.string().optional(),
});

export type Manifest = z.infer<typeof ManifestSchema>;
export type EnhancedSchemaDocument = z.infer<typeof EnhancedSchemaDocumentSchema>;
export type EnhancedPlaylist = z.infer<typeof EnhancedPlaylistSchema>;

// Brief context (maintained for compatibility)
export const BriefContextSchema = z
  .object({
    identity: z.string().optional(),
    audience: z.string().optional(),
    venue: z.string().optional(),
    level: z.string().optional(),
  })
  .strict();

export type BriefContext = z.infer<typeof BriefContextSchema>;

// Utility types for schema migration
export type LegacyNode = {
  id: string;
  type: string;
  [key: string]: any;
};

// Helper function to migrate legacy nodes to enhanced schema
export function migrateLegacyNode(legacyNode: LegacyNode): EnhancedNode {
  // Implementation would handle conversion from old format to new
  // This ensures backward compatibility during transition
  return legacyNode as EnhancedNode;
}

// Content integration utilities
export interface ContentIntegrationConfig {
  mode: 'structured' | 'narrative' | 'hybrid';
  autoLinkTerms: boolean;
  definitionDisplay: 'tooltip' | 'popover' | 'sidebar';
  narrativeFlow: boolean;
  interactiveElements: boolean;
}