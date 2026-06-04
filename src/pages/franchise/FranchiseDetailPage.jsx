import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFranchiseById, clearCurrentFranchise } from '@/store/slices/franchiseSlice';
import {
  formatCurrency,
  formatInvestmentRange,
  SUPPORT_OPTIONS,
} from '@/constants/franchiseConstants';
import { FranchiseLogo, SupportIcons, FranchiseBadges } from '@/components/franchise/FranchiseCardParts';
import { FranchiseShareActions } from '@/components/franchise/FranchiseShareActions';
import { FranchiseListCard } from '@/components/franchise/FranchiseListCard';

const DetailRow = ({ label, value }) => (
  <div className="py-2 border-b border-gray-100 last:border-0">
    <dt className="text-sm text-gray-500">{label}</dt>
    <dd className="text-gray-900 font-medium mt-0.5">{value || '—'}</dd>
  </div>
);

const hasVisibleValue = (value) => {
  if (value === null || value === undefined) return false;
  const normalized = String(value).trim().toLowerCase();
  return normalized !== '' && normalized !== 'nil' && normalized !== 'n/a' && normalized !== '-';
};

const hasPositiveNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0;
};

const FranchiseDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentFranchise, loading, error } = useSelector((state) => state.franchise);
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);

  useEffect(() => {
    dispatch(fetchFranchiseById({ id }));
    return () => dispatch(clearCurrentFranchise());
  }, [dispatch, id]);

  const galleryUrls = useMemo(() => currentFranchise?.galleryUrls || [], [currentFranchise]);

  useEffect(() => {
    if (!selectedImageUrl) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedImageUrl(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedImageUrl]);

  if (loading) {
    return (
      <div className="flex justify-center min-h-[400px] items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7e22ce]" />
      </div>
    );
  }

  if (error || !currentFranchise) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-semibold text-red-600 mb-2">Franchise Not Found</h2>
        <button type="button" onClick={() => navigate('/franchises')} className="text-[#7e22ce] underline">
          Back to Franchises
        </button>
      </div>
    );
  }

  const f = currentFranchise;
  const franchiseId = f.uuid || f._id;
  const hasCityPreference = hasVisibleValue(f.cityPreference);
  const hasState = hasVisibleValue(f.state);
  const hasCountry =
    hasVisibleValue(f.country) &&
    (hasCityPreference || hasState || String(f.country).trim().toLowerCase() !== 'india');
  const hasInvestmentRange = hasPositiveNumber(f.minInvestment) || hasPositiveNumber(f.maxInvestment);
  const hasFranchiseFee = hasPositiveNumber(f.franchiseFee);
  const hasRoyaltyFee = hasPositiveNumber(f.royaltyFeePercent);
  const hasSecurityDeposit = hasPositiveNumber(f.securityDeposit);
  const hasSetupCost = hasPositiveNumber(f.setupCost);
  const hasWorkingCapital = hasPositiveNumber(f.workingCapital);
  const hasExpectedRoi = hasVisibleValue(f.expectedRoi);
  const hasPaybackPeriod = hasVisibleValue(f.paybackPeriod);
  const hasInvestmentDetails =
    hasInvestmentRange ||
    hasFranchiseFee ||
    hasRoyaltyFee ||
    hasSecurityDeposit ||
    hasSetupCost ||
    hasWorkingCapital ||
    hasExpectedRoi ||
    hasPaybackPeriod;
  const hasAvgMonthlyRevenue = hasPositiveNumber(f.avgMonthlyRevenue);
  const hasAvgMonthlyProfitMargin = hasVisibleValue(f.avgMonthlyProfitMargin);
  const hasBreakEvenPeriod = hasVisibleValue(f.breakEvenPeriod);
  const hasYearsOfOperation = hasPositiveNumber(f.yearsOfOperation);
  const hasExistingOutlets = hasPositiveNumber(f.existingOutlets);
  const hasFranchiseUnitsRunning = hasPositiveNumber(f.franchiseUnitsRunning);
  const hasBusinessPerformance =
    hasAvgMonthlyRevenue ||
    hasAvgMonthlyProfitMargin ||
    hasBreakEvenPeriod ||
    hasYearsOfOperation ||
    hasExistingOutlets ||
    hasFranchiseUnitsRunning;
  const hasPreferredExperience = hasVisibleValue(f.preferredExperience);
  const hasMinQualification = hasVisibleValue(f.minQualification);
  const hasStaffRequired = hasPositiveNumber(f.staffRequired);
  const hasOwnershipType = hasVisibleValue(f.ownershipType);
  const hasFranchiseeRequirements =
    Boolean(f.experienceRequired) ||
    hasPreferredExperience ||
    hasMinQualification ||
    hasStaffRequired ||
    hasOwnershipType;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {selectedImageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedImageUrl(null)}
        >
          <div className="relative max-w-6xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setSelectedImageUrl(null)}
              className="absolute -top-10 right-0 text-white/90 hover:text-white text-sm"
            >
              Close
            </button>
            <img
              src={selectedImageUrl}
              alt=""
              className="max-h-[85vh] w-full object-contain rounded-lg bg-black"
            />
          </div>
        </div>
      )}

      <button type="button" onClick={() => navigate('/franchises')} className="mb-6 text-[#7e22ce] hover:underline">
        ← Back to Franchises
      </button>

      {f.bannerUrl && (
        <img
          src={f.bannerUrl}
          alt=""
          loading="lazy"
          width={1024}
          height={256}
          className="w-full h-48 md:h-64 object-cover rounded-xl mb-6"
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-start gap-6 mb-8">
        <FranchiseLogo franchise={f} className="h-20 w-20" />
        <div className="flex-1">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{f.franchiseName}</h1>
          <p className="text-gray-600 mt-1">{f.brandName}</p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="inline-block text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
              {f.category}
              {f.subCategory ? ` · ${f.subCategory}` : ''}
            </span>
            <FranchiseBadges franchise={f} />
          </div>
          <div className="mt-4">
            <FranchiseShareActions franchiseName={f.franchiseName} />
          </div>
        </div>
        <div className="flex gap-3 shrink-0">
          <button
            type="button"
            onClick={() => navigate(`/franchises/${franchiseId}/apply`)}
            className="px-6 py-2.5 bg-[#7e22ce] text-white rounded-lg hover:bg-[#6b21a8] font-medium"
          >
            Apply for Franchise
          </button>
        </div>
      </div>

      {f.shortDescription && (
        <p className="text-lg text-gray-600 mb-8">{f.shortDescription}</p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {hasInvestmentDetails && (
        <section className="bg-white border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Investment Details</h2>
          <dl>
            {hasInvestmentRange && (
              <DetailRow label="Investment Range" value={formatInvestmentRange(f.minInvestment, f.maxInvestment)} />
            )}
            {hasFranchiseFee && <DetailRow label="Franchise Fee" value={formatCurrency(f.franchiseFee)} />}
            {hasRoyaltyFee && (
            <DetailRow label="Royalty Fee" value={f.royaltyFeePercent ? `${f.royaltyFeePercent}%` : '—'} />
            )}
            {hasSecurityDeposit && <DetailRow label="Security Deposit" value={formatCurrency(f.securityDeposit)} />}
            {hasSetupCost && <DetailRow label="Setup Cost" value={formatCurrency(f.setupCost)} />}
            {hasWorkingCapital && <DetailRow label="Working Capital" value={formatCurrency(f.workingCapital)} />}
            {hasExpectedRoi && <DetailRow label="Expected ROI" value={f.expectedRoi} />}
            {hasPaybackPeriod && <DetailRow label="Payback Period" value={f.paybackPeriod} />}
          </dl>
        </section>
        )}

        <section className="bg-white border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Location Requirements</h2>
          <dl>
            <DetailRow label="Required Area" value={f.requiredAreaSqFt ? `${f.requiredAreaSqFt} sq ft` : '—'} />
            <DetailRow label="Preferred Location" value={f.preferredLocation} />
            {hasCityPreference && <DetailRow label="City Preference" value={f.cityPreference} />}
            {hasState && <DetailRow label="State" value={f.state} />}
            {hasCountry && <DetailRow label="Country" value={f.country} />}
          </dl>
        </section>

        {hasBusinessPerformance && (
        <section className="bg-white border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Business Performance</h2>
          <dl>
            {hasAvgMonthlyRevenue && (
              <DetailRow label="Avg Monthly Revenue" value={formatCurrency(f.avgMonthlyRevenue)} />
            )}
            {hasAvgMonthlyProfitMargin && <DetailRow label="Profit Margin" value={f.avgMonthlyProfitMargin} />}
            {hasBreakEvenPeriod && <DetailRow label="Break-even Period" value={f.breakEvenPeriod} />}
            {hasYearsOfOperation && (
            <DetailRow label="Years of Operation" value={f.yearsOfOperation || '—'} />
            )}
            {hasExistingOutlets && <DetailRow label="Existing Outlets" value={f.existingOutlets} />}
            {hasFranchiseUnitsRunning && (
              <DetailRow label="Franchise Units Running" value={f.franchiseUnitsRunning} />
            )}
          </dl>
        </section>
        )}

        {hasFranchiseeRequirements && (
        <section className="bg-white border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Franchisee Requirements</h2>
          <dl>
            {f.experienceRequired && <DetailRow label="Experience Required" value="Yes" />}
            {hasPreferredExperience && <DetailRow label="Preferred Experience" value={f.preferredExperience} />}
            {hasMinQualification && <DetailRow label="Minimum Qualification" value={f.minQualification} />}
            {hasStaffRequired && (
            <DetailRow label="Staff Required" value={f.staffRequired || '—'} />
            )}
            {hasOwnershipType && <DetailRow label="Ownership Type" value={f.ownershipType} />}
          </dl>
        </section>
        )}
      </div>

      {f.detailedDescription && (
        <section className="mt-8 bg-white border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">About This Franchise</h2>
          <p className="text-gray-600 whitespace-pre-line">{f.detailedDescription}</p>
        </section>
      )}

      {(f.supportProvided?.length > 0) && (
        <section className="mt-8 bg-white border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Support Provided</h2>
          <SupportIcons supportProvided={f.supportProvided} size="md" />
          <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {f.supportProvided.filter((s) => SUPPORT_OPTIONS.includes(s)).map((s) => (
              <li key={s} className="text-sm text-gray-700 flex items-center gap-2">
                <span className="text-green-600">✓</span> {s}
              </li>
            ))}
          </ul>
        </section>
      )}

      {(f.brochurePdfUrl || f.presentationPdfUrl) && (
        <div className="mt-8 flex flex-wrap gap-3">
          {f.brochurePdfUrl && (
            <a
              href={f.brochurePdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[#7e22ce] text-white hover:bg-[#6b21a8] font-medium"
            >
              Download Brochure (PDF)
            </a>
          )}
          {f.presentationPdfUrl && (
            <a
              href={f.presentationPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-[#7e22ce] text-[#7e22ce] hover:bg-purple-50 font-medium"
            >
              Download Presentation (PDF)
            </a>
          )}
        </div>
      )}

      {galleryUrls.length > 0 && (
        <section className="mt-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Gallery</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {galleryUrls.map((url) => (
              <img
                key={url}
                src={url}
                alt=""
                role="button"
                tabIndex={0}
                onClick={() => setSelectedImageUrl(url)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setSelectedImageUrl(url);
                }}
                className="rounded-lg border object-cover h-40 w-full cursor-pointer hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-[#7e22ce]"
              />
            ))}
          </div>
        </section>
      )}

      {f.relatedFranchises?.length >= 2 && (
        <section className="mt-12 pt-8 border-t">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Related franchises</h2>
            <Link
              to={`/franchises?category=${encodeURIComponent(f.category)}`}
              className="text-sm text-[#7e22ce] hover:underline font-medium"
            >
              View all in {f.category}
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {f.relatedFranchises.map((related) => (
              <FranchiseListCard key={related.uuid || related._id} franchise={related} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default FranchiseDetailPage;
