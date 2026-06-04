import { useNavigate } from 'react-router-dom';
import { formatInvestmentRange } from '@/constants/franchiseConstants';
import { FranchiseLogo, FranchiseBadges } from '@/components/franchise/FranchiseCardParts';

export function FranchiseListCard({ franchise, showActions = true, compact = true }) {
  const navigate = useNavigate();
  const fid = franchise.uuid || franchise._id;

  return (
    <div className="bg-white border rounded-xl overflow-hidden hover:shadow-md hover:border-purple-300 transition-all flex flex-col h-full">
      <div className={`relative bg-purple-50 ${compact ? 'h-28' : 'h-36'}`}>
        {franchise.bannerUrl ? (
          <img
            src={franchise.bannerUrl}
            alt=""
            loading="lazy"
            width={400}
            height={112}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-purple-100 to-purple-50" />
        )}
        <div className="absolute top-1.5 left-1.5">
          <FranchiseBadges franchise={franchise} />
        </div>
      </div>
      <div className={`flex-1 flex flex-col ${compact ? 'p-4' : 'p-5'}`}>
        <div className={`flex items-start gap-3 mb-3 relative ${compact ? '-mt-6' : '-mt-8'}`}>
          <FranchiseLogo
            franchise={franchise}
            className={compact ? 'h-11 w-11 shadow-md' : 'h-14 w-14 shadow-md'}
          />
          <div className={`flex-1 min-w-0 ${compact ? 'pt-5' : 'pt-7'}`}>
            <h3 className={`font-semibold text-gray-900 truncate ${compact ? 'text-base' : 'text-lg'}`}>
              {franchise.franchiseName}
            </h3>
            <span className="inline-block mt-0.5 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
              {franchise.category}
            </span>
          </div>
        </div>

        <p className="text-gray-500 text-xs mb-3 line-clamp-2 flex-1">
          {franchise.shortDescription || 'No description available'}
        </p>

        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
          <div>
            <span className="text-gray-400 block">Investment</span>
            <span className="font-medium text-gray-800">
              {formatInvestmentRange(franchise.minInvestment, franchise.maxInvestment)}
            </span>
          </div>
          <div>
            <span className="text-gray-400 block">Area</span>
            <span className="font-medium text-gray-800">
              {franchise.requiredAreaSqFt ? `${franchise.requiredAreaSqFt} sq ft` : '—'}
            </span>
          </div>
        </div>

        {showActions && (
          <div className="flex gap-2 mt-auto pt-3 border-t">
            <button
              type="button"
              onClick={() => navigate(`/franchises/${fid}`)}
              className="flex-1 px-3 py-1.5 border border-[#7e22ce] text-[#7e22ce] rounded-lg hover:bg-purple-50 text-xs font-medium"
            >
              Know More
            </button>
            <button
              type="button"
              onClick={() => navigate(`/franchises/${fid}/apply`)}
              className="flex-1 px-3 py-1.5 bg-[#7e22ce] text-white rounded-lg hover:bg-[#6b21a8] text-xs font-medium"
            >
              Apply Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
