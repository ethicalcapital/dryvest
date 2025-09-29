export default function BottomStepper({
  current,
  total,
  onPrev,
  onNext,
  nextLabel = "Next",
  canNext = true,
  showChangeMode = false,
  onChangeMode
}) {
  return (
    <div className="bottom-stepper" role="navigation" aria-label="Progress">
      <div className="bar">
        <div className="progress-text">
          Step <strong>{current}</strong> of <strong>{total}</strong>
        </div>
        <div className="actions">
          {showChangeMode && (
            <button className="btn ghost" onClick={onChangeMode} aria-label="Change mode">Change mode</button>
          )}
          <button className="btn secondary" onClick={onPrev} disabled={current === 1}>Back</button>
          <button className="btn primary" onClick={canNext ? onNext : undefined} disabled={!canNext}>{nextLabel}</button>
        </div>
      </div>
    </div>
  );
}
