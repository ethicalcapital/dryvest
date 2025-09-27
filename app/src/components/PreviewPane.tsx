import ReactMarkdown from 'react-markdown';
import type { BriefContext, Node } from '../lib/schema';
import { GitHubFeedback } from './GitHubFeedback';

interface PreviewPaneProps {
  context: BriefContext;
  opener?: Extract<Node, { type: 'opener' }>;
  guide?: Extract<Node, { type: 'guide' }>;
  keyPoints: Extract<Node, { type: 'key_point' }>[];
  nextSteps: Extract<Node, { type: 'next_step' }>[];
  sources: Extract<Node, { type: 'source' }>[];
  screeningNode?: Extract<Node, { type: 'policy_statement' }>;
  policyAlignment?: Extract<Node, { type: 'policy_statement' }>;
  venueSnippet?: Extract<Node, { type: 'template_snippet' }>;
  templates: Extract<Node, { type: 'template_snippet' }>[];
  selectedOnePagers: Extract<Node, { type: 'one_pager' }>[];
  sourceLookup: Record<string, Extract<Node, { type: 'source' }>>;
}

const sectionClass =
  'rounded-xl border border-slate-200 bg-white/80 p-6 shadow-sm';

function Section({
  title,
  children,
  anchor,
}: {
  title: string;
  children: React.ReactNode;
  anchor?: string;
}) {
  return (
    <section id={anchor} className={sectionClass}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {anchor ? (
          <a
            className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
            href={`#${anchor}`}
            onClick={event => {
              event.preventDefault();
              document
                .getElementById(anchor)
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          >
            Jump to section
          </a>
        ) : null}
      </div>
      <div className="space-y-3 text-sm leading-relaxed text-slate-700">
        {children}
      </div>
    </section>
  );
}

function renderCitations(
  ids: string[] | undefined,
  sourceLookup: Record<string, Extract<Node, { type: 'source' }>>
) {
  if (!ids?.length) return null;
  return (
    <ul className="mt-3 space-y-1 text-xs text-slate-500">
      {ids.map(id => {
        const source = sourceLookup[id];
        if (!source) return null;
        return (
          <li key={id}>
            <a
              className="font-medium text-indigo-600 hover:text-indigo-700"
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {source.label}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

export function PreviewPane({
  context,
  opener,
  guide,
  keyPoints,
  nextSteps,
  sources,
  screeningNode,
  policyAlignment,
  venueSnippet,
  templates,
  selectedOnePagers,
  sourceLookup,
}: PreviewPaneProps) {
  return (
    <div className="space-y-6" data-preview-content>
      {guide ? (
        <Section title="Strategic approach" anchor="approach">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Lead with
              </h3>
              <p className="text-sm text-slate-700">{guide.sections.ask}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Implementation
              </h3>
              <p className="text-sm text-slate-700">
                {guide.sections.implementation}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Reporting cadence
              </h3>
              <p className="text-sm text-slate-700">{guide.sections.reporting}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Risk discipline
              </h3>
              <p className="text-sm text-slate-700">
                {guide.sections.risk}
              </p>
            </div>
          </div>
          <GitHubFeedback node={guide} />
        </Section>
      ) : null}

      {keyPoints.length ? (
        <Section title="Script for your audience" anchor="key-points">
          <p className="text-sm font-semibold text-slate-700">
            Lead with these points to translate your demand into routine policy language.
          </p>
          <ol className="mt-3 space-y-4">
            {keyPoints.map(point => (
              <li
                key={point.id}
                className="rounded-lg border border-slate-200 bg-white/70 p-4"
              >
                <h3 className="text-sm font-semibold text-slate-900">
                  {point.title}
                </h3>
                <p className="mt-2 text-sm text-slate-700">{point.body}</p>
                {renderCitations(point.citations, sourceLookup)}
                <GitHubFeedback node={point} size="sm" />
              </li>
            ))}
          </ol>
        </Section>
      ) : null}

      {nextSteps.length ? (
        <Section title="Next steps to keep momentum" anchor="next-steps">
          <p className="text-sm text-slate-700">
            Close with concrete follow-through so administrators know what comes next.
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
            {nextSteps.map(step => (
              <li key={step.id}>
                {step.text}
                <GitHubFeedback node={step} size="sm" />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {opener ? (
        <Section title="Opening angle" anchor="opener">
          <p>{opener.text}</p>
          <GitHubFeedback node={opener} />
        </Section>
      ) : null}


      {screeningNode ? (
        <Section title="Investment screening strategy" anchor="screening">
          {screeningNode.variants?.length ? (
            <div className="prose prose-sm max-w-none text-slate-700 prose-a:text-indigo-600">
              <ReactMarkdown>
                {screeningNode.variants.find(
                  variant => variant.transforms?.tone === context.level
                )?.body ?? screeningNode.variants[0].body}
              </ReactMarkdown>
            </div>
          ) : screeningNode.body ? (
            <div className="prose prose-sm max-w-none text-slate-700 prose-a:text-indigo-600">
              <ReactMarkdown>{screeningNode.body}</ReactMarkdown>
            </div>
          ) : null}
          <GitHubFeedback node={screeningNode} />
        </Section>
      ) : null}

      {policyAlignment ? (
        <Section title="Policy alignment" anchor="policy">
          {policyAlignment.bullets?.length ? (
            <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
              {policyAlignment.bullets.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          ) : null}
          {renderCitations(policyAlignment.citations, sourceLookup)}
          <GitHubFeedback node={policyAlignment} />
        </Section>
      ) : null}

      {venueSnippet ? (
        <Section title="Venue cues" anchor="venue">
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
            {venueSnippet.lines?.map((line, index) => (
              <li key={index}>{line}</li>
            ))}
          </ul>
        </Section>
      ) : null}

      {templates.length ? (
        <Section title="Templates" anchor="templates">
          <div className="space-y-4">
            {templates.map(snippet => (
              <div
                key={snippet.id}
                className="rounded-lg border border-slate-200 bg-slate-50 p-4"
              >
                <h3 className="text-sm font-semibold text-slate-900">
                  {snippet.title}
                </h3>
                {snippet.markdown ? (
                  <div className="prose prose-sm max-w-none text-slate-700 prose-pre:overflow-x-auto">
                    <ReactMarkdown>{snippet.markdown}</ReactMarkdown>
                  </div>
                ) : null}
                {snippet.lines ? (
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-slate-700">
                    {snippet.lines.map((line, index) => (
                      <li key={index}>{line}</li>
                    ))}
                  </ul>
                ) : null}
                <GitHubFeedback node={snippet} size="sm" />
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {selectedOnePagers.length ? (
        <Section title="Attachments" anchor="attachments">
          <div className="space-y-3">
            {selectedOnePagers.map(doc => (
              <article
                key={doc.id}
                className="rounded-lg border border-slate-200 bg-white p-4"
              >
                <h3 className="text-sm font-semibold text-slate-900">
                  {doc.title}
                </h3>
                <p className="mt-1 text-sm text-slate-600">{doc.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    className="inline-flex items-center rounded-md border border-indigo-600 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
                    href={`/${doc.markdownPath}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open markdown
                  </a>
                </div>
              </article>
            ))}
          </div>
        </Section>
      ) : null}

      {sources.length ? (
        <Section title="Sources" anchor="sources">
          <ul className="space-y-2 text-sm">
            {sources.map(source => (
              <li key={source.id}>
                <a
                  className="font-medium text-indigo-600 hover:text-indigo-700"
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {source.label}
                </a>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </div>
  );
}
