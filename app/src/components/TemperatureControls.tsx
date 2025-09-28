import { Thermometer, ChevronLeft, ChevronRight } from 'lucide-react';

interface TemperatureControlsProps {
  directness: 'diplomatic' | 'direct';
  onDirectnessChange: (value: 'diplomatic' | 'direct') => void;
  levelDescription?: string;
}

function TemperatureSlider({
  label,
  leftLabel,
  rightLabel,
  leftValue,
  rightValue,
  currentValue,
  onChange,
}: {
  label: string;
  leftLabel: string;
  rightLabel: string;
  leftValue: string;
  rightValue: string;
  currentValue: string;
  onChange: (value: any) => void;
}) {
  const isLeft = currentValue === leftValue;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Thermometer size={16} className="text-slate-500" />
        <span className="text-sm font-medium text-slate-700">{label}</span>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => onChange(leftValue)}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
            isLeft
              ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
              : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200'
          }`}
        >
          <ChevronLeft size={16} />
          {leftLabel}
        </button>

        <button
          onClick={() => onChange(rightValue)}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
            !isLeft
              ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
              : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200'
          }`}
        >
          {rightLabel}
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

export function TemperatureControls({
  directness,
  onDirectnessChange,
  levelDescription = 'Technical language',
}: TemperatureControlsProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white/80 p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-heading font-semibold text-slate-900 mb-2">
          Adjust the delivery
        </h3>
        <p className="text-sm text-slate-600">
          Keep the brief grounded in disciplined governance language while choosing how direct you want to sound.
        </p>
      </div>

      <div className="space-y-6">
        <TemperatureSlider
          label="Approach style"
          leftLabel="Diplomatic"
          rightLabel="Direct"
          leftValue="diplomatic"
          rightValue="direct"
          currentValue={directness}
          onChange={onDirectnessChange}
        />
      </div>

      <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
        <p className="text-xs text-amber-800">
          <strong>Current tone:</strong> {levelDescription}, {directness === 'diplomatic' ? 'diplomatic' : 'direct'} approach
        </p>
      </div>
    </div>
  );
}
