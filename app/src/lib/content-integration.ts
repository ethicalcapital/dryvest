import type { EnhancedNode, EnhancedDataset, ContentIntegrationConfig } from './enhanced-schema';

/**
 * Content Integration Engine
 *
 * This module handles the integration of narrative and structured schemas,
 * providing utilities for content that has both "soul" (narrative flow)
 * and structure (organized data).
 */

export interface NarrativeIntegration {
  mode: 'annotated_narrative' | 'side_by_side' | 'progressive_disclosure' | 'unified_model';
  preserveTransitions: boolean;
  encyclopediaLinking: 'inline' | 'tooltip' | 'sidebar' | 'none';
  structuralDepth: 'minimal' | 'moderate' | 'comprehensive';
}

export interface ContentPresentation {
  primaryView: 'narrative' | 'structured';
  alternativeViews: string[];
  interactiveFeatures: string[];
  encyclopediaIntegration: boolean;
}

/**
 * Core content integration functions
 */

/**
 * Annotated Narrative Approach
 * Embeds structured elements within narrative text while preserving flow
 */
export function createAnnotatedNarrative(
  narrativeText: string,
  structuredElements: EnhancedNode[],
  config: ContentIntegrationConfig
): AnnotatedContent {
  const annotations: ContentAnnotation[] = [];
  let processedText = narrativeText;

  // Find encyclopedia terms and auto-link them
  if (config.autoLinkTerms) {
    structuredElements
      .filter(node => node.type === 'encyclopedia_entry')
      .forEach(entry => {
        if (entry.type === 'encyclopedia_entry') {
          const term = entry.term;
          const regex = new RegExp(`\\b${term}\\b`, 'gi');

          processedText = processedText.replace(regex, (match, offset) => {
            annotations.push({
              position: offset,
              length: match.length,
              type: 'encyclopedia_link',
              elementId: entry.id,
              displayMode: config.definitionDisplay
            });
            return `<span data-term="${entry.id}" class="encyclopedia-term">${match}</span>`;
          });
        }
      });
  }

  // Embed structured elements at logical points
  structuredElements
    .filter(node => node.type === 'key_point' || node.type === 'counter')
    .forEach(element => {
      // Find natural insertion points (after paragraphs, before conclusions, etc.)
      const insertionPoints = findNaturalInsertionPoints(processedText, element);

      insertionPoints.forEach(point => {
        annotations.push({
          position: point,
          length: 0,
          type: 'embedded_element',
          elementId: element.id,
          displayMode: config.mode === 'hybrid' ? 'expandable' : 'inline'
        });
      });
    });

  return {
    text: processedText,
    annotations,
    structuredElements,
    metadata: {
      readingTime: estimateReadingTime(processedText),
      interactivityLevel: annotations.filter(a => a.displayMode === 'expandable').length > 0 ? 'interactive' : 'static'
    }
  };
}

/**
 * Side-by-Side Integration
 * Presents narrative and structured content in complementary views
 */
export function createSideBySideIntegration(
  narrative: EnhancedNode,
  structuredElements: EnhancedNode[]
): SideBySideContent {
  // Generate structured outline from narrative
  const outline = generateOutline(narrative, structuredElements);

  // Create cross-references between narrative sections and structured elements
  const crossReferences = createCrossReferences(narrative, structuredElements);

  return {
    narrative: {
      content: narrative,
      anchors: outline.map(item => ({
        id: item.id,
        text: item.title,
        position: item.position
      }))
    },
    structured: {
      outline,
      elements: structuredElements,
      crossReferences
    },
    interactions: {
      scrollSync: true,
      clickNavigation: true,
      highlightCorrespondence: true
    }
  };
}

/**
 * Progressive Disclosure Integration
 * Starts with narrative, allows users to reveal structured details on demand
 */
export function createProgressiveDisclosure(
  content: EnhancedNode[],
  encyclopediaEntries: EnhancedNode[]
): ProgressiveContent {
  const layers: ContentLayer[] = [];

  // Layer 1: High-level narrative
  const narrativeLayer = content.filter(node =>
    node.type === 'narrative_article' ||
    (node.type === 'key_point' && node.narrative?.intro)
  );

  layers.push({
    level: 'narrative',
    title: 'The Story',
    content: narrativeLayer,
    expandable: true,
    nextLayer: 'structured'
  });

  // Layer 2: Structured arguments
  const structuredLayer = content.filter(node =>
    node.type === 'key_point' || node.type === 'counter'
  );

  layers.push({
    level: 'structured',
    title: 'Key Arguments',
    content: structuredLayer,
    expandable: true,
    nextLayer: 'evidence'
  });

  // Layer 3: Evidence and sources
  const evidenceLayer = content.filter(node =>
    node.type === 'source' || node.references
  );

  layers.push({
    level: 'evidence',
    title: 'Evidence & Sources',
    content: evidenceLayer,
    expandable: true,
    nextLayer: 'definitions'
  });

  // Layer 4: Definitions and context
  layers.push({
    level: 'definitions',
    title: 'Definitions & Context',
    content: encyclopediaEntries,
    expandable: false,
    nextLayer: null
  });

  return {
    layers,
    defaultVisible: ['narrative'],
    expandBehavior: 'accordion',
    contextualHelp: true
  };
}

/**
 * Encyclopedia Integration Utilities
 */
export function integrateEncyclopediaEntries(
  content: string,
  encyclopediaIndex: Record<string, EnhancedNode>,
  integrationMode: 'inline' | 'tooltip' | 'sidebar'
): string {
  let integratedContent = content;
  const terms = Object.keys(encyclopediaIndex);

  // Sort terms by length (longest first) to avoid partial matches
  terms.sort((a, b) => b.length - a.length);

  terms.forEach(term => {
    const entry = encyclopediaIndex[term];
    if (entry.type === 'encyclopedia_entry') {
      const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedTerm}\\b`, 'gi');

      switch (integrationMode) {
        case 'inline':
          integratedContent = integratedContent.replace(
            regex,
            `<span class="encyclopedia-inline">${term} <small>(${entry.shortDefinition})</small></span>`
          );
          break;

        case 'tooltip':
          integratedContent = integratedContent.replace(
            regex,
            `<span class="encyclopedia-tooltip" data-tooltip="${entry.shortDefinition}" data-entry-id="${entry.id}">${term}</span>`
          );
          break;

        case 'sidebar':
          integratedContent = integratedContent.replace(
            regex,
            `<span class="encyclopedia-sidebar-trigger" data-entry-id="${entry.id}">${term}</span>`
          );
          break;
      }
    }
  });

  return integratedContent;
}

/**
 * Content Analysis and Enhancement
 */
export function analyzeContentIntegration(content: EnhancedNode[]): ContentAnalysis {
  const analysis: ContentAnalysis = {
    contentTypes: {},
    narrativeElements: 0,
    structuredElements: 0,
    encyclopediaTerms: 0,
    integrationOpportunities: [],
    soulfulness: 0, // Measure of narrative richness
    structure: 0    // Measure of organizational clarity
  };

  content.forEach(node => {
    // Count content types
    if (!analysis.contentTypes[node.type]) {
      analysis.contentTypes[node.type] = 0;
    }
    analysis.contentTypes[node.type]++;

    // Assess narrative elements
    if (node.narrative || node.type === 'narrative_article') {
      analysis.narrativeElements++;
      analysis.soulfulness += assessNarrativeRichness(node);
    }

    // Assess structured elements
    if (node.type === 'key_point' || node.type === 'counter' || node.type === 'policy_statement') {
      analysis.structuredElements++;
      analysis.structure += assessStructuralClarity(node);
    }

    // Count encyclopedia terms
    if (node.type === 'encyclopedia_entry') {
      analysis.encyclopediaTerms++;
    }
  });

  // Identify integration opportunities
  analysis.integrationOpportunities = identifyIntegrationOpportunities(content);

  return analysis;
}

/**
 * Helper Functions
 */

function findNaturalInsertionPoints(text: string, element: EnhancedNode): number[] {
  const points: number[] = [];

  // Look for paragraph breaks
  const paragraphBreaks = [...text.matchAll(/\n\n/g)];
  paragraphBreaks.forEach(match => {
    if (match.index !== undefined) {
      points.push(match.index + 2);
    }
  });

  // Look for logical transition points
  const transitionWords = ['However', 'Furthermore', 'Additionally', 'In conclusion'];
  transitionWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'g');
    const matches = [...text.matchAll(regex)];
    matches.forEach(match => {
      if (match.index !== undefined) {
        points.push(match.index);
      }
    });
  });

  return points.sort((a, b) => a - b);
}

function generateOutline(narrative: EnhancedNode, structuredElements: EnhancedNode[]): OutlineItem[] {
  const outline: OutlineItem[] = [];

  // Extract headings from narrative content
  if (narrative.type === 'narrative_article') {
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const matches = [...narrative.fullText.matchAll(headingRegex)];

    matches.forEach((match, index) => {
      outline.push({
        id: `heading-${index}`,
        level: match[1].length,
        title: match[2],
        position: match.index || 0,
        relatedElements: findRelatedStructuredElements(match[2], structuredElements)
      });
    });
  }

  return outline;
}

function createCrossReferences(narrative: EnhancedNode, structured: EnhancedNode[]): CrossReference[] {
  const references: CrossReference[] = [];

  structured.forEach(element => {
    if (element.type === 'key_point') {
      references.push({
        structuredId: element.id,
        narrativeAnchors: findNarrativeAnchors(element.title, narrative),
        relationship: 'supports'
      });
    }
  });

  return references;
}

function estimateReadingTime(text: string): number {
  const wordsPerMinute = 200;
  const wordCount = text.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

function assessNarrativeRichness(node: EnhancedNode): number {
  let richness = 0;

  if (node.narrative?.intro) richness += 2;
  if (node.narrative?.context) richness += 3;
  if (node.narrative?.transitions) richness += 2;

  if (node.type === 'key_point' && 'storytellingElements' in node) {
    const storytelling = (node as any).storytellingElements;
    if (storytelling?.anecdote) richness += 3;
    if (storytelling?.analogy) richness += 2;
    if (storytelling?.realWorldExample) richness += 2;
  }

  return richness;
}

function assessStructuralClarity(node: EnhancedNode): number {
  let clarity = 0;

  if (node.tags && node.tags.length > 0) clarity += 1;
  if (node.targets) clarity += 2;

  if (node.type === 'key_point' && 'citations' in node) {
    clarity += (node as any).citations?.length || 0;
  }

  return clarity;
}

function identifyIntegrationOpportunities(content: EnhancedNode[]): IntegrationOpportunity[] {
  const opportunities: IntegrationOpportunity[] = [];

  // Find content that could benefit from encyclopedia links
  content.forEach(node => {
    if (node.type === 'key_point' || node.type === 'narrative_article') {
      // Analyze text for financial terms that might need definition
      const financialTerms = extractPotentialTerms(getNodeText(node));

      if (financialTerms.length > 0) {
        opportunities.push({
          nodeId: node.id,
          type: 'encyclopedia_linking',
          description: `Could link ${financialTerms.length} financial terms`,
          priority: 'medium',
          estimatedEffort: 'low'
        });
      }
    }
  });

  return opportunities;
}

function extractPotentialTerms(text: string): string[] {
  // Simple heuristic - look for capitalized finance-y terms
  const financialKeywords = [
    'ESG', 'Active Share', 'Alpha', 'Beta', 'Sharpe Ratio', 'Volatility',
    'Asset Management', 'Portfolio Construction', 'Risk Management',
    'Benchmark', 'Tracking Error', 'Factor Investing'
  ];

  return financialKeywords.filter(term =>
    text.toLowerCase().includes(term.toLowerCase())
  );
}

function findRelatedStructuredElements(title: string, elements: EnhancedNode[]): string[] {
  return elements
    .filter(el => {
      const elementText = getNodeText(el).toLowerCase();
      const titleWords = title.toLowerCase().split(' ');
      return titleWords.some(word => word.length > 3 && elementText.includes(word));
    })
    .map(el => el.id);
}

function findNarrativeAnchors(searchText: string, narrative: EnhancedNode): string[] {
  if (narrative.type !== 'narrative_article') return [];

  const anchors: string[] = [];
  const text = narrative.fullText.toLowerCase();
  const searchTerms = searchText.toLowerCase().split(' ');

  searchTerms.forEach(term => {
    if (term.length > 3 && text.includes(term)) {
      anchors.push(`text-contains-${term}`);
    }
  });

  return anchors;
}

function getNodeText(node: EnhancedNode): string {
  switch (node.type) {
    case 'key_point':
      return `${node.title} ${node.body}`;
    case 'narrative_article':
      return node.fullText;
    case 'encyclopedia_entry':
      return `${node.term} ${node.shortDefinition} ${node.detailedExplanation}`;
    default:
      return JSON.stringify(node);
  }
}

/**
 * Type Definitions
 */

export interface AnnotatedContent {
  text: string;
  annotations: ContentAnnotation[];
  structuredElements: EnhancedNode[];
  metadata: {
    readingTime: number;
    interactivityLevel: 'static' | 'interactive';
  };
}

export interface ContentAnnotation {
  position: number;
  length: number;
  type: 'encyclopedia_link' | 'embedded_element' | 'structural_marker';
  elementId: string;
  displayMode: 'inline' | 'tooltip' | 'sidebar' | 'expandable';
}

export interface SideBySideContent {
  narrative: {
    content: EnhancedNode;
    anchors: Array<{ id: string; text: string; position: number }>;
  };
  structured: {
    outline: OutlineItem[];
    elements: EnhancedNode[];
    crossReferences: CrossReference[];
  };
  interactions: {
    scrollSync: boolean;
    clickNavigation: boolean;
    highlightCorrespondence: boolean;
  };
}

export interface ProgressiveContent {
  layers: ContentLayer[];
  defaultVisible: string[];
  expandBehavior: 'accordion' | 'tabs' | 'overlay';
  contextualHelp: boolean;
}

export interface ContentLayer {
  level: string;
  title: string;
  content: EnhancedNode[];
  expandable: boolean;
  nextLayer: string | null;
}

export interface OutlineItem {
  id: string;
  level: number;
  title: string;
  position: number;
  relatedElements: string[];
}

export interface CrossReference {
  structuredId: string;
  narrativeAnchors: string[];
  relationship: 'supports' | 'contradicts' | 'explains' | 'examples';
}

export interface ContentAnalysis {
  contentTypes: Record<string, number>;
  narrativeElements: number;
  structuredElements: number;
  encyclopediaTerms: number;
  integrationOpportunities: IntegrationOpportunity[];
  soulfulness: number;
  structure: number;
}

export interface IntegrationOpportunity {
  nodeId: string;
  type: 'encyclopedia_linking' | 'narrative_enhancement' | 'structural_improvement';
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimatedEffort: 'high' | 'medium' | 'low';
}