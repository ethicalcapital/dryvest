import { useState } from 'react';
import { FileText, Plus } from 'lucide-react';
import type { Node } from '../lib/schema';

interface ModelDocumentGalleryProps {
  modelDocuments: Extract<Node, { type: 'one_pager' }>[];
  selectedDocs: string[];
  toggleDoc: (id: string, include?: boolean) => void;
}

export function ModelDocumentGallery({
  modelDocuments,
  selectedDocs,
  toggleDoc,
}: ModelDocumentGalleryProps) {
  const [showAll, setShowAll] = useState(false);
  const [requestedMore, setRequestedMore] = useState(false);

  // Show only first 3 by default to avoid overwhelming
  const displayedDocs = showAll ? modelDocuments : modelDocuments.slice(0, 3);
  const hiddenCount = modelDocuments.length - displayedDocs.length;

  const handleRequestMore = () => {
    setRequestedMore(true);
    // This could trigger analytics or a backend request for more content
    setTimeout(() => setShowAll(true), 300);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-heading font-semibold uppercase tracking-wide text-slate-500">
          Model Documents ({selectedDocs.length} selected)
        </h3>
        <div className="text-xs text-slate-400">
          {modelDocuments.length} available
        </div>
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

      {/* Show More Button */}
      {!showAll && hiddenCount > 0 && (
        <div className="text-center">
          <button
            onClick={handleRequestMore}
            disabled={requestedMore}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
            style={{ backgroundColor: 'var(--ecic-purple)' }}
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
          <p className="text-xs text-slate-500 mt-2">
            We start with fewer options to keep things focused
          </p>
        </div>
      )}

      {/* Request More Content CTA */}
      {showAll && (
        <div className="mt-6 p-4 rounded-lg bg-slate-50 border border-slate-200">
          <div className="text-center">
            <FileText size={24} className="mx-auto text-slate-400 mb-2" />
            <h4 className="font-heading font-medium text-slate-900 mb-1">
              Need something specific?
            </h4>
            <p className="text-sm text-slate-600 mb-3">
              We're building more model documents based on what's most useful.
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
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 text-sm shadow-sm transition-all ${
        isSelected
          ? 'text-slate-900'
          : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300'
      }`}
      style={{
        borderColor: isSelected ? 'var(--ecic-purple)' : 'var(--border-gray)',
        backgroundColor: isSelected ? 'rgba(88, 28, 135, 0.05)' : undefined,
      }}
    >
      {/* Custom Checkbox */}
      <div
        className={`mt-1 flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center ${
          isSelected ? 'text-white' : 'border-slate-300'
        }`}
        style={{
          borderColor: isSelected ? 'var(--ecic-purple)' : 'var(--border-gray)',
          backgroundColor: isSelected ? 'var(--ecic-purple)' : undefined,
        }}
      >
        {isSelected && <span className="text-xs">✓</span>}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-heading font-medium text-slate-900 leading-tight">
              {doc.title}
            </h4>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              {doc.description}
            </p>
          </div>
          <FileText size={16} className="ml-2 flex-shrink-0 text-slate-400" />
        </div>
      </div>

      {/* Hidden input for accessibility */}
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onToggle}
        className="sr-only"
      />
    </label>
  );
}
