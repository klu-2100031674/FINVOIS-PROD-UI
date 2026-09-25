/**
 * Shared General Information fields for Theory Page generation.
 * Extend this module when a theory template needs extra inputs
 * (do not create template-specific input pages).
 */

import React from 'react';

export const THEORY_GI_DEFAULT = {
  i7: '',
  i8: '',
  i9: '',
  i10: '',
  i11: '',
  i12: '',
  i13: '',
  i14: '',
  i15: '',
  i16: '',
  residential_address: '',
  i17: '',
  i18: '',
  i19: '',
  i20: '',
  i21: '',
  i22: '',
  bank_name: '',
  branch_name: '',
};

const inputClass =
  'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all bg-white';

const Field = ({ label, required, children }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-semibold text-gray-800">
      {label}
      {required ? ' *' : ''}
    </label>
    {children}
  </div>
);

/**
 * @param {{ value: object, onChange: (key: string, value: string) => void, lockSector?: boolean }} props
 */
const TheoryGeneralInformationForm = ({ value = {}, onChange, lockSector = false }) => {
  const gi = { ...THEORY_GI_DEFAULT, ...value };
  const set = (key, v) => onChange(key, v);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Status of Concern">
          <select
            value={gi.i7}
            onChange={(e) => set('i7', e.target.value)}
            className={inputClass}
          >
            <option value="">Select Status</option>
            <option value="Sole Proprietorship">Sole Proprietorship</option>
            <option value="Partnership Firm">Partnership Firm</option>
            <option value="Private limited Company">Private limited Company</option>
            <option value="LLP">LLP</option>
            <option value="Society">Society</option>
            <option value="Trust">Trust</option>
            <option value="Federation">Federation</option>
          </select>
        </Field>
        <Field label="Name of Authorised Person" required>
          <input
            type="text"
            value={gi.i8}
            onChange={(e) => set('i8', e.target.value)}
            className={inputClass}
            placeholder="Enter name"
          />
        </Field>
        <Field label="Mobile Number">
          <input
            type="tel"
            value={gi.i9}
            onChange={(e) => set('i9', e.target.value)}
            className={inputClass}
            placeholder="Enter mobile number"
          />
        </Field>
        <Field label="Aadhar Number (Optional)">
          <input
            type="text"
            value={gi.i10}
            onChange={(e) => set('i10', e.target.value)}
            className={inputClass}
            placeholder="Enter Aadhar number"
          />
        </Field>
        <Field label="PAN of proprietor / Managing Partner / MD">
          <input
            type="text"
            value={gi.i11}
            onChange={(e) => set('i11', e.target.value)}
            className={inputClass}
            placeholder="Enter PAN"
          />
        </Field>
        <Field label="Age">
          <input
            type="text"
            value={gi.i12}
            onChange={(e) => set('i12', e.target.value)}
            className={inputClass}
            placeholder="Enter age"
          />
        </Field>
        <Field label="Gender">
          <select value={gi.i13} onChange={(e) => set('i13', e.target.value)} className={inputClass}>
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </Field>
        <Field label="Sector" required>
          <select
            value={gi.i14}
            onChange={(e) => set('i14', e.target.value)}
            className={inputClass}
          >
            <option value="">Select Sector</option>
            <option value="Manufacturing">Manufacturing</option>
            <option value="Trading">Trading</option>
            <option value="Service">Service</option>
            <option value="Service with Stock">Service with Stock</option>
            <option value="Service without Stock">Service without Stock</option>
          </select>
        </Field>
        <Field label="Nature of Business" required>
          <input
            type="text"
            value={gi.i15}
            onChange={(e) => set('i15', e.target.value)}
            className={inputClass}
            placeholder="Nature of business"
          />
        </Field>
        <Field label="Address of office/Factory">
          <textarea
            value={gi.i16}
            onChange={(e) => set('i16', e.target.value)}
            className={inputClass}
            rows={2}
            placeholder="Business address"
          />
        </Field>
        <Field label="Residential Address">
          <textarea
            value={gi.residential_address}
            onChange={(e) => set('residential_address', e.target.value)}
            className={inputClass}
            rows={2}
            placeholder="Residential address"
          />
        </Field>
        <Field label="Name of firm/Company" required>
          <input
            type="text"
            value={gi.i17}
            onChange={(e) => set('i17', e.target.value)}
            className={inputClass}
            placeholder="Firm / Company name"
          />
        </Field>
        <Field label="PAN of firm/Company">
          <input
            type="text"
            value={gi.i18}
            onChange={(e) => set('i18', e.target.value)}
            className={inputClass}
            placeholder="Firm PAN"
          />
        </Field>
        <Field label="Education Qualification">
          <input
            type="text"
            value={gi.i19}
            onChange={(e) => set('i19', e.target.value)}
            className={inputClass}
            placeholder="Qualification"
          />
        </Field>
        <Field label="Project covered under which Scheme">
          <input
            type="text"
            value={gi.i20}
            onChange={(e) => set('i20', e.target.value)}
            className={inputClass}
            placeholder="Scheme name"
          />
        </Field>
        <Field label="Caste">
          <input
            type="text"
            value={gi.i21}
            onChange={(e) => set('i21', e.target.value)}
            className={inputClass}
            placeholder="Caste / Category"
          />
        </Field>
        <Field label="Unit location">
          <input
            type="text"
            value={gi.i22}
            onChange={(e) => set('i22', e.target.value)}
            className={inputClass}
            placeholder="Unit location"
          />
        </Field>
        <Field label="Bank / Prepared By">
          <input
            type="text"
            value={gi.bank_name}
            onChange={(e) => set('bank_name', e.target.value)}
            className={inputClass}
            placeholder="Bank name"
          />
        </Field>
        <Field label="Branch Name">
          <input
            type="text"
            value={gi.branch_name}
            onChange={(e) => set('branch_name', e.target.value)}
            className={inputClass}
            placeholder="Branch name"
          />
        </Field>
      </div>
    </div>
  );
};

export default TheoryGeneralInformationForm;
