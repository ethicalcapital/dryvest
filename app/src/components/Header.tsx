import { ExternalLink } from 'lucide-react';

export function Header() {
  return (
    <header className="w-full bg-brand-secondary text-white">
      {/* Palestine Statement Bar */}
      <div className="w-full py-2 px-4 text-center text-sm font-heading font-medium">
        🇵🇸 We stand with Palestine
      </div>

      {/* Main Header */}
      <div className="border-t border-white/10">
        <div className="mx-auto w-full max-w-[1400px] px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <a
                href="https://ethicic.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xl font-heading font-bold hover:opacity-90 transition-opacity"
              >
                Ethical Capital
              </a>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a
                href="https://ethicic.com/about"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-heading font-medium hover:opacity-90 transition-opacity flex items-center gap-1"
              >
                About <ExternalLink size={12} />
              </a>
              <a
                href="https://ethicic.com/process"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-heading font-medium hover:opacity-90 transition-opacity flex items-center gap-1"
              >
                Process <ExternalLink size={12} />
              </a>
              <a
                href="https://ethicic.com/solutions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-heading font-medium hover:opacity-90 transition-opacity flex items-center gap-1"
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
                className="hidden sm:inline-flex text-sm font-heading font-medium hover:opacity-90 transition-opacity"
              >
                Contact
              </a>
              <a
                href="https://calendly.com/ethical-capital/consultation"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white text-slate-900 px-4 py-2 rounded-lg text-sm font-heading font-medium hover:bg-gray-100 transition-colors"
              >
                Schedule Consultation
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}