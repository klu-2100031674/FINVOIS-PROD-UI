import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { AdminLayout } from '@/components/layouts';
import {
  fetchFranchiseById,
  createFranchise,
  updateFranchise,
  clearCurrentFranchise,
  fetchFranchiseCategories,
} from '@/store/slices/franchiseSlice';
import {
  PREFERRED_LOCATIONS,
  SUPPORT_OPTIONS,
  OWNERSHIP_TYPES,
  initialFranchiseFormState,
} from '@/constants/franchiseConstants';
import { getFranchiseTestFormData } from '@/constants/franchiseTestData';
import { FranchiseCategorySelect } from '@/components/franchise/FranchiseCategorySelect';
import {
  FORM_SECTION_META,
  computeFormProgress,
  FranchiseFormHeader,
  FranchiseFormMobileNav,
  FranchiseFormSidebarNav,
  FranchiseSectionCard,
  FranchiseFileUpload,
  SupportOptionPills,
  FranchiseFormFooter,
  FieldHint,
} from '@/components/franchise/admin/AdminFranchiseFormParts';

const inputClass =
  'w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7e22ce] focus:border-[#7e22ce] bg-white';
const labelClass = 'block text-sm font-medium text-gray-800 mb-1.5';

const INITIAL_OPEN = {
  basic: true,
  investment: true,
  space: false,
  performance: false,
  support: false,
  requirements: false,
  publishing: true,
  media: false,
};

function franchiseToForm(f) {
  if (!f) return { ...initialFranchiseFormState };
  return {
    franchiseName: f.franchiseName || '',
    brandName: f.brandName || '',
    category: f.category || '',
    subCategory: f.subCategory || '',
    shortDescription: f.shortDescription || '',
    detailedDescription: f.detailedDescription || '',
    minInvestment: f.minInvestment ?? '',
    maxInvestment: f.maxInvestment ?? '',
    franchiseFee: f.franchiseFee ?? '',
    royaltyFeePercent: f.royaltyFeePercent ?? '',
    securityDeposit: f.securityDeposit ?? '',
    setupCost: f.setupCost ?? '',
    workingCapital: f.workingCapital ?? '',
    expectedRoi: f.expectedRoi || '',
    paybackPeriod: f.paybackPeriod || '',
    requiredAreaSqFt: f.requiredAreaSqFt ?? '',
    preferredLocation: f.preferredLocation || '',
    cityPreference: f.cityPreference || '',
    state: f.state || '',
    country: f.country || 'India',
    avgMonthlyRevenue: f.avgMonthlyRevenue ?? '',
    avgMonthlyProfitMargin: f.avgMonthlyProfitMargin || '',
    breakEvenPeriod: f.breakEvenPeriod || '',
    yearsOfOperation: f.yearsOfOperation ?? '',
    existingOutlets: f.existingOutlets ?? '',
    franchiseUnitsRunning: f.franchiseUnitsRunning ?? '',
    supportProvided: f.supportProvided || [],
    experienceRequired: Boolean(f.experienceRequired),
    preferredExperience: f.preferredExperience || '',
    minQualification: f.minQualification || '',
    staffRequired: f.staffRequired ?? '',
    ownershipType: f.ownershipType || '',
    displayOrder: f.displayOrder ?? 0,
    isActive: f.isActive !== false,
    isFeatured: Boolean(f.isFeatured),
  };
}

const AdminFranchiseFormPage = ({ isEdit = false, id: editId }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const id = editId;
  const { currentFranchise, loading, saving } = useSelector((state) => state.franchise);

  const [formData, setFormData] = useState({ ...initialFranchiseFormState });
  const [files, setFiles] = useState({});
  const [openSections, setOpenSections] = useState({ ...INITIAL_OPEN });
  const [activeSection, setActiveSection] = useState('basic');

  const progress = useMemo(() => computeFormProgress(formData, files), [formData, files]);

  useEffect(() => {
    if (isEdit && id && id !== 'new') {
      dispatch(fetchFranchiseById({ id, includeInactive: true }));
    }
    return () => dispatch(clearCurrentFranchise());
  }, [dispatch, isEdit, id]);

  useEffect(() => {
    if (currentFranchise && isEdit) {
      setFormData(franchiseToForm(currentFranchise));
    }
  }, [currentFranchise, isEdit]);

  useEffect(() => {
    const sectionIds = FORM_SECTION_META.map((s) => `franchise-section-${s.key}`);
    const elements = sectionIds
      .map((sid) => document.getElementById(sid))
      .filter(Boolean);

    if (!elements.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target?.id) {
          const key = visible[0].target.id.replace('franchise-section-', '');
          setActiveSection(key);
        }
      },
      { rootMargin: '-20% 0px -55% 0px', threshold: [0, 0.25, 0.5] },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [openSections]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const toggleSupport = (option) => {
    setFormData((prev) => {
      const current = prev.supportProvided || [];
      const next = current.includes(option)
        ? current.filter((o) => o !== option)
        : [...current, option];
      return { ...prev, supportProvided: next };
    });
  };

  const handleFile = (name, fileList, multiple = false) => {
    if (!fileList?.length) return;
    setFiles((prev) => ({
      ...prev,
      [name]: multiple ? Array.from(fileList) : fileList[0],
    }));
  };

  const toggleSection = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const expandAllSections = () => {
    setOpenSections(FORM_SECTION_META.reduce((acc, s) => ({ ...acc, [s.key]: true }), {}));
  };

  const collapseAllSections = () => {
    setOpenSections(FORM_SECTION_META.reduce((acc, s) => ({ ...acc, [s.key]: false }), {}));
  };

  const scrollToSection = (key) => {
    setActiveSection(key);
    setOpenSections((prev) => ({ ...prev, [key]: true }));
    document.getElementById(`franchise-section-${key}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const fillTestData = () => {
    setFormData(getFranchiseTestFormData());
    expandAllSections();
    toast.success('Test data filled');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.franchiseName.trim() || !formData.brandName.trim() || !formData.category) {
      toast.error('Franchise name, brand name, and category are required');
      scrollToSection('basic');
      return;
    }

    const payload = {
      ...formData,
      minInvestment: Number(formData.minInvestment) || 0,
      maxInvestment: Number(formData.maxInvestment) || 0,
      franchiseFee: Number(formData.franchiseFee) || 0,
      royaltyFeePercent: Number(formData.royaltyFeePercent) || 0,
      securityDeposit: Number(formData.securityDeposit) || 0,
      setupCost: Number(formData.setupCost) || 0,
      workingCapital: Number(formData.workingCapital) || 0,
      requiredAreaSqFt: Number(formData.requiredAreaSqFt) || 0,
      avgMonthlyRevenue: Number(formData.avgMonthlyRevenue) || 0,
      yearsOfOperation: Number(formData.yearsOfOperation) || 0,
      existingOutlets: Number(formData.existingOutlets) || 0,
      franchiseUnitsRunning: Number(formData.franchiseUnitsRunning) || 0,
      staffRequired: Number(formData.staffRequired) || 0,
      displayOrder: Number(formData.displayOrder) || 0,
    };

    try {
      if (isEdit && currentFranchise) {
        await dispatch(
          updateFranchise({
            id: currentFranchise.uuid || currentFranchise._id,
            data: payload,
            files,
          }),
        ).unwrap();
        toast.success('Franchise updated');
        dispatch(fetchFranchiseCategories());
      } else {
        await dispatch(createFranchise({ data: payload, files })).unwrap();
        toast.success('Franchise created successfully');
        dispatch(fetchFranchiseCategories());
        navigate('/admin/franchises');
      }
    } catch (err) {
      toast.error(err || 'Failed to save franchise');
    }
  };

  if (isEdit && loading && !currentFranchise) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center py-32 gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7e22ce]" />
          <p className="text-sm text-gray-500">Loading franchise…</p>
        </div>
      </AdminLayout>
    );
  }

  const meta = (key) => FORM_SECTION_META.find((s) => s.key === key);

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 pb-28">
        <FranchiseFormHeader
          isEdit={isEdit}
          progress={progress}
          onExpandAll={expandAllSections}
          onCollapseAll={collapseAllSections}
          onFillTest={fillTestData}
        />

        <FranchiseFormMobileNav
          activeSection={activeSection}
          openSections={openSections}
          onSelect={scrollToSection}
        />

        <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-8 items-start">
          <div className="hidden lg:block">
            <FranchiseFormSidebarNav
              activeSection={activeSection}
              openSections={openSections}
              onSelect={scrollToSection}
              formData={formData}
              files={files}
            />
          </div>

          <form id="franchise-admin-form" onSubmit={handleSubmit} className="space-y-4 min-w-0">
            <FranchiseSectionCard
              id="franchise-section-basic"
              sectionKey="basic"
              title={meta('basic').fullTitle}
              subtitle="Name, brand, category, and descriptions shown on the public site."
              icon={meta('basic').icon}
              open={openSections.basic}
              onToggle={() => toggleSection('basic')}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Franchise name *</label>
                    <input
                      className={inputClass}
                      name="franchiseName"
                      value={formData.franchiseName}
                      onChange={handleChange}
                      placeholder="e.g. Paradise Biryani Franchise"
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Brand / company name *</label>
                    <input
                      className={inputClass}
                      name="brandName"
                      value={formData.brandName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Category *</label>
                    <FranchiseCategorySelect
                      value={formData.category}
                      onChange={(category) => setFormData((prev) => ({ ...prev, category }))}
                      required
                      className={inputClass}
                      inputClassName={inputClass}
                    />
                    <FieldHint>Choose a category or add a custom one under Other.</FieldHint>
                  </div>
                  <div>
                    <label className={labelClass}>Sub category</label>
                    <input
                      className={inputClass}
                      name="subCategory"
                      value={formData.subCategory}
                      onChange={handleChange}
                      placeholder="Biryani, Bakery, etc."
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Short description</label>
                  <textarea
                    className={inputClass}
                    name="shortDescription"
                    value={formData.shortDescription}
                    onChange={handleChange}
                    rows={2}
                    placeholder="2–3 lines for listing cards"
                  />
                </div>
                <div>
                  <label className={labelClass}>Detailed description</label>
                  <textarea
                    className={inputClass}
                    name="detailedDescription"
                    value={formData.detailedDescription}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Full story, model, and value proposition"
                  />
                </div>
              </div>
            </FranchiseSectionCard>

            <FranchiseSectionCard
              id="franchise-section-investment"
              sectionKey="investment"
              title={meta('investment').fullTitle}
              subtitle="Investment range and fees applicants will see upfront."
              icon={meta('investment').icon}
              open={openSections.investment}
              onToggle={() => toggleSection('investment')}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  ['minInvestment', 'Minimum investment (₹)'],
                  ['maxInvestment', 'Maximum investment (₹)'],
                  ['franchiseFee', 'Franchise fee (₹)'],
                  ['royaltyFeePercent', 'Royalty fee (%)'],
                  ['securityDeposit', 'Security deposit (₹)'],
                  ['setupCost', 'Setup cost (₹)'],
                  ['workingCapital', 'Working capital (₹)'],
                ].map(([name, label]) => (
                  <div key={name}>
                    <label className={labelClass}>{label}</label>
                    <input
                      className={inputClass}
                      type="number"
                      name={name}
                      value={formData[name]}
                      onChange={handleChange}
                      min={0}
                    />
                  </div>
                ))}
                <div>
                  <label className={labelClass}>Expected ROI</label>
                  <input
                    className={inputClass}
                    name="expectedRoi"
                    value={formData.expectedRoi}
                    onChange={handleChange}
                    placeholder="e.g. 25–30%"
                  />
                </div>
                <div>
                  <label className={labelClass}>Payback period</label>
                  <input
                    className={inputClass}
                    name="paybackPeriod"
                    value={formData.paybackPeriod}
                    onChange={handleChange}
                    placeholder="12–18 months"
                  />
                </div>
              </div>
            </FranchiseSectionCard>

            <FranchiseSectionCard
              id="franchise-section-space"
              sectionKey="space"
              title={meta('space').fullTitle}
              subtitle="Space and geography requirements for franchisees."
              icon={meta('space').icon}
              open={openSections.space}
              onToggle={() => toggleSection('space')}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Required area (sq ft)</label>
                  <input
                    className={inputClass}
                    type="number"
                    name="requiredAreaSqFt"
                    value={formData.requiredAreaSqFt}
                    onChange={handleChange}
                    min={0}
                  />
                </div>
                <div>
                  <label className={labelClass}>Preferred location type</label>
                  <select
                    className={inputClass}
                    name="preferredLocation"
                    value={formData.preferredLocation}
                    onChange={handleChange}
                  >
                    <option value="">Select</option>
                    {PREFERRED_LOCATIONS.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>City preference</label>
                  <input
                    className={inputClass}
                    name="cityPreference"
                    value={formData.cityPreference}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className={labelClass}>State</label>
                  <input className={inputClass} name="state" value={formData.state} onChange={handleChange} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Country</label>
                  <input className={inputClass} name="country" value={formData.country} onChange={handleChange} />
                </div>
              </div>
            </FranchiseSectionCard>

            <FranchiseSectionCard
              id="franchise-section-performance"
              sectionKey="performance"
              title={meta('performance').fullTitle}
              subtitle="Track record and scale of the brand."
              icon={meta('performance').icon}
              open={openSections.performance}
              onToggle={() => toggleSection('performance')}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  ['avgMonthlyRevenue', 'Avg monthly revenue (₹)', 'number'],
                  ['avgMonthlyProfitMargin', 'Avg profit margin', 'text'],
                  ['breakEvenPeriod', 'Break-even period', 'text'],
                  ['yearsOfOperation', 'Years of operation', 'number'],
                  ['existingOutlets', 'Existing outlets', 'number'],
                  ['franchiseUnitsRunning', 'Franchise units running', 'number'],
                ].map(([name, label, type]) => (
                  <div key={name}>
                    <label className={labelClass}>{label}</label>
                    <input
                      className={inputClass}
                      type={type}
                      name={name}
                      value={formData[name]}
                      onChange={handleChange}
                      min={type === 'number' ? 0 : undefined}
                    />
                  </div>
                ))}
              </div>
            </FranchiseSectionCard>

            <FranchiseSectionCard
              id="franchise-section-support"
              sectionKey="support"
              title={meta('support').fullTitle}
              subtitle="Tap to select all support the brand provides."
              icon={meta('support').icon}
              open={openSections.support}
              onToggle={() => toggleSection('support')}
            >
              <SupportOptionPills
                options={SUPPORT_OPTIONS}
                selected={formData.supportProvided}
                onToggle={toggleSupport}
              />
            </FranchiseSectionCard>

            <FranchiseSectionCard
              id="franchise-section-requirements"
              sectionKey="requirements"
              title={meta('requirements').fullTitle}
              subtitle="Who can apply and what experience is expected."
              icon={meta('requirements').icon}
              open={openSections.requirements}
              onToggle={() => toggleSection('requirements')}
            >
              <div className="space-y-4">
                <label className="flex items-center gap-3 p-3 rounded-lg border bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    name="experienceRequired"
                    checked={formData.experienceRequired}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-[#7e22ce] focus:ring-[#7e22ce]"
                  />
                  <span className="text-sm font-medium text-gray-800">Prior business experience required</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Preferred experience</label>
                    <input
                      className={inputClass}
                      name="preferredExperience"
                      value={formData.preferredExperience}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Minimum qualification</label>
                    <input
                      className={inputClass}
                      name="minQualification"
                      value={formData.minQualification}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Staff required</label>
                    <input
                      className={inputClass}
                      type="number"
                      name="staffRequired"
                      value={formData.staffRequired}
                      onChange={handleChange}
                      min={0}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Ownership type</label>
                    <select
                      className={inputClass}
                      name="ownershipType"
                      value={formData.ownershipType}
                      onChange={handleChange}
                    >
                      <option value="">Select</option>
                      {OWNERSHIP_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </FranchiseSectionCard>

            <FranchiseSectionCard
              id="franchise-section-publishing"
              sectionKey="publishing"
              title={meta('publishing').fullTitle}
              subtitle="Control visibility and sort order on the public franchises page."
              icon={meta('publishing').icon}
              open={openSections.publishing}
              onToggle={() => toggleSection('publishing')}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Display order</label>
                  <input
                    className={inputClass}
                    type="number"
                    name="displayOrder"
                    value={formData.displayOrder}
                    onChange={handleChange}
                    min={0}
                  />
                  <FieldHint>Lower numbers appear first within the same sort.</FieldHint>
                </div>
                <div className="space-y-3 sm:pt-6">
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-green-200 bg-green-50/50 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleChange}
                      className="rounded border-gray-300 text-[#7e22ce] focus:ring-[#7e22ce]"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900 block">Active listing</span>
                      <span className="text-xs text-gray-500">Visible on /franchises</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-amber-200 bg-amber-50/50 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isFeatured"
                      checked={formData.isFeatured}
                      onChange={handleChange}
                      className="rounded border-gray-300 text-[#7e22ce] focus:ring-[#7e22ce]"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900 block">Featured franchise</span>
                      <span className="text-xs text-gray-500">Shows featured badge &amp; filter</span>
                    </div>
                  </label>
                </div>
              </div>
            </FranchiseSectionCard>

            <FranchiseSectionCard
              id="franchise-section-media"
              sectionKey="media"
              title={meta('media').fullTitle}
              subtitle="Logo, banner, gallery, and PDFs (max 10 MB per file)."
              icon={meta('media').icon}
              open={openSections.media}
              onToggle={() => toggleSection('media')}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FranchiseFileUpload
                  label="Franchise logo"
                  hint="Square PNG/JPG recommended"
                  accept="image/*"
                  file={files.logo}
                  onChange={(list) => handleFile('logo', list)}
                  currentUrl={currentFranchise?.logoUrl}
                />
                <FranchiseFileUpload
                  label="Banner image"
                  hint="Wide image for card & detail hero"
                  accept="image/*"
                  file={files.banner}
                  onChange={(list) => handleFile('banner', list)}
                  currentUrl={currentFranchise?.bannerUrl}
                />
                <div className="md:col-span-2">
                  <FranchiseFileUpload
                    label="Gallery images"
                    hint="Up to 10 images"
                    accept="image/*"
                    multiple
                    files={files.gallery}
                    onChange={(list) => handleFile('gallery', list, true)}
                  />
                </div>
                <FranchiseFileUpload
                  label="Brochure (PDF)"
                  accept="application/pdf"
                  file={files.brochure}
                  onChange={(list) => handleFile('brochure', list)}
                />
                <FranchiseFileUpload
                  label="Presentation (PDF)"
                  accept="application/pdf"
                  file={files.presentation}
                  onChange={(list) => handleFile('presentation', list)}
                />
              </div>
            </FranchiseSectionCard>
          </form>
        </div>
      </div>

      <FranchiseFormFooter
        isEdit={isEdit}
        saving={saving}
        onCancel={() => navigate('/admin/franchises')}
      />
    </AdminLayout>
  );
};

export default AdminFranchiseFormPage;
