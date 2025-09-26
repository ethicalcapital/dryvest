import { useState, useRef, useEffect } from 'react';
import { ChevronRight, ChevronDown, ExternalLink, BookOpen, HelpCircle } from 'lucide-react';
import type {
  EnhancedNode,
  ContentIntegrationConfig,
  AnnotatedContent,
  ProgressiveContent
} from '../lib/enhanced-schema';

interface EnhancedContentRendererProps {
  content: EnhancedNode[];
  encyclopediaEntries: Record<string, EnhancedNode>;
  config: ContentIntegrationConfig;
}

export function EnhancedContentRenderer({
  content,
  encyclopediaEntries,
  config
}: EnhancedContentRendererProps) {
  const [activeMode, setActiveMode] = useState(config.mode);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [hoveredTerm, setHoveredTerm] = useState<string | null>(null);

  switch (activeMode) {
    case 'narrative':
      return <NarrativeView content={content} encyclopediaEntries={encyclopediaEntries} config={config} />;
    case 'structured':
      return <StructuredView content={content} config={config} />;
    case 'hybrid':
      return <HybridView content={content} encyclopediaEntries={encyclopediaEntries} config={config} />;
    default:
      return <HybridView content={content} encyclopediaEntries={encyclopediaEntries} config={config} />;
  }
}

/**
 * Narrative View: Story-first presentation with embedded structure
 */
function NarrativeView({
  content,
  encyclopediaEntries,
  config
}: {
  content: EnhancedNode[];
  encyclopediaEntries: Record<string, EnhancedNode>;
  config: ContentIntegrationConfig;
}) {
  const narrativeContent = content.find(node => node.type === 'narrative_article');

  if (!narrativeContent || narrativeContent.type !== 'narrative_article') {
    return <div>No narrative content available</div>;
  }

  return (
    <div className="max-w-4xl mx-auto prose prose-lg">
      <article className="space-y-6">
        <header>
          <h1 className="font-heading text-3xl font-bold text-slate-900">{narrativeContent.title}</h1>
          {narrativeContent.subtitle && (
            <p className="text-xl text-slate-600 mt-2">{narrativeContent.subtitle}</p>
          )}
          <div className="flex items-center gap-4 mt-4 text-sm text-slate-500">
            {narrativeContent.readingTime && (
              <span>{narrativeContent.readingTime} min read</span>
            )}
            {narrativeContent.difficulty && (
              <span className="capitalize">{narrativeContent.difficulty} level</span>
            )}
          </div>
        </header>

        <div className="relative">
          <NarrativeContentWithAnnotations
            text={narrativeContent.fullText}
            embeddedElements={narrativeContent.embeddedElements || []}
            content={content}
            encyclopediaEntries={encyclopediaEntries}
            config={config}
          />
        </div>
      </article>
    </div>
  );
}

/**
 * Structured View: Clear organization with optional narrative context
 */
function StructuredView({
  content,
  config
}: {
  content: EnhancedNode[];
  config: ContentIntegrationConfig;
}) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const keyPoints = content.filter(node => node.type === 'key_point');
  const counters = content.filter(node => node.type === 'counter');
  const sources = content.filter(node => node.type === 'source');

  return (
    <div className="space-y-8">
      {/* Key Points Section */}
      {keyPoints.length > 0 && (
        <section>
          <h2 className="font-heading text-2xl font-semibold mb-4 text-slate-900">Key Arguments</h2>
          <div className="space-y-4">
            {keyPoints.map((point) => (
              <StructuredKeyPoint
                key={point.id}
                point={point}
                expanded={expandedItems.has(point.id)}
                onToggle={() => toggleExpanded(point.id)}
                config={config}
              />
            ))}
          </div>
        </section>
      )}

      {/* Counter Arguments Section */}
      {counters.length > 0 && (
        <section>
          <h2 className="font-heading text-2xl font-semibold mb-4 text-slate-900">Addressing Concerns</h2>
          <div className="space-y-4">
            {counters.map((counter) => (
              <StructuredCounter
                key={counter.id}
                counter={counter}
                expanded={expandedItems.has(counter.id)}
                onToggle={() => toggleExpanded(counter.id)}
                config={config}
              />
            ))}
          </div>
        </section>
      )}

      {/* Sources Section */}
      {sources.length > 0 && (
        <section>
          <h2 className="font-heading text-2xl font-semibold mb-4 text-slate-900">Sources & Evidence</h2>
          <div className="grid gap-3">
            {sources.map((source) => (
              <SourceCard key={source.id} source={source} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/**
 * Hybrid View: Best of both worlds with toggleable modes
 */
function HybridView({
  content,
  encyclopediaEntries,
  config
}: {
  content: EnhancedNode[];
  encyclopediaEntries: Record<string, EnhancedNode>;
  config: ContentIntegrationConfig;
}) {
  const [viewMode, setViewMode] = useState<'story' | 'outline' | 'both'>('both');

  return (
    <div className="space-y-6">
      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex rounded-lg bg-slate-100 p-1">
          <button
            onClick={() => setViewMode('story')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
              viewMode === 'story'
                ? 'text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            style={{
              backgroundColor: viewMode === 'story' ? 'var(--ecic-purple)' : undefined,
            }}
          >
            <BookOpen size={14} className="mr-2" />
            Story
          </button>
          <button
            onClick={() => setViewMode('outline')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
              viewMode === 'outline'
                ? 'text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            style={{
              backgroundColor: viewMode === 'outline' ? 'var(--ecic-teal)' : undefined,
            }}
          >
            Outline
          </button>
          <button
            onClick={() => setViewMode('both')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
              viewMode === 'both'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Both
          </button>
        </div>
      </div>

      {/* Content Display */}
      <div className={`grid gap-6 ${
        viewMode === 'both' ? 'lg:grid-cols-[1fr,300px]' : 'grid-cols-1'
      }`}>

        {/* Main Content */}
        {(viewMode === 'story' || viewMode === 'both') && (
          <div>
            <NarrativeView content={content} encyclopediaEntries={encyclopediaEntries} config={config} />
          </div>
        )}

        {(viewMode === 'outline' || viewMode === 'both') && (
          <div className={viewMode === 'both' ? '' : 'max-w-4xl mx-auto'}>
            {viewMode === 'both' ? (
              <ContentOutlineSidebar content={content} />
            ) : (
              <StructuredView content={content} config={config} />
            )}
          </div>
        )}

      </div>
    </div>
  );
}

/**
 * Supporting Components
 */

function NarrativeContentWithAnnotations({
  text,
  embeddedElements,
  content,
  encyclopediaEntries,
  config
}: {
  text: string;
  embeddedElements: any[];
  content: EnhancedNode[];
  encyclopediaEntries: Record<string, EnhancedNode>;
  config: ContentIntegrationConfig;
}) {
  // This would use the content integration utilities to process the text
  // and embed structured elements and encyclopedia links
  const processedContent = processTextWithAnnotations(text, embeddedElements, encyclopediaEntries, config);

  return (
    <div
      className="narrative-content"
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  );
}

function StructuredKeyPoint({
  point,
  expanded,
  onToggle,
  config
}: {
  point: EnhancedNode;
  expanded: boolean;
  onToggle: () => void;
  config: ContentIntegrationConfig;
}) {
  if (point.type !== 'key_point') return null;

  const hasNarrative = point.narrative?.intro || point.narrative?.context;
  const hasStorytelling = 'storytellingElements' in point && point.storytellingElements;

  return (
    <div className="border border-slate-200 rounded-lg p-4 bg-white">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-heading font-semibold text-slate-900 mb-2">{point.title}</h3>
          <p className="text-slate-600">{point.body}</p>

          {/* Narrative Introduction */}
          {hasNarrative && point.narrative?.intro && (
            <div className="mt-3 p-3 rounded-lg bg-purple-50 border border-purple-200">
              <p className="text-sm text-purple-800">{point.narrative.intro}</p>
            </div>
          )}
        </div>

        {(hasNarrative || hasStorytelling) && (
          <button
            onClick={onToggle}
            className="ml-4 p-1 rounded text-slate-400 hover:text-slate-600"
          >
            {expanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </button>
        )}
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="mt-4 space-y-3 border-t pt-4">
          {hasStorytelling && (
            <div className="space-y-2">
              {point.storytellingElements?.anecdote && (
                <div className="bg-slate-50 p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-slate-700 mb-1">Story</h4>
                  <p className="text-sm text-slate-600">{point.storytellingElements.anecdote}</p>
                </div>
              )}
              {point.storytellingElements?.realWorldExample && (
                <div className="bg-slate-50 p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-slate-700 mb-1">Example</h4>
                  <p className="text-sm text-slate-600">{point.storytellingElements.realWorldExample}</p>
                </div>
              )}
            </div>
          )}

          {point.narrative?.context && (
            <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
              <h4 className="text-sm font-medium text-amber-800 mb-1">Context</h4>
              <p className="text-sm text-amber-700">{point.narrative.context}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StructuredCounter({
  counter,
  expanded,
  onToggle,
  config
}: {
  counter: EnhancedNode;
  expanded: boolean;
  onToggle: () => void;
  config: ContentIntegrationConfig;
}) {
  if (counter.type !== 'counter') return null;

  const hasNarrativeFlow = 'acknowledgment' in counter || 'transitionToResponse' in counter;

  return (
    <div className="border border-slate-200 rounded-lg p-4 bg-white">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-medium text-slate-900 mb-2">Concern: {counter.claim}</h4>
          <p className="text-slate-600">{counter.response}</p>
        </div>

        {hasNarrativeFlow && (
          <button
            onClick={onToggle}
            className="ml-4 p-1 rounded text-slate-400 hover:text-slate-600"
          >
            {expanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </button>
        )}
      </div>

      {expanded && hasNarrativeFlow && (
        <div className="mt-4 space-y-3 border-t pt-4">
          {'acknowledgment' in counter && counter.acknowledgment && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <h5 className="text-sm font-medium text-blue-800 mb-1">Acknowledgment</h5>
              <p className="text-sm text-blue-700">{counter.acknowledgment as string}</p>
            </div>
          )}
          {'transitionToResponse' in counter && counter.transitionToResponse && (
            <div className="bg-green-50 p-3 rounded-lg">
              <h5 className="text-sm font-medium text-green-800 mb-1">Response Logic</h5>
              <p className="text-sm text-green-700">{counter.transitionToResponse as string}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SourceCard({ source }: { source: EnhancedNode }) {
  if (source.type !== 'source') return null;

  const hasContext = 'relevanceContext' in source || 'credibilityNote' in source;

  return (
    <div className="border border-slate-200 rounded-lg p-4 bg-white">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-slate-900">{source.label}</h4>
            {'sourceType' in source && (
              <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600 capitalize">
                {source.sourceType as string}
              </span>
            )}
          </div>
          {'relevanceContext' in source && source.relevanceContext && (
            <p className="text-sm text-slate-600 mt-1">{source.relevanceContext as string}</p>
          )}
        </div>

        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-400 hover:text-slate-600"
        >
          <ExternalLink size={16} />
        </a>
      </div>
    </div>
  );
}

function ContentOutlineSidebar({ content }: { content: EnhancedNode[] }) {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const keyPoints = content.filter(node => node.type === 'key_point');
  const counters = content.filter(node => node.type === 'counter');

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <h3 className="font-heading font-semibold text-slate-900 mb-3">Content Outline</h3>

        {keyPoints.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-slate-700 mb-2">Key Arguments</h4>
            <ul className="space-y-1">
              {keyPoints.map((point) => (
                <li key={point.id}>
                  <button
                    onClick={() => setActiveSection(point.id)}
                    className={`text-left w-full p-2 rounded text-sm transition-colors ${
                      activeSection === point.id
                        ? 'bg-purple-50 text-purple-900'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {point.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {counters.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-2">Addressing Concerns</h4>
            <ul className="space-y-1">
              {counters.map((counter) => (
                <li key={counter.id}>
                  <button
                    onClick={() => setActiveSection(counter.id)}
                    className={`text-left w-full p-2 rounded text-sm transition-colors ${
                      activeSection === counter.id
                        ? 'bg-teal-50 text-teal-900'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {counter.claim}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Encyclopedia Integration Component
 */
export function EncyclopediaTooltip({
  term,
  entry,
  position
}: {
  term: string;
  entry: EnhancedNode;
  position: { x: number; y: number };
}) {
  if (entry.type !== 'encyclopedia_entry') return null;

  return (
    <div
      className="fixed z-50 bg-white border border-slate-200 rounded-lg shadow-lg p-4 max-w-sm"
      style={{ left: position.x, top: position.y }}
    >
      <div className="flex items-center gap-2 mb-2">
        <BookOpen size={16} className="text-purple-600" />
        <h4 className="font-heading font-semibold text-slate-900">{entry.term}</h4>
        <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600 capitalize">
          {entry.category.replace('_', ' ')}
        </span>
      </div>
      <p className="text-sm text-slate-600 mb-2">{entry.shortDefinition}</p>
      {entry.detailedExplanation && (
        <details>
          <summary className="text-xs text-purple-600 cursor-pointer">More details</summary>
          <p className="text-xs text-slate-500 mt-2">{entry.detailedExplanation}</p>
        </details>
      )}
    </div>
  );
}

/**
 * Helper Functions
 */

function processTextWithAnnotations(
  text: string,
  embeddedElements: any[],
  encyclopediaEntries: Record<string, EnhancedNode>,
  config: ContentIntegrationConfig
): string {
  // This is a simplified version - the actual implementation would use
  // the content integration utilities from content-integration.ts
  let processedText = text;

  // Add encyclopedia term highlighting
  if (config.autoLinkTerms) {
    Object.keys(encyclopediaEntries).forEach(term => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      processedText = processedText.replace(
        regex,
        `<span class="encyclopedia-term cursor-help underline decoration-dotted decoration-purple-400" data-term="${term}">${term}</span>`
      );
    });
  }

  // Add embedded elements at specified positions
  embeddedElements.forEach(element => {
    // Insert element markers at appropriate positions
    // This would be more sophisticated in the actual implementation
  });

  return processedText;
}