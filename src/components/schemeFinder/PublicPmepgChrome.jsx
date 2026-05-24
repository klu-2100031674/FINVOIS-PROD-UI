import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import finvoisLogo from '../../assets/finvois.png';

/**
 * Minimal top nav for public PMEGP flow (no app sidebar, no site footer).
 */
export default function PublicPmepgChrome({ children, contentClassName = 'pb-12' }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-lg border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <img src={finvoisLogo} alt="Finvois" className="h-8 md:h-10 w-auto" />
            </Link>

            <Link
              to="/"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-['Inter']"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      <div className={`flex-1 pt-28 px-6 ${contentClassName}`}>{children}</div>
    </div>
  );
}
