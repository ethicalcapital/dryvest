import { ExternalLink, Github } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full bg-slate-900 text-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Company Info */}
          <div>
            <h3 className="text-lg font-heading font-semibold mb-4">Ethical Capital</h3>
            <p className="text-sm text-gray-300 mb-4">
              Invest Vegan LLC DBA Ethical Capital
            </p>
            <div className="text-sm text-gray-300 space-y-1">
              <p>90 N 400 E, Provo, UT 84606</p>
              <p>
                <a
                  href="mailto:hello@ethicic.com"
                  className="hover:text-white transition-colors"
                >
                  hello@ethicic.com
                </a>
              </p>
            </div>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-md font-heading font-semibold mb-4">Legal</h4>
            <div className="space-y-2">
              <a
                href="https://ethicic.com/disclosures"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-gray-300 hover:text-white transition-colors flex items-center gap-1"
              >
                Disclosures <ExternalLink size={12} />
              </a>
              <a
                href="https://ethicic.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-gray-300 hover:text-white transition-colors flex items-center gap-1"
              >
                Privacy Policy <ExternalLink size={12} />
              </a>
              <a
                href="https://ethicic.com/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-gray-300 hover:text-white transition-colors flex items-center gap-1"
              >
                Terms of Use <ExternalLink size={12} />
              </a>
              <a
                href="https://github.com/ethicalcapital/dryvest"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-gray-300 hover:text-white transition-colors flex items-center gap-1"
              >
                <Github size={14} /> GitHub
              </a>
            </div>
          </div>

          {/* Actions */}
          <div>
            <h4 className="text-md font-heading font-semibold mb-4">Get Started</h4>
            <div className="space-y-3">
              <a
                href="https://calendly.com/ethical-capital/consultation"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex bg-white text-slate-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
              >
                Schedule Consultation
              </a>
              <p className="text-xs text-gray-400 leading-relaxed">
                This website is for informational purposes only and does not constitute investment advice.
              </p>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} Invest Vegan LLC DBA Ethical Capital. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}