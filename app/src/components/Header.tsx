export function Header() {
  return (
    <header className="w-full border-b border-white/10 bg-slate-950">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <a href="/" className="flex items-center gap-3 text-white hover:opacity-90">
          <img
            src="/ecic-logo.svg"
            alt="Ethical Capital Logo"
            className="h-7 w-auto"
          />
          <span className="hidden text-sm font-heading tracking-[0.3em] text-white/60 sm:inline">
            Dryvest
          </span>
        </a>
        <span className="text-[10px] uppercase tracking-[0.35em] text-white/60">
          Translate moral demands into implementable investment policy
        </span>
      </div>
    </header>
  );
}
