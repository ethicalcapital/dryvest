import { useMemo, useState } from 'react';
import { FileText, Plus } from 'lucide-react';
import type { Node } from '../lib/schema';

interface ModelDocumentGalleryProps {
  modelDocuments: Extract<Node, { type: 'one_pager' }>[];
  selectedDocs: string[];
  toggleDoc: (id: string, include?: boolean) => void;
}

const githubDocUrl = (path: string) =>
  `https://github.com/ethicalcapital/dryvest/blob/main/${path.replace(/^\//, '')}`;

export function ModelDocumentGallery({
  modelDocuments,
  selectedDocs,
  toggleDoc,
}: ModelDocumentGalleryProps) {
  const [showAll, setShowAll] = useState(false);
  const [requestedMore, setRequestedMore] = useState(false);

  const sortedDocs = useMemo(
    () => [...modelDocuments].sort((a, b) => a.title.localeCompare(b.title)),
    [modelDocuments]
  );

  const displayedDocs = showAll ? sortedDocs : sortedDocs.slice(0, 3);
  const hiddenCount = sortedDocs.length - displayedDocs.length;

  const handleRequestMore = () => {
    setRequestedMore(true);
    setTimeout(() => setShowAll(true), 300);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-heading font-semibold uppercase tracking-wide text-slate-500">
          Model Documents ({selectedDocs.length} selected)
        </h3>
        <div className="text-xs text-slate-400">{sortedDocs.length} available</div>
      </div>

      <div className="space-y-3">
        {displayedDocs.map(doc => (
          <ModelDocumentCard
            key={doc.id}
            doc={doc}
            isSelected={selectedDocs.includes(doc.id)}
            onToggle={() => toggleDoc(doc.id)}
          />
        ))}
      </div>

      {!showAll && hiddenCount > 0 && (
        <div className="text-center">
          <button
            onClick={handleRequestMore}
            disabled={requestedMore}
            className="inline-flex items-center gap-2 rounded-lg bg-ecic-purple px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {requestedMore ? (
              <>Loading...</>
            ) : (
              <>
                <Plus size={16} />
                Show {hiddenCount} More
              </>
            )}
          </button>
          <p className="mt-2 text-xs text-slate-500">
            We start with fewer options to keep things focused
          </p>
        </div>
      )}

      {showAll && (
        <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="text-center">
            <FileText size={24} className="mx-auto mb-2 text-slate-400" />
            <h4 className="mb-1 font-heading font-medium text-slate-900">
              Need something specific?
            </h4>
            <p className="mb-3 text-sm text-slate-600">
              We're adding more model documents as campaigns share their needs.
            </p>
            <a
              href="mailto:hello@ethicic.com?subject=Dryvest%20model%20document%20request"
              className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
              style={{ color: 'var(--ecic-teal)' }}
            >
              Request a topic
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function ModelDocumentCard({
  doc,
  isSelected,
  onToggle,
}: {
  doc: Extract<Node, { type: 'one_pager' }>;
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`rounded-lg border px-3 py-3 text-sm shadow-sm transition ${
        isSelected
          ? 'border-ecic-purple bg-ecic-purple/5 text-slate-900'
          : 'border-slate-200 bg-white text-slate-600 hover:border-ecic-purple/40'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h4 className="font-heading font-medium text-slate-900 leading-tight">
            {doc.title}
          </h4>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            {doc.description}
          </p>
        </div>
        <FileText size={16} className="flex-shrink-0 text-slate-400" />
      </div>

      <div className="mt-3 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onToggle}
          className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium transition ${
            isSelected
              ? 'border-ecic-purple bg-ecic-purple/10 text-ecic-purple'
              : 'border-slate-200 text-slate-600 hover:border-ecic-purple/40'
          }`}
        >
          {isSelected ? 'Remove from brief' : 'Include in brief'}
        </button>
        <a
          href={githubDocUrl(doc.markdownPath)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-ecic-purple/40 hover:text-ecic-purple"
        >
          View on GitHub
        </a>
      </div>
    </div>
  );
}
