import type { Node } from './schema';
import type { EnhancedNode, EnhancedDataset } from './enhanced-schema';

/**
 * Schema Migration Utilities
 *
 * Handles the transition from the current Dryvest schema to the enhanced
 * schema that supports both narrative and structured content, plus
 * encyclopedia integration.
 */

export interface MigrationPlan {
  phase: 'preparation' | 'encyclopedia_integration' | 'narrative_enhancement' | 'full_integration';
  description: string;
  steps: MigrationStep[];
  estimatedEffort: 'low' | 'medium' | 'high';
  backwardCompatible: boolean;
}

export interface MigrationStep {
  id: string;
  title: string;
  description: string;
  type: 'content_creation' | 'schema_update' | 'ui_enhancement' | 'data_migration';
  priority: 'high' | 'medium' | 'low';
  dependencies: string[];
  automation: 'full' | 'partial' | 'manual';
}

export interface EncyclopediaEntry {
  term: string;
  shortDefinition: string;
  category: string;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  detailedExplanation: string;
  examples?: string[];
  relatedTerms?: string[];
  practicalApplications?: string;
}

/**
 * Phase 1: Encyclopedia Integration (350+ entries)
 * Add dictionary-style entries while maintaining current functionality
 */
export function createEncyclopediaIntegrationPlan(): MigrationPlan {
  return {
    phase: 'encyclopedia_integration',
    description: 'Add 350+ encyclopedia entries with seamless integration into existing content',
    estimatedEffort: 'medium',
    backwardCompatible: true,
    steps: [
      {
        id: 'schema_extension',
        title: 'Extend Schema for Encyclopedia Entries',
        description: 'Add EncyclopediaEntrySchema to existing NodeSchema discriminated union',
        type: 'schema_update',
        priority: 'high',
        dependencies: [],
        automation: 'manual'
      },
      {
        id: 'content_import',
        title: 'Import Encyclopedia Content',
        description: 'Convert ethicic.com encyclopedia entries to new schema format',
        type: 'content_creation',
        priority: 'high',
        dependencies: ['schema_extension'],
        automation: 'partial'
      },
      {
        id: 'indexing_system',
        title: 'Create Encyclopedia Index',
        description: 'Build fast lookup system for terms and categories',
        type: 'data_migration',
        priority: 'medium',
        dependencies: ['content_import'],
        automation: 'full'
      },
      {
        id: 'basic_ui_integration',
        title: 'Basic UI Integration',
        description: 'Add tooltip/popover system for encyclopedia terms',
        type: 'ui_enhancement',
        priority: 'medium',
        dependencies: ['indexing_system'],
        automation: 'manual'
      },
      {
        id: 'auto_linking',
        title: 'Implement Auto-Linking',
        description: 'Automatically detect and link encyclopedia terms in existing content',
        type: 'ui_enhancement',
        priority: 'low',
        dependencies: ['basic_ui_integration'],
        automation: 'partial'
      }
    ]
  };
}

/**
 * Data Conversion Utilities
 */

export function convertLegacyToEnhanced(legacyNodes: Node[]): EnhancedNode[] {
  return legacyNodes.map(node => {
    // Preserve all existing fields and add optional enhanced fields
    const enhancedNode: EnhancedNode = {
      ...node,
      // Add empty narrative structure for future enhancement
      narrative: undefined,
      references: undefined,
      interactiveElements: undefined
    } as EnhancedNode;

    return enhancedNode;
  });
}

export function convertEncyclopediaEntry(entry: EncyclopediaEntry): EnhancedNode {
  const categoryMap: Record<string, string> = {
    'Investment Strategy': 'investment_strategy',
    'Risk Management': 'risk_management',
    'Portfolio Construction': 'portfolio_construction',
    'Ethical Screening': 'ethical_screening',
    'Market Mechanics': 'market_mechanics',
    'Regulations': 'regulations',
    'Financial Instruments': 'financial_instruments'
  };

  return {
    id: `encyclopedia_${entry.term.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
    type: 'encyclopedia_entry',
    term: entry.term,
    shortDefinition: entry.shortDefinition,
    category: categoryMap[entry.category] || 'investment_strategy',
    difficultyLevel: entry.difficultyLevel,
    detailedExplanation: entry.detailedExplanation,
    examples: entry.examples,
    relatedTerms: entry.relatedTerms,
    practicalApplications: entry.practicalApplications,
    // Optional enhanced fields
    targets: undefined,
    tags: [entry.category.toLowerCase().replace(' ', '_'), entry.difficultyLevel],
    provenance: {
      source: 'ethicic_encyclopedia',
      importedAt: new Date().toISOString()
    }
  } as EnhancedNode;
}

/**
 * Content Enhancement Utilities
 */

export function enhanceKeyPointWithNarrative(
  keyPoint: Extract<Node, { type: 'key_point' }>,
  narrativeEnhancements?: {
    intro?: string;
    context?: string;
    storytelling?: {
      anecdote?: string;
      analogy?: string;
      realWorldExample?: string;
    };
  }
): EnhancedNode {
  return {
    ...keyPoint,
    type: 'key_point',
    // Add narrative enhancements while preserving original structure
    narrativeIntro: narrativeEnhancements?.intro,
    narrative: {
      intro: narrativeEnhancements?.intro,
      context: narrativeEnhancements?.context,
    },
    storytellingElements: narrativeEnhancements?.storytelling,
    // Extract potential encyclopedia terms from title and body
    keyTerms: extractPotentialEncyclopediaTerms(`${keyPoint.title} ${keyPoint.body}`),
  } as EnhancedNode;
}

export function createNarrativeArticle(
  title: string,
  content: string,
  keyPoints: string[],
  metadata?: {
    author?: string;
    category?: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
  }
): EnhancedNode {
  return {
    id: `narrative_${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
    type: 'narrative_article',
    title,
    subtitle: undefined,
    author: metadata?.author,
    publishedDate: new Date().toISOString().split('T')[0],
    fullText: content,
    embeddedElements: keyPoints.map((pointId, index) => ({
      position: findInsertionPosition(content, index),
      type: 'key_point' as const,
      elementId: pointId,
      displayMode: 'expandable' as const
    })),
    readingTime: estimateReadingTime(content),
    difficulty: metadata?.difficulty,
    category: metadata?.category,
    // Extract encyclopedia terms from the full text
    references: extractPotentialEncyclopediaTerms(content),
    tags: metadata ? [metadata.category, metadata.difficulty].filter(Boolean) as string[] : undefined
  } as EnhancedNode;
}

/**
 * Migration Validation
 */

export function validateMigration(
  original: Node[],
  enhanced: EnhancedNode[]
): MigrationValidationResult {
  const result: MigrationValidationResult = {
    success: true,
    errors: [],
    warnings: [],
    stats: {
      originalNodeCount: original.length,
      enhancedNodeCount: enhanced.length,
      newNodeTypes: [],
      preservedNodes: 0,
      enhancedNodes: 0
    }
  };

  // Check that all original nodes are preserved
  const originalIds = new Set(original.map(n => n.id));
  const enhancedIds = new Set(enhanced.map(n => n.id));

  for (const id of originalIds) {
    if (!enhancedIds.has(id)) {
      result.errors.push(`Missing node after migration: ${id}`);
      result.success = false;
    }
  }

  // Count node types
  const nodeTypes = new Set(enhanced.map(n => n.type));
  const originalTypes = new Set(original.map(n => n.type));

  result.stats.newNodeTypes = Array.from(nodeTypes).filter(type => !originalTypes.has(type));
  result.stats.preservedNodes = enhanced.filter(n => originalIds.has(n.id)).length;
  result.stats.enhancedNodes = enhanced.filter(n => !originalIds.has(n.id)).length;

  // Validate schema compliance
  enhanced.forEach(node => {
    try {
      // This would use the actual Zod schema validation
      // EnhancedNodeSchema.parse(node);
    } catch (error) {
      result.errors.push(`Schema validation failed for node ${node.id}: ${error}`);
      result.success = false;
    }
  });

  return result;
}

/**
 * Encyclopedia Content Preparation
 */

export function prepareEncyclopediaImport(
  rawEntries: any[]
): { ready: EncyclopediaEntry[], needsReview: any[] } {
  const ready: EncyclopediaEntry[] = [];
  const needsReview: any[] = [];

  rawEntries.forEach(entry => {
    // Validate required fields
    if (!entry.term || !entry.shortDefinition) {
      needsReview.push({ ...entry, reason: 'Missing required fields' });
      return;
    }

    // Check for placeholder content
    if (entry.shortDefinition === 'TK' || entry.detailedExplanation === 'TK') {
      needsReview.push({ ...entry, reason: 'Contains TK placeholders' });
      return;
    }

    // Normalize and validate
    const normalized: EncyclopediaEntry = {
      term: entry.term.trim(),
      shortDefinition: entry.shortDefinition.trim(),
      category: entry.category || 'Investment Strategy',
      difficultyLevel: entry.difficultyLevel || 'beginner',
      detailedExplanation: entry.detailedExplanation || entry.shortDefinition,
      examples: entry.examples?.filter(Boolean) || undefined,
      relatedTerms: entry.relatedTerms?.filter(Boolean) || undefined,
      practicalApplications: entry.practicalApplications?.trim() || undefined
    };

    ready.push(normalized);
  });

  return { ready, needsReview };
}

/**
 * Progressive Migration Strategy
 */

export function createProgressiveMigrationPlan(): MigrationPlan[] {
  return [
    createEncyclopediaIntegrationPlan(),
    {
      phase: 'narrative_enhancement',
      description: 'Add narrative elements to existing structured content',
      estimatedEffort: 'high',
      backwardCompatible: true,
      steps: [
        {
          id: 'identify_enhancement_candidates',
          title: 'Identify Content for Enhancement',
          description: 'Analyze existing key points and counters for narrative potential',
          type: 'content_creation',
          priority: 'high',
          dependencies: [],
          automation: 'partial'
        },
        {
          id: 'create_narrative_templates',
          title: 'Create Narrative Templates',
          description: 'Develop templates for intro/context/transitions',
          type: 'content_creation',
          priority: 'medium',
          dependencies: ['identify_enhancement_candidates'],
          automation: 'manual'
        },
        {
          id: 'enhance_content_iteratively',
          title: 'Enhance Content Iteratively',
          description: 'Add narrative elements to high-priority content first',
          type: 'content_creation',
          priority: 'medium',
          dependencies: ['create_narrative_templates'],
          automation: 'manual'
        }
      ]
    },
    {
      phase: 'full_integration',
      description: 'Complete integration with advanced UI features',
      estimatedEffort: 'high',
      backwardCompatible: true,
      steps: [
        {
          id: 'advanced_ui_features',
          title: 'Implement Advanced UI Features',
          description: 'Side-by-side view, progressive disclosure, narrative flow',
          type: 'ui_enhancement',
          priority: 'medium',
          dependencies: [],
          automation: 'manual'
        },
        {
          id: 'content_analytics',
          title: 'Add Content Analytics',
          description: 'Track engagement with narrative vs structured content',
          type: 'ui_enhancement',
          priority: 'low',
          dependencies: ['advanced_ui_features'],
          automation: 'full'
        }
      ]
    }
  ];
}

/**
 * Helper Functions
 */

function extractPotentialEncyclopediaTerms(text: string): string[] {
  // Simple heuristic to identify terms that might need encyclopedia entries
  const financialTerms = [
    'ESG', 'Active Share', 'Alpha', 'Beta', 'Sharpe Ratio', 'Volatility',
    'Asset Management', 'Portfolio Construction', 'Risk Management',
    'Benchmark', 'Tracking Error', 'Factor Investing', 'Diversification',
    'Fiduciary', 'Due Diligence', 'Screening', 'Exclusion', 'Impact Investing'
  ];

  return financialTerms.filter(term =>
    text.toLowerCase().includes(term.toLowerCase())
  );
}

function findInsertionPosition(text: string, index: number): number {
  // Find logical positions to insert structured elements in narrative text
  const paragraphs = text.split('\n\n');
  const targetParagraph = Math.min(index + 1, paragraphs.length - 1);

  let position = 0;
  for (let i = 0; i < targetParagraph; i++) {
    position += paragraphs[i].length + 2; // +2 for \n\n
  }

  return position;
}

function estimateReadingTime(text: string): number {
  const wordsPerMinute = 200;
  const wordCount = text.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

/**
 * Type Definitions
 */

export interface MigrationValidationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    originalNodeCount: number;
    enhancedNodeCount: number;
    newNodeTypes: string[];
    preservedNodes: number;
    enhancedNodes: number;
  };
}

export interface ProgressiveMigrationConfig {
  startPhase: 'encyclopedia_integration' | 'narrative_enhancement' | 'full_integration';
  autoLinkTerms: boolean;
  preserveOriginalContent: boolean;
  batchSize: number;
  dryRun: boolean;
}