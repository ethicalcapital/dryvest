import { useState } from 'react';
import { ShieldAlert } from 'lucide-react';

interface DisclaimerGateProps {
  onAccept: () => void;
}

export function DisclaimerGate({ onAccept }: DisclaimerGateProps) {
  const [isChecked, setIsChecked] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur">
      <div className="w-full max-w-xl rounded-2xl border border-indigo-200 bg-white p-8 shadow-2xl">
        <div className="flex items-center gap-3">
          <div
            className="rounded-lg p-3 text-white"
            style={{ backgroundColor: 'var(--ecic-purple)' }}
          >
            <ShieldAlert size={24} />
          </div>
          <div>
            <h2 className="text-xl font-heading font-semibold text-slate-900">
              Before you continue
            </h2>
            <p className="text-sm text-slate-600">
              Dryvest provides educational intelligence for strategic organizing.
              It is not investment, legal, or tax advice.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3 text-sm text-slate-700">
          <p className="font-medium text-slate-800">By continuing, you confirm:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              You will use Dryvest outputs for educational campaign planning and
              institutional literacy—not for making or executing investment decisions.
            </li>
            <li>
              You understand that Ethical Capital and Dryvest do not accept fiduciary
              responsibility for any investment outcomes.
            </li>
            <li>
              You will cite provided sources in full and verify applicability before
              relying on them in formal proceedings.
            </li>
          </ul>
        </div>

        <form
          className="mt-6 space-y-4"
          onSubmit={event => {
            event.preventDefault();
            if (!isChecked) return;
            onAccept();
          }}
        >
          <label className="flex items-start gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={event => setIsChecked(event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>
              I have read and understand that Dryvest materials are for educational
              purposes only and do not constitute investment advice.
            </span>
          </label>

          <button
            type="submit"
            disabled={!isChecked}
            className="w-full rounded-lg px-4 py-2 text-sm font-heading font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60"
            style={{ backgroundColor: 'var(--ecic-purple)' }}
          >
            Accept and enter Dryvest
          </button>

          <p className="text-xs text-slate-500 text-center">
            Questions?{' '}
            <a
              href="mailto:hello@ethicic.com?subject=Dryvest Disclaimer"
              className="text-indigo-600 hover:text-indigo-700"
            >
              Contact Ethical Capital
            </a>
            .
          </p>
        </form>
      </div>
    </div>
  );
}
