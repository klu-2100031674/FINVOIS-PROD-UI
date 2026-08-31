import React, { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Factory,
  FileText,
  ImageUp,
  Landmark,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Users,
  Wallet,
} from 'lucide-react';
import { Button } from '../../common';
import { executiveAPI } from '../../../api/executiveAPI';
import { useExecutiveDraft } from '../../../hooks/useExecutiveDraft';
import {
  BoiFormField,
  BoiMobileStepHeader,
  BoiStickyMobileNav,
  boiInputClass,
  boiTextareaClass,
  cn,
} from './boiFormShared';
import {
  getBoiMsmeEmptyState,
  getBoiMsmeTestData,
  makeTestEvidenceFile,
} from '../../../utils/boiMsmeTestData';

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const MAX_PHOTOS = 12;

const SECTIONS = [
  { key: 'visit', title: 'Report & Visit', icon: Landmark },
  { key: 'borrower', title: 'Borrower', icon: Users },
  { key: 'business', title: 'Background & Business', icon: Building2 },
  { key: 'counterparties', title: 'Assets & Counterparties', icon: Wallet },
  { key: 'financials', title: 'Insurance & Financials', icon: FileText },
  { key: 'banking', title: 'Banking & Activity', icon: ClipboardList },
  { key: 'factory', title: 'Factory & Particulars', icon: Factory },
  { key: 'conclusions', title: 'Property, SWOT & Conclusions', icon: ClipboardList },
  { key: 'photos', title: 'Photos & Sign-off', icon: ImageUp },
];

function emptyRow(keys) {
  return keys.reduce((acc, k) => ({ ...acc, [k]: '' }), {});
}

export default function BoiMsmeVerificationForm() {
  const user = useSelector((s) => s.auth?.user);
  const [form, setForm] = useState(() => getBoiMsmeEmptyState());
  const [photos, setPhotos] = useState([]); // { file, preview, caption }
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const { draftId, savingDraft, loadingDraft, saveDraft } = useExecutiveDraft('boi-msme', {
    onRestore: useCallback(({ form: restoredForm }) => {
      if (restoredForm) {
        setForm((prev) => ({ ...prev, ...restoredForm }));
      }
    }, []),
  });

  const handleSaveDraft = useCallback(() => {
    saveDraft(form, photos.length);
  }, [saveDraft, form, photos.length]);

  const updateField = useCallback((key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateRow = useCallback((listKey, index, field, value) => {
    setForm((prev) => {
      const list = Array.isArray(prev[listKey]) ? [...prev[listKey]] : [];
      list[index] = { ...(list[index] || {}), [field]: value };
      return { ...prev, [listKey]: list };
    });
  }, []);

  const addRow = useCallback((listKey, keys) => {
    setForm((prev) => ({
      ...prev,
      [listKey]: [...(prev[listKey] || []), emptyRow(keys)],
    }));
  }, []);

  const removeRow = useCallback((listKey, index) => {
    setForm((prev) => {
      const list = [...(prev[listKey] || [])];
      if (list.length <= 1) return prev;
      list.splice(index, 1);
      return { ...prev, [listKey]: list };
    });
  }, []);

  const handleFillTestData = () => {
    const data = getBoiMsmeTestData(user);
    const captions = data.photo_captions || [];
    setForm(data);
    const files = captions.map((cap, i) => {
      const file = makeTestEvidenceFile(`msme-site-${i + 1}.png`);
      return {
        file,
        preview: URL.createObjectURL(file),
        caption: cap,
      };
    });
    setPhotos(files);
    toast.success('Test data filled');
  };

  const handlePhotoAdd = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    const next = [...photos];
    for (const file of files) {
      if (next.length >= MAX_PHOTOS) {
        toast.error(`Maximum ${MAX_PHOTOS} photographs allowed`);
        break;
      }
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name}: only images allowed`);
        continue;
      }
      if (file.size > MAX_PHOTO_BYTES) {
        toast.error(`${file.name}: max 5 MB per image`);
        continue;
      }
      next.push({
        file,
        preview: URL.createObjectURL(file),
        caption: '',
      });
    }
    setPhotos(next);
  };

  const updatePhotoCaption = (index, caption) => {
    setPhotos((prev) => prev.map((p, i) => (i === index ? { ...p, caption } : p)));
  };

  const removePhoto = (index) => {
    setPhotos((prev) => {
      const copy = [...prev];
      const [removed] = copy.splice(index, 1);
      if (removed?.preview) URL.revokeObjectURL(removed.preview);
      return copy;
    });
  };

  const validateStep = (stepIndex) => {
    const key = SECTIONS[stepIndex]?.key;
    if (key === 'visit') {
      if (!form.report_date?.trim()) {
        toast.error('Report date is required');
        return false;
      }
      if (!form.bank_name?.trim()) {
        toast.error('Bank name is required');
        return false;
      }
      if (!form.branch_name?.trim()) {
        toast.error('Branch name is required');
        return false;
      }
      if (!form.date_of_visit?.trim()) {
        toast.error('Date of visit is required');
        return false;
      }
    }
    if (key === 'borrower') {
      if (!form.borrower_name_address?.trim()) {
        toast.error("Borrower's name and address is required");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    if (currentStep < SECTIONS.length - 1) {
      setCurrentStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(0) || !validateStep(1)) {
      setCurrentStep(0);
      return;
    }
    setSubmitting(true);
    try {
      const photo_captions = photos.map((p) => p.caption || '');
      const payload = {
        ...form,
        photo_captions,
        photos: photos.map((p, i) => ({
          name: p.file?.name || `photo-${i + 1}.jpg`,
          caption: p.caption || '',
        })),
        executive_name: user?.name || form.auditor_name || '',
      };
      const imageFiles = photos.map((p) => p.file).filter(Boolean);
      await executiveAPI.generateExecutiveReport('boi-msme', payload, imageFiles);
      toast.success('Report submitted for admin approval');
      setForm(getBoiMsmeEmptyState());
      setPhotos([]);
      setCurrentStep(0);
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || 'Failed to generate report');
    } finally {
      setSubmitting(false);
    }
  };

  const DynamicRows = ({ listKey, columns, title }) => {
    const rows = form[listKey] || [];
    const keys = columns.map((c) => c.key);
    return (
      <div className="space-y-3">
        {title && <p className="text-sm font-semibold text-gray-800">{title}</p>}
        {rows.map((row, idx) => (
          <div
            key={`${listKey}-${idx}`}
            className="rounded-xl border border-gray-200 bg-gray-50/60 p-3 sm:p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#7e22ce]">Row {idx + 1}</span>
              <button
                type="button"
                onClick={() => removeRow(listKey, idx)}
                className="text-xs text-red-600 inline-flex items-center gap-1 disabled:opacity-40"
                disabled={rows.length <= 1}
              >
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {columns.map((col) => (
                <BoiFormField
                  key={col.key}
                  label={col.label}
                  className={col.wide ? 'sm:col-span-2' : ''}
                >
                  {col.textarea ? (
                    <textarea
                      rows={2}
                      className={boiTextareaClass}
                      value={row[col.key] || ''}
                      onChange={(e) => updateRow(listKey, idx, col.key, e.target.value)}
                    />
                  ) : (
                    <input
                      className={boiInputClass}
                      value={row[col.key] || ''}
                      onChange={(e) => updateRow(listKey, idx, col.key, e.target.value)}
                    />
                  )}
                </BoiFormField>
              ))}
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => addRow(listKey, keys)}
        >
          <Plus className="h-4 w-4" /> Add row
        </Button>
      </div>
    );
  };

  const CheckNote = ({ checkedKey, noteKey, label }) => (
    <div className="rounded-lg border border-gray-200 p-3 space-y-2">
      <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-800">
        <input
          type="checkbox"
          checked={!!form[checkedKey]}
          onChange={(e) => updateField(checkedKey, e.target.checked)}
          className="rounded border-gray-300 text-[#7e22ce] focus:ring-[#7e22ce]"
        />
        {label}
      </label>
      {form[checkedKey] && (
        <textarea
          rows={2}
          className={boiTextareaClass}
          placeholder="Details / notes"
          value={form[noteKey] || ''}
          onChange={(e) => updateField(noteKey, e.target.value)}
        />
      )}
    </div>
  );

  const renderSection = () => {
    const key = SECTIONS[currentStep]?.key;

    if (key === 'visit') {
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <BoiFormField label="Report Date" required>
            <input className={boiInputClass} value={form.report_date} onChange={(e) => updateField('report_date', e.target.value)} placeholder="DD-MM-YYYY" />
          </BoiFormField>
          <BoiFormField label="Date of Visit" required>
            <input className={boiInputClass} value={form.date_of_visit} onChange={(e) => updateField('date_of_visit', e.target.value)} />
          </BoiFormField>
          <BoiFormField label="Bank Name" required>
            <input className={boiInputClass} value={form.bank_name} onChange={(e) => updateField('bank_name', e.target.value)} />
          </BoiFormField>
          <BoiFormField label="Branch" required>
            <input className={boiInputClass} value={form.branch_name} onChange={(e) => updateField('branch_name', e.target.value)} />
          </BoiFormField>
          <BoiFormField label="Persons Met" className="sm:col-span-2">
            <textarea rows={2} className={boiTextareaClass} value={form.persons_met} onChange={(e) => updateField('persons_met', e.target.value)} />
          </BoiFormField>
          <div className="sm:col-span-2">
            <DynamicRows
              listKey="personnel"
              title="Personnel met (Name / Designation / Years of Service)"
              columns={[
                { key: 'name', label: 'Name' },
                { key: 'designation', label: 'Designation' },
                { key: 'years_of_service', label: 'Years of Service', wide: true },
              ]}
            />
          </div>
        </div>
      );
    }

    if (key === 'borrower') {
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <BoiFormField label="Borrower's Name and Address" required className="sm:col-span-2">
            <textarea rows={3} className={boiTextareaClass} value={form.borrower_name_address} onChange={(e) => updateField('borrower_name_address', e.target.value)} />
          </BoiFormField>
          <BoiFormField label="Telephone (Residence / Office)">
            <input className={boiInputClass} value={form.telephone} onChange={(e) => updateField('telephone', e.target.value)} />
          </BoiFormField>
          <BoiFormField label="Constitution of the Borrower">
            <input className={boiInputClass} value={form.constitution} onChange={(e) => updateField('constitution', e.target.value)} />
          </BoiFormField>
          <BoiFormField label="Electricity" className="sm:col-span-2">
            <textarea rows={2} className={boiTextareaClass} value={form.electricity} onChange={(e) => updateField('electricity', e.target.value)} />
          </BoiFormField>
          <BoiFormField label="Other site(s)" className="sm:col-span-2">
            <textarea rows={2} className={boiTextareaClass} value={form.other_sites} onChange={(e) => updateField('other_sites', e.target.value)} />
          </BoiFormField>
          <BoiFormField label="Trade Licensee" className="sm:col-span-2">
            <textarea rows={3} className={boiTextareaClass} value={form.trade_license} onChange={(e) => updateField('trade_license', e.target.value)} />
          </BoiFormField>
          <div className="sm:col-span-2">
            <DynamicRows
              listKey="partners"
              title="Proprietor / Partners / Directors"
              columns={[
                { key: 'name', label: 'Name', wide: true, textarea: true },
                { key: 'pan', label: 'PAN' },
                { key: 'relationship', label: 'Relationship' },
              ]}
            />
          </div>
          <BoiFormField label="Residential Address" className="sm:col-span-2">
            <textarea rows={2} className={boiTextareaClass} value={form.residential_address} onChange={(e) => updateField('residential_address', e.target.value)} />
          </BoiFormField>
          <BoiFormField label="Family Members">
            <input className={boiInputClass} value={form.family_members} onChange={(e) => updateField('family_members', e.target.value)} />
          </BoiFormField>
          <BoiFormField label="Landmark">
            <input className={boiInputClass} value={form.landmark} onChange={(e) => updateField('landmark', e.target.value)} />
          </BoiFormField>
          <BoiFormField label="Business / Employment Details" className="sm:col-span-2">
            <textarea rows={2} className={boiTextareaClass} value={form.partner_business_details} onChange={(e) => updateField('partner_business_details', e.target.value)} />
          </BoiFormField>
          <BoiFormField label="Email IDs">
            <input className={boiInputClass} value={form.email_ids} onChange={(e) => updateField('email_ids', e.target.value)} />
          </BoiFormField>
          <BoiFormField label="Office Contact Numbers">
            <input className={boiInputClass} value={form.office_contacts} onChange={(e) => updateField('office_contacts', e.target.value)} />
          </BoiFormField>
        </div>
      );
    }

    if (key === 'business') {
      return (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <BoiFormField label="Year of Establishment">
              <input className={boiInputClass} value={form.year_of_establishment} onChange={(e) => updateField('year_of_establishment', e.target.value)} />
            </BoiFormField>
            <BoiFormField label="Any Awards won">
              <input className={boiInputClass} value={form.awards} onChange={(e) => updateField('awards', e.target.value)} />
            </BoiFormField>
            <BoiFormField label="Registrations / Affiliations" className="sm:col-span-2">
              <textarea rows={2} className={boiTextareaClass} value={form.registrations_affiliations} onChange={(e) => updateField('registrations_affiliations', e.target.value)} />
            </BoiFormField>
            <BoiFormField label="Change in Registered Office" className="sm:col-span-2">
              <input className={boiInputClass} value={form.registered_office_change} onChange={(e) => updateField('registered_office_change', e.target.value)} />
            </BoiFormField>
            <BoiFormField label="Legal proceedings" className="sm:col-span-2">
              <textarea rows={2} className={boiTextareaClass} value={form.legal_proceedings} onChange={(e) => updateField('legal_proceedings', e.target.value)} />
            </BoiFormField>
            <BoiFormField label="Disputes, if any" className="sm:col-span-2">
              <textarea rows={2} className={boiTextareaClass} value={form.disputes} onChange={(e) => updateField('disputes', e.target.value)} />
            </BoiFormField>
            <BoiFormField label="Profile (Nature of Activity)" className="sm:col-span-2">
              <textarea rows={2} className={boiTextareaClass} value={form.business_profile} onChange={(e) => updateField('business_profile', e.target.value)} />
            </BoiFormField>
            <BoiFormField label="Products">
              <input className={boiInputClass} value={form.products} onChange={(e) => updateField('products', e.target.value)} />
            </BoiFormField>
            <BoiFormField label="Installed Capacity">
              <input className={boiInputClass} value={form.installed_capacity} onChange={(e) => updateField('installed_capacity', e.target.value)} />
            </BoiFormField>
            <BoiFormField label="No. of Employees" className="sm:col-span-2">
              <input className={boiInputClass} value={form.no_of_employees} onChange={(e) => updateField('no_of_employees', e.target.value)} />
            </BoiFormField>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-2">Details of Fixed Assets</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <CheckNote checkedKey="asset_land_buildings" noteKey="asset_land_buildings_note" label="Land & Buildings" />
              <CheckNote checkedKey="asset_plant_machinery" noteKey="asset_plant_machinery_note" label="Plant & Machinery" />
              <CheckNote checkedKey="asset_furniture" noteKey="asset_furniture_note" label="Furniture & Fixture" />
              <CheckNote checkedKey="asset_other" noteKey="asset_other_note" label="Other Assets" />
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-2">Premises</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <CheckNote checkedKey="premises_owned" noteKey="premises_owned_note" label="Owned" />
              <CheckNote checkedKey="premises_leased" noteKey="premises_leased_note" label="Leased (state monthly rent)" />
            </div>
          </div>
          <DynamicRows
            listKey="banking_relationships"
            title="Present Banking Relationship"
            columns={[
              { key: 'bank', label: 'Bank', wide: true },
              { key: 'facility', label: 'Nature of Credit Facility', wide: true },
              { key: 'sanctioned', label: 'Sanctioned Loan Amount' },
              { key: 'outstanding', label: 'Outstanding Balance' },
              { key: 'emi', label: 'EMI' },
            ]}
          />
        </div>
      );
    }

    if (key === 'counterparties') {
      return (
        <div className="space-y-5">
          <DynamicRows
            listKey="personal_assets"
            title="4. Personal Assets of Proprietor / Partners / Directors"
            columns={[
              { key: 'name', label: 'Name' },
              { key: 'amount', label: 'Amount (Rs. in lakh)' },
              { key: 'description', label: 'Description of Assets', wide: true, textarea: true },
              { key: 'offered_as_security', label: 'Whether offered as Security', wide: true, textarea: true },
            ]}
          />
          <DynamicRows
            listKey="clients"
            title="5. Details of Clients (Major Customers)"
            columns={[
              { key: 'name_contact', label: 'Name & contact numbers', wide: true, textarea: true },
              { key: 'location', label: 'Location' },
              { key: 'relationship_years', label: 'Relationship (years)' },
              { key: 'credit_period', label: 'Credit Period Allowed' },
            ]}
          />
          <BoiFormField label="Quality of Debts">
            <textarea rows={2} className={boiTextareaClass} value={form.quality_of_debts} onChange={(e) => updateField('quality_of_debts', e.target.value)} />
          </BoiFormField>
          <DynamicRows
            listKey="suppliers"
            title="6. Details of Suppliers"
            columns={[
              { key: 'name_contact', label: 'Name & contact numbers', wide: true, textarea: true },
              { key: 'location', label: 'Location' },
              { key: 'relationship_years', label: 'Relationship (years)' },
              { key: 'credit_period', label: 'Credit Period Allowed' },
            ]}
          />
          <BoiFormField label="Payment Track Record">
            <textarea rows={2} className={boiTextareaClass} value={form.payment_track_record} onChange={(e) => updateField('payment_track_record', e.target.value)} />
          </BoiFormField>
          <DynamicRows
            listKey="associates"
            title="7. Associate / Group Concerns"
            columns={[
              { key: 'name', label: 'Name', wide: true },
              { key: 'nature', label: 'Nature of Activity' },
              { key: 'bankers', label: 'Bankers' },
            ]}
          />
        </div>
      );
    }

    if (key === 'financials') {
      return (
        <div className="space-y-5">
          <BoiFormField label="Unit's Assets Covered (Insurance)">
            <textarea rows={2} className={boiTextareaClass} value={form.insurance_assets_covered} onChange={(e) => updateField('insurance_assets_covered', e.target.value)} />
          </BoiFormField>
          <DynamicRows
            listKey="insurance_policies"
            title="Insurance Policies"
            columns={[
              { key: 'policy_no', label: 'Policy No. / Cover Note' },
              { key: 'validity', label: 'Validity' },
              { key: 'sum_assured', label: 'Sum Assured' },
              { key: 'risk_covered', label: 'Risk Covered' },
            ]}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ['last_financial_statement', 'Last available financial statement'],
              ['recent_summary_financials', 'Recent summary financials'],
              ['advance_taxes', 'Advance Taxes Paid'],
              ['change_in_borrowings', 'Change in borrowings'],
              ['debtors_position', 'Debtors Position'],
              ['creditors_position', 'Creditors Position'],
              ['stock_position', 'Stock Position'],
              ['drawing_power', 'Drawing Power'],
              ['other_material_development', 'Any other material development'],
            ].map(([k, label]) => (
              <BoiFormField key={k} label={label} className="sm:col-span-2">
                <textarea rows={2} className={boiTextareaClass} value={form[k]} onChange={(e) => updateField(k, e.target.value)} />
              </BoiFormField>
            ))}
          </div>
          <p className="text-sm font-semibold text-gray-800">Critical Ratios</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['current_ratio', 'Current Ratio'],
              ['debt_equity_ratio', 'Debt-Equity Ratio'],
              ['dscr', 'DSCR'],
              ['tol_tnw', 'TOL / TNW'],
            ].map(([k, label]) => (
              <BoiFormField key={k} label={label}>
                <input className={boiInputClass} value={form[k]} onChange={(e) => updateField(k, e.target.value)} />
              </BoiFormField>
            ))}
          </div>
        </div>
      );
    }

    if (key === 'banking') {
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <BoiFormField label="10. Other Business Interests of Promoters" className="sm:col-span-2">
            <textarea rows={2} className={boiTextareaClass} value={form.other_business_interests} onChange={(e) => updateField('other_business_interests', e.target.value)} />
          </BoiFormField>
          {[
            ['bank_credits_debits', 'Number of Credit / Debits, month-wise'],
            ['bank_month_credits', 'Month-wise Credits into the Account'],
            ['cheque_bounces', 'Cheque bounces'],
            ['debt_servicing_evidence', 'Evidence of servicing existing debt'],
            ['line_utilisation', 'Line Utilisation'],
            ['statutory_dues', 'Statutory dues paid on time'],
            ['pf_employee', 'PF and employee related'],
            ['municipal_taxes', 'Municipal and Corporation Taxes'],
            ['utility_payments', 'Last utility payment made'],
            ['employees_observed', 'Number of Employees observed'],
            ['activity_level', 'Level of Activity'],
          ].map(([k, label]) => (
            <BoiFormField key={k} label={label} className="sm:col-span-2">
              <textarea rows={2} className={boiTextareaClass} value={form[k]} onChange={(e) => updateField(k, e.target.value)} />
            </BoiFormField>
          ))}
        </div>
      );
    }

    if (key === 'factory') {
      return (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ['factory_location', 'Location of Plot / accessibility'],
              ['raw_materials', 'Principal raw material(s) and sources'],
              ['manufacturing_process', 'Manufacturing Process'],
              ['machines', 'Major branded / imported machines'],
              ['pollution_control', 'Pollution Control'],
              ['pcb_permission', 'PCB Permission'],
              ['power', 'Power: Connected load / backup'],
              ['inventory', 'Inventory / WIP / Finished Goods'],
              ['storage_security', 'Storage / Security / Perishability'],
              ['quality_certification', 'Quality Certification'],
              ['workers', 'Workers / Unions'],
              ['labour_history', 'Strikes / child labour / conditions'],
            ].map(([k, label]) => (
              <BoiFormField key={k} label={label} className="sm:col-span-2">
                <textarea rows={2} className={boiTextareaClass} value={form[k]} onChange={(e) => updateField(k, e.target.value)} />
              </BoiFormField>
            ))}
          </div>
          <DynamicRows
            listKey="purchases_sales"
            title="14. Other Particulars — Purchases / Sales"
            columns={[
              { key: 'month', label: 'Month' },
              { key: 'purchases', label: 'Purchases' },
              { key: 'sales', label: 'Sales' },
            ]}
          />
          <BoiFormField label="Documents Verified">
            <textarea rows={2} className={boiTextareaClass} value={form.documents_verified} onChange={(e) => updateField('documents_verified', e.target.value)} />
          </BoiFormField>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ['record_balance_sheets', 'Balance Sheets and schedules'],
              ['record_pl', 'P&L statements and schedules'],
              ['record_computation', 'Computation of income'],
              ['record_itr', 'Income Tax Return'],
              ['record_photo_id', 'Photo Identification'],
              ['roc_summary', 'Summary of ROC Search Report'],
            ].map(([k, label]) => (
              <BoiFormField key={k} label={label} className="sm:col-span-2">
                <textarea rows={2} className={boiTextareaClass} value={form[k]} onChange={(e) => updateField(k, e.target.value)} />
              </BoiFormField>
            ))}
          </div>
          <DynamicRows
            listKey="roc_partners"
            title="ROC — Partners (in lieu of Directors)"
            columns={[
              { key: 'name_designation', label: 'Name & Designation', wide: true },
              { key: 'address', label: 'Address', wide: true },
              { key: 'appointment_date', label: 'Date of Appointment' },
              { key: 'cessation_date', label: 'Date of Cessation' },
            ]}
          />
        </div>
      );
    }

    if (key === 'conclusions') {
      return (
        <div className="space-y-5">
          <p className="text-sm font-semibold text-gray-800">16. Property Proposed to be Mortgaged</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ['property_identifier', 'a) Person who identified the property'],
              ['property_visit_date', 'b) Date of visit to the spot'],
              ['property_title_verified', 'c) Title Deeds / Tax Receipts verified'],
              ['property_others', 'd) Others'],
              ['property_valuation', 'e) Property details as per Valuation Report'],
              ['property_cgtmse', 'f) CC limit under CGTMSE'],
            ].map(([k, label]) => (
              <BoiFormField key={k} label={label} className="sm:col-span-2">
                <textarea rows={2} className={boiTextareaClass} value={form[k]} onChange={(e) => updateField(k, e.target.value)} />
              </BoiFormField>
            ))}
          </div>
          <p className="text-sm font-semibold text-gray-800">17. SWOT Analysis</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ['swot_strengths', 'Strengths'],
              ['swot_weakness', 'Weakness'],
              ['swot_opportunities', 'Opportunities'],
              ['swot_threat', 'Threat'],
            ].map(([k, label]) => (
              <BoiFormField key={k} label={label}>
                <textarea rows={3} className={boiTextareaClass} value={form[k]} onChange={(e) => updateField(k, e.target.value)} />
              </BoiFormField>
            ))}
          </div>
          <p className="text-sm font-semibold text-gray-800">18. Concluding Remarks</p>
          <div className="grid gap-4">
            {[
              ['conclusion_kyc', 'Constitution & KYC'],
              ['conclusion_financial', 'Financial Performance'],
              ['conclusion_banking', 'Banking Conduct'],
              ['conclusion_collateral', 'Collateral'],
              ['conclusion_overall', 'Overall'],
            ].map(([k, label]) => (
              <BoiFormField key={k} label={label}>
                <textarea rows={3} className={boiTextareaClass} value={form[k]} onChange={(e) => updateField(k, e.target.value)} />
              </BoiFormField>
            ))}
          </div>
        </div>
      );
    }

    if (key === 'photos') {
      return (
        <div className="space-y-5">
          <div className="rounded-xl border border-dashed border-purple-300 bg-purple-50/40 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">Annexure — Site Visit Photographs</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Up to {MAX_PHOTOS} images · max 5 MB each · jpeg / png / webp
                </p>
              </div>
              <label className="inline-flex">
                <span className="cursor-pointer rounded-lg bg-purple-600 px-3 py-2 text-xs font-semibold text-white hover:bg-purple-700">
                  Upload images
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/*"
                  multiple
                  className="hidden"
                  onChange={handlePhotoAdd}
                />
              </label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos.map((p, idx) => (
                <div key={idx} className="rounded-lg border border-gray-200 bg-white p-2 space-y-2">
                  <div className="aspect-square overflow-hidden rounded-md bg-gray-100">
                    <img src={p.preview} alt="" className="h-full w-full object-cover" />
                  </div>
                  <input
                    className={cn(boiInputClass, 'text-xs py-1.5')}
                    placeholder="Caption"
                    value={p.caption}
                    onChange={(e) => updatePhotoCaption(idx, e.target.value)}
                  />
                  <button
                    type="button"
                    className="text-xs text-red-600 inline-flex items-center gap-1"
                    onClick={() => removePhoto(idx)}
                  >
                    <Trash2 className="h-3 w-3" /> Remove
                  </button>
                </div>
              ))}
            </div>
            {!photos.length && (
              <p className="text-xs text-gray-500 text-center py-4">No photographs uploaded yet (optional).</p>
            )}
          </div>
          <BoiFormField label="Attestation text">
            <textarea rows={3} className={boiTextareaClass} value={form.attestation_text} onChange={(e) => updateField('attestation_text', e.target.value)} />
          </BoiFormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <BoiFormField label="Due Diligence Audit By">
              <input className={boiInputClass} value={form.auditor_name} onChange={(e) => updateField('auditor_name', e.target.value)} />
            </BoiFormField>
            <BoiFormField label="Date">
              <input className={boiInputClass} value={form.auditor_date} onChange={(e) => updateField('auditor_date', e.target.value)} placeholder="DD-MM-YYYY" />
            </BoiFormField>
            <BoiFormField label="Name (display)" className="sm:col-span-2">
              <input className={boiInputClass} value={form.auditor_display_name} onChange={(e) => updateField('auditor_display_name', e.target.value)} />
            </BoiFormField>
          </div>
        </div>
      );
    }

    return null;
  };

  const section = SECTIONS[currentStep];
  const Icon = section.icon;
  const progress = Math.round(((currentStep + 1) / SECTIONS.length) * 100);

  return (
    <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 pb-24 relative px-1">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Landmark className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
            BOI MSME
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Due Diligence Report for MSME Proposals — multi-section form, admin approval on submit.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSaveDraft}
            disabled={savingDraft || submitting}
            className="gap-1.5 h-10 border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            {savingDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {savingDraft ? 'Saving…' : 'Save Draft'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleFillTestData}
            className="gap-1.5 h-10 border-purple-200 bg-purple-50 text-[#7e22ce] hover:bg-purple-100"
          >
            <Sparkles className="h-4 w-4" />
            Fill Test Data
          </Button>
        </div>
      </div>

      <BoiMobileStepHeader icon={Icon} title={section.title} stepIndex={currentStep} stepCount={SECTIONS.length} />

      <div className="hidden sm:block bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
        <div className="flex justify-between items-center text-xs font-semibold text-gray-700">
          <span className="flex items-center gap-1 bg-purple-50 text-[#7e22ce] px-2.5 py-1 rounded-full text-[11px] font-bold">
            Step {currentStep + 1} of {SECTIONS.length}
          </span>
          <span className="text-gray-500 font-medium">{progress}% Complete</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden border border-gray-200/50">
          <div className="bg-purple-600 h-2 rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="hidden sm:block overflow-x-auto custom-scrollbar pb-2">
        <div className="flex gap-2 min-w-max">
          {SECTIONS.map((s, index) => {
            const SIcon = s.icon;
            const isCurrent = index === currentStep;
            const isCompleted = index < currentStep;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => {
                  if (index < currentStep || validateStep(currentStep)) setCurrentStep(index);
                }}
                className={cn(
                  'px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 whitespace-nowrap flex items-center gap-2 border',
                  isCurrent
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                    : isCompleted
                      ? 'bg-purple-50 text-[#7e22ce] border-purple-200'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-purple-200'
                )}
              >
                <SIcon className="h-3.5 w-3.5" />
                {s.title}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6">
        <div className="hidden sm:flex items-center gap-2 mb-4">
          <Icon className="w-5 h-5 text-purple-600" />
          <h2 className="text-base font-bold text-gray-900">{section.title}</h2>
        </div>
        {renderSection()}
      </div>

      <div className="hidden sm:flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0 || submitting}
          className="gap-1.5 h-10"
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveDraft}
            disabled={savingDraft || submitting}
            className="gap-1.5 h-10 border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            {savingDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {savingDraft ? 'Saving…' : 'Save Draft'}
          </Button>
          {currentStep === SECTIONS.length - 1 ? (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="gap-1.5 h-10 bg-purple-600 hover:bg-purple-700 text-white font-semibold"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Submit for Approval
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleNext}
              disabled={submitting}
              className="gap-1.5 h-10 bg-purple-600 hover:bg-purple-700 text-white font-semibold"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <BoiStickyMobileNav
        onPrevious={handlePrevious}
        onNext={handleNext}
        onSaveDraft={handleSaveDraft}
        onSubmit={handleSubmit}
        isFirstStep={currentStep === 0}
        isLastStep={currentStep === SECTIONS.length - 1}
        savingDraft={savingDraft}
        busy={submitting}
      />

      {submitting && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center z-50 text-white gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-purple-400" />
          <p className="text-sm font-semibold">Generating PDF & submitting for admin approval...</p>
        </div>
      )}
    </div>
  );
}
