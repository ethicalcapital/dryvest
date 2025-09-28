import { ExternalLink } from 'lucide-react';

export function Header() {
  return (
    <header
      className="w-full"
      style={{ backgroundColor: 'var(--ecic-purple)' }}
    >
      {/* Main Header */}
      <div className="mx-auto w-full max-w-[1400px] px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <a
              href="/"
              className="flex items-center gap-3 hover:opacity-90 transition-opacity"
            >
              <div className="flex items-center gap-3">
                <img
                  src="/ecic-logo.svg"
                  alt="Ethical Capital Logo"
                  className="h-8 w-auto"
                />
              </div>
            </a>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a
              href="https://ethicic.com/about"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-heading font-medium text-white hover:opacity-90 transition-opacity flex items-center gap-1"
            >
              About <ExternalLink size={12} />
            </a>
            <a
              href="https://ethicic.com/process"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-heading font-medium text-white hover:opacity-90 transition-opacity flex items-center gap-1"
            >
              Process <ExternalLink size={12} />
            </a>
            <a
              href="https://ethicic.com/solutions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-heading font-medium text-white hover:opacity-90 transition-opacity flex items-center gap-1"
            >
              Solutions <ExternalLink size={12} />
            </a>
          </nav>

          {/* CTA Buttons */}
          <div className="flex items-center space-x-4">
            <p className="hidden sm:block text-xs uppercase tracking-[0.3em] text-white/70">
              Translate moral demands into implementable investment policy
            </p>
            <a
              href="https://ethicic.com/content/pages/consultation"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg text-sm font-heading font-medium text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: 'var(--ecic-teal-dark)' }}
            >
              Schedule
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
