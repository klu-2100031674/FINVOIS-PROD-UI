import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import finvoisLogo from '../../assets/finvois.png';

/**
 * Minimal top nav for the public scheme flows (forms, support, AI chat): no app sidebar,
 * no site footer, Finvois violet theme.
 */
export default function PublicPmepgChrome({ children, contentClassName = 'pb-12' }) {
  const hasPt = contentClassName.includes('pt-');
  const hasPx = contentClassName.includes('px-');
  const finalClass = `flex-1 ${hasPt ? '' : 'pt-28'} ${hasPx ? '' : 'px-4 sm:px-6'} ${contentClassName}`;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-purple-50/80 via-white to-white font-inter">
      <nav className="fixed top-0 w-full z-50 border-b border-purple-100 bg-white/85 backdrop-blur-lg">
        <div className="h-1 w-full bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-3">
            <Link to="/" className="flex items-center gap-2">
              <img src={finvoisLogo} alt="Finvois" className="h-8 md:h-9 w-auto" />
            </Link>

            <div className="flex items-center gap-2 sm:gap-4">
              <Link
                to="/genie"
                className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1.5 text-sm font-semibold text-purple-700 ring-1 ring-purple-200 hover:bg-purple-100"
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">Finvois Genie</span>
                <span className="sm:hidden">Genie</span>
              </Link>
              <Link
                to="/"
                className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Home</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className={finalClass}>{children}</div>
    </div>
  );
}
