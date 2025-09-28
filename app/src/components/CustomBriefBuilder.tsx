import { useMemo, useId } from 'react';
import { Check } from 'lucide-react';
import type { BriefContext } from '../lib/schema';
import type { Dataset } from '../lib/schema';
import { getKeyPointsForContext } from '../lib/keyPoints';
import { trackEvent } from '../lib/analytics';

interface CustomBriefBuilderProps {
  dataset: Dataset;
  context: BriefContext;
  onContextChange: (context: BriefContext) => void;
  selectedKeyPoints: string[];
  onKeyPointsChange: (keyPointIds: string[]) => void;
}

export function CustomBriefBuilder({
  dataset,
  context,
  onContextChange,
  selectedKeyPoints,
  onKeyPointsChange,
}: CustomBriefBuilderProps) {
  const identitySelectId = useId();
  const audienceSelectId = useId();
  const venueSelectId = useId();
  // Get all available key points for current context
  const availableKeyPoints = useMemo(() => {
    return getKeyPointsForContext(dataset, context).sort((a, b) =>
      a.title.localeCompare(b.title)
    );
  }, [dataset, context]);

  const toggleKeyPoint = (keyPointId: string) => {
    if (selectedKeyPoints.includes(keyPointId)) {
      onKeyPointsChange(selectedKeyPoints.filter(id => id !== keyPointId));
      trackEvent('key_point_toggled', {
        keyPointId,
        selected: false,
        identity: context.identity,
      });
    } else {
      onKeyPointsChange([...selectedKeyPoints, keyPointId]);
      trackEvent('key_point_toggled', {
        keyPointId,
        selected: true,
        identity: context.identity,
      });
    }
  };

  const selectAll = () => {
    onKeyPointsChange(availableKeyPoints.map(kp => kp.id));
    trackEvent('custom_keypoint_saved', {
      action: 'select_all',
      total: availableKeyPoints.length,
      identity: context.identity,
    });
  };

  const clearAll = () => {
    onKeyPointsChange([]);
    trackEvent('custom_keypoint_saved', {
      action: 'clear_all',
      identity: context.identity,
    });
  };

  return (
    <div className="space-y-6">
      {/* Context Selection */}
      <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm">
        <h3 className="text-lg font-heading font-semibold text-slate-900 mb-4">
          Your Context
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Identity */}
          <div>
            <label
              className="block text-sm font-medium text-slate-700 mb-2"
              htmlFor={identitySelectId}
            >
              Identity
            </label>
            <select
              id={identitySelectId}
              value={context.identity || ''}
              onChange={e =>
                onContextChange({
                  ...context,
                  identity: e.target.value || undefined,
                })
              }
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1"
              style={{
                borderColor: 'var(--border-gray)',
              }}
              onFocus={e => {
                e.target.style.borderColor = 'var(--ecic-purple)';
                e.target.style.boxShadow = '0 0 0 1px var(--ecic-purple)';
              }}
              onBlur={e => {
                e.target.style.borderColor = 'var(--border-gray)';
                e.target.style.boxShadow = 'none';
              }}
            >
              <option value="">Select...</option>
              <option value="individual">Individual</option>
              <option value="endowment">Endowment</option>
              <option value="foundation">Foundation</option>
              <option value="public_pension">Public Pension</option>
              <option value="corporate_pension">Corporate Pension</option>
              <option value="swf">Sovereign Wealth</option>
              <option value="insurance">Insurance</option>
              <option value="central_bank">Central Bank</option>
              <option value="government">Government</option>
            </select>
          </div>

          {/* Audience */}
          <div>
            <label
              className="block text-sm font-medium text-slate-700 mb-2"
              htmlFor={audienceSelectId}
            >
              Audience
            </label>
            <select
              id={audienceSelectId}
              value={context.audience || ''}
              onChange={e =>
                onContextChange({
                  ...context,
                  audience: e.target.value || undefined,
                })
              }
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1"
              style={{
                borderColor: 'var(--border-gray)',
              }}
              onFocus={e => {
                e.target.style.borderColor = 'var(--ecic-purple)';
                e.target.style.boxShadow = '0 0 0 1px var(--ecic-purple)';
              }}
              onBlur={e => {
                e.target.style.borderColor = 'var(--border-gray)';
                e.target.style.boxShadow = 'none';
              }}
            >
              <option value="">Select...</option>
              <option value="fiduciary">Fiduciary</option>
              <option value="family_friends">Family & Friends</option>
              <option value="colleagues">Colleagues</option>
              <option value="stakeholders">Stakeholders</option>
            </select>
          </div>

          {/* Venue */}
          <div>
            <label
              className="block text-sm font-medium text-slate-700 mb-2"
              htmlFor={venueSelectId}
            >
              Venue
            </label>
            <select
              id={venueSelectId}
              value={context.venue || ''}
              onChange={e =>
                onContextChange({
                  ...context,
                  venue: e.target.value || undefined,
                })
              }
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1"
              style={{
                borderColor: 'var(--border-gray)',
              }}
              onFocus={e => {
                e.target.style.borderColor = 'var(--ecic-purple)';
                e.target.style.boxShadow = '0 0 0 1px var(--ecic-purple)';
              }}
              onBlur={e => {
                e.target.style.borderColor = 'var(--border-gray)';
                e.target.style.boxShadow = 'none';
              }}
            >
              <option value="">Select...</option>
              <option value="one_on_one">One-on-One</option>
              <option value="committee_meeting">Committee Meeting</option>
              <option value="board_presentation">Board Presentation</option>
              <option value="public_testimony">Public Testimony</option>
              <option value="city_council">City Council</option>
            </select>
          </div>

        </div>
      </div>

      {/* Key Points Selection */}
      <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-heading font-semibold text-slate-900">
            Choose Key Points ({selectedKeyPoints.length} of{' '}
            {availableKeyPoints.length})
          </h3>
          <div className="flex gap-2">
            <button
              onClick={selectAll}
              className="text-sm px-3 py-1 rounded-md text-white hover:opacity-90 transition-opacity"
              style={{
                backgroundColor: 'var(--ecic-purple)',
              }}
            >
              Select All
            </button>
            <button
              onClick={clearAll}
              className="text-sm px-3 py-1 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>

        {availableKeyPoints.length === 0 ? (
          <p className="text-slate-500 text-center py-8">
            Select your context above to see available key points
          </p>
        ) : (
          <div className="grid gap-3">
            {availableKeyPoints.map(keyPoint => {
              const isSelected = selectedKeyPoints.includes(keyPoint.id);
              return (
                <label
                  key={keyPoint.id}
                  className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-50'
                      : 'border-slate-200 bg-white hover:bg-indigo-50'
                  }`}
                  style={{
                    borderColor: isSelected
                      ? 'var(--ecic-purple)'
                      : 'var(--border-gray)',
                    backgroundColor: isSelected
                      ? 'rgba(88, 28, 135, 0.05)'
                      : undefined,
                  }}
                >
                  <div
                    className={`mt-1 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${
                      isSelected ? 'text-white' : 'border-slate-300'
                    }`}
                    style={{
                      borderColor: isSelected
                        ? 'var(--ecic-purple)'
                        : 'var(--border-gray)',
                      backgroundColor: isSelected
                        ? 'var(--ecic-purple)'
                        : undefined,
                    }}
                  >
                    {isSelected && <Check size={14} />}
                  </div>
                  <div>
                    <h4 className="font-heading font-medium text-slate-900">
                      {keyPoint.title}
                    </h4>
                    <p className="text-sm text-slate-600 mt-1">
                      {keyPoint.body}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleKeyPoint(keyPoint.id)}
                    className="sr-only"
                  />
                </label>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
