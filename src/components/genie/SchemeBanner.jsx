import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { genieAssetUrl } from '../../api/genieAPI';

/**
 * 16:9 scheme banner. Falls back to a violet gradient with the scheme name
 * when there is no image (or it fails to load).
 */
export default function SchemeBanner({ bannerUrl, name, className = '', rounded = 'rounded-xl', compact = false }) {
  const [failed, setFailed] = useState(false);
  const src = genieAssetUrl(bannerUrl);

  if (src && !failed) {
    return (
      <div className={`relative aspect-video overflow-hidden bg-purple-50 ${rounded} ${className}`}>
        <img
          src={src}
          alt={`${name} banner`}
          loading="lazy"
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative aspect-video overflow-hidden bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 ${rounded} ${className}`}
      aria-label={`${name} banner`}
      role="img"
    >
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
      <div className="absolute -bottom-8 left-1/3 h-28 w-28 rounded-full bg-white/5" />
      <div className="absolute inset-0 flex flex-col items-start justify-end p-4">
        <Sparkles className={`${compact ? 'h-4 w-4' : 'h-5 w-5'} text-purple-200 mb-1`} />
        <span
          className={`font-['Manrope'] font-bold text-white leading-tight line-clamp-2 ${
            compact ? 'text-sm' : 'text-lg'
          }`}
        >
          {name}
        </span>
      </div>
    </div>
  );
}
