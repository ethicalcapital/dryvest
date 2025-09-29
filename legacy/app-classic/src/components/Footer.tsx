export function Footer() {
  return (
    <footer className="w-full border-t border-white/10 bg-slate-950 text-white/60">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-5 text-[11px] sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p>© {new Date().getFullYear()} Invest Vegan LLC DBA Ethical Capital.</p>
          <p className="text-white/40">
            Dryvest is educational intelligence. It never constitutes investment, legal, or tax advice.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <a
            href="https://ethicic.com/disclosures"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white"
          >
            Disclosures
          </a>
          <a
            href="https://ethicic.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white"
          >
            Privacy
          </a>
          <a
            href="https://ethicic.com/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white"
          >
            Terms
          </a>
          <a
            href="mailto:hello@ethicic.com?subject=Dryvest%20feedback"
            className="hover:text-white"
          >
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
