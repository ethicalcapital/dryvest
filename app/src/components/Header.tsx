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
              href="https://ethicic.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 hover:opacity-90 transition-opacity"
            >
              {/* Logo SVG - matching ethicic.com */}
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: 'var(--ecic-teal-dark)' }}
                >
                  E
                </div>
                <span className="text-xl font-heading font-bold text-white">
                  Ethical Capital
                </span>
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
            <a
              href="https://ethicic.com/contact"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex text-sm font-heading font-medium text-white hover:opacity-90 transition-opacity"
            >
              Contact
            </a>
            <a
              href="https://calendly.com/ethical-capital/consultation"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg text-sm font-heading font-medium text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: 'var(--ecic-teal-dark)' }}
            >
              Schedule Consultation
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
