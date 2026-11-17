import test from 'node:test';
import assert from 'node:assert/strict';
import {
  indirectScheduleMatches,
  mergeReportPrefill,
  savedOrFallback,
  unlockFieldsPresentInSavedDraft,
  withSavedMeansDefaults,
} from './mergeReportPrefill.js';
import {
  buildEditableDraftSnapshot,
  editableDraftForm,
  readWizardStep,
  searchWithDraftId,
} from './draftLifecycle.js';
import {
  alignCategoryRowSchedule,
  alignNamedCellSchedule,
  countOccupiedCategoryRows,
  keepRowsInActiveWindows,
  preserveFilledAssetRows,
  rowItemIsVisible,
} from './assetScheduleState.js';

test('saved draft blanks replace template defaults when preferSaved is set', () => {
  const defaults = {
    'Prepared By': { j136: 'PARVEZ AND NARAYANA', j139: '9014221011' },
    'General Information': { i7: 'Old Firm' },
  };
  const draft = {
    'Prepared By': { j136: '', j139: '9000000000' },
    'General Information': { i7: 'Edited Firm' },
  };

  const kept = mergeReportPrefill(defaults, draft);
  assert.equal(kept['Prepared By'].j136, 'PARVEZ AND NARAYANA');

  const saved = mergeReportPrefill(defaults, draft, { preferSaved: true });
  assert.equal(saved['Prepared By'].j136, '');
  assert.equal(saved['Prepared By'].j139, '9000000000');
  assert.equal(saved['General Information'].i7, 'Edited Firm');
});

test('lead-style empty arrays do not wipe existing rows unless preferSaved is set', () => {
  const base = { assets: [{ description: 'Lathe', amount: 10 }] };
  const lead = { assets: [] };
  assert.deepEqual(mergeReportPrefill(base, lead).assets, base.assets);
  assert.deepEqual(mergeReportPrefill(base, lead, { preferSaved: true }).assets, []);
});

test('a later edit is not restored from an older draft value inside one merge', () => {
  const current = { 'General Information': { i7: 'Newest' } };
  const olderDraft = { 'General Information': { i7: 'Older' } };
  const merged = mergeReportPrefill(current, olderDraft, { preferSaved: true });
  assert.equal(merged['General Information'].i7, 'Older');
  const keptCurrent = mergeReportPrefill(olderDraft, current, { preferSaved: true });
  assert.equal(keptCurrent['General Information'].i7, 'Newest');
});

test('rebuilt expense schedule does not replace a saved schedule with the same cells', () => {
  const saved = {
    'Administrative & Office Expenses': { d239: 'Office rent', e239: 4500 },
  };
  const rebuilt = {
    'Administrative & Office Expenses': { d239: 'Office rent', e239: 0 },
  };
  const otherLayout = {
    'Administrative & Office Expenses': { d301: 'Office rent', e301: 0 },
  };
  assert.equal(indirectScheduleMatches(saved, rebuilt), true);
  assert.equal(indirectScheduleMatches(saved, otherLayout), false);
  assert.equal(indirectScheduleMatches({}, rebuilt), false);
});

test('saved profile fields are editable after load, including blanks', () => {
  const hidden = {
    firm_constitution: ['firm_name', 'sector'],
    product_details: ['nature_of_business'],
  };
  const prompts = {
    firm_constitution: { firm_name: 'Edited Name', sector: '' },
  };
  const unlocked = unlockFieldsPresentInSavedDraft(hidden, prompts);
  assert.deepEqual(unlocked.firm_constitution, []);
  assert.deepEqual(unlocked.product_details, ['nature_of_business']);
});

test('a saved draft restores the editable copy, not the excel-transformed dates', () => {
  const saved = editableDraftForm({
    'Term Loan Details': { i52: '01-04-2026', i46: '5' },
    rawFormData: { 'Term Loan Details': { i52: '2026-04', i46: '5' }, 'Schedule for Assets': { d136: 'Lathe', e136: 2 } },
    excelData: { i52: '01-04-2026' },
    'Fixed Assets Schedule': { 'Plant and Machinery': { 136: { description: 'Lathe', amount: 2, isActive: true } } },
  });
  assert.equal(saved['Term Loan Details'].i52, '2026-04');
  assert.equal(saved['Schedule for Assets'].d136, 'Lathe');
  assert.equal(saved.excelData, undefined);
  assert.equal(saved['Fixed Assets Schedule']['Plant and Machinery'][136].description, 'Lathe');
});

test('lead prefill without a raw copy is left unchanged', () => {
  const lead = { 'General Information': { i8: 'From lead', i14: 'Manufacturing sector' } };
  assert.deepEqual(editableDraftForm(lead), lead);
  const merged = mergeReportPrefill(
    { 'General Information': { i8: '', i14: 'service sector without stock' } },
    lead,
    { preferSaved: false },
  );
  assert.equal(merged['General Information'].i8, 'From lead');
  assert.equal(merged['General Information'].i14, 'Manufacturing sector');
});

test('draft snapshot keeps the wizard step and drops excel dumps', () => {
  const snapshot = buildEditableDraftSnapshot(
    {
      'General Information': { i8: 'Firm' },
      rawFormData: { 'General Information': { i8: 'Edited' } },
      excelData: { i8: 'Firm' },
    },
    { _wizardStep: 2, 'Asset Loan Percentages': { 'Plant and Machinery': 75 } },
  );
  assert.equal(snapshot['General Information'].i8, 'Edited');
  assert.equal(snapshot._wizardStep, 2);
  assert.equal(snapshot['Asset Loan Percentages']['Plant and Machinery'], 75);
  assert.equal(snapshot.excelData, undefined);
  assert.equal(snapshot.rawFormData, undefined);
});

test('wizard step restores from a draft and stays 0 for a lead', () => {
  assert.equal(readWizardStep({ _wizardStep: 3 }, 7), 3);
  assert.equal(readWizardStep({ _wizardStep: 9 }, 7), 6);
  assert.equal(readWizardStep({ 'General Information': { i8: 'Lead' } }, 7), 0);
});

test('saving a draft keeps lead query params and records the draft id', () => {
  const next = searchWithDraftId('?templateId=TERM_LOAN_CC&msmeLeadId=abc&newDraft=1', 'draft-9');
  const params = new URLSearchParams(next);
  assert.equal(params.get('draftId'), 'draft-9');
  assert.equal(params.get('msmeLeadId'), 'abc');
  assert.equal(params.get('templateId'), 'TERM_LOAN_CC');
  assert.equal(params.get('newDraft'), null);
});

test('plant and machinery rows survive a later empty load and a tenure window change', () => {
  const filled = {
    'Plant and Machinery': {
      136: { description: 'Lathe', amount: 4, isActive: true },
      137: { description: '', amount: '' },
    },
  };
  const emptyReload = {
    'Plant and Machinery': {
      136: { description: '', amount: '' },
      137: { description: '', amount: '' },
    },
  };
  const kept = preserveFilledAssetRows(filled, emptyReload);
  assert.equal(kept['Plant and Machinery'][136].description, 'Lathe');
  assert.equal(rowItemIsVisible(null), false);
  assert.equal(rowItemIsVisible(undefined), false);

  const active = { 'Plant and Machinery': { start: 148, end: 157 } };
  const previous = { 'Plant and Machinery': { start: 136, end: 145 } };
  const moved = alignCategoryRowSchedule(filled, active, previous);
  assert.equal(moved['Plant and Machinery'][148].description, 'Lathe');
  assert.equal(moved['Plant and Machinery'][136], undefined);

  const alreadyThere = alignCategoryRowSchedule(moved, active, previous);
  assert.equal(alreadyThere, moved);

  const staleWindow = {
    'Plant and Machinery': {
      136: { description: '', amount: '' },
      137: { description: '', amount: '', isActive: true },
      145: { description: 'Lathe', amount: 4, isActive: true },
    },
  };
  const activeSection = active['Plant and Machinery'];
  const previousSection = previous['Plant and Machinery'];
  assert.equal(countOccupiedCategoryRows(staleWindow['Plant and Machinery'], activeSection), 0);
  assert.equal(countOccupiedCategoryRows(staleWindow['Plant and Machinery'], previousSection), 2);
  assert.equal(rowItemIsVisible(undefined), false);
  assert.equal(rowItemIsVisible({ description: '', amount: '' }), false);
  const trimmed = keepRowsInActiveWindows(staleWindow, active);
  assert.equal(trimmed['Plant and Machinery'][136], undefined);
  assert.equal(trimmed['Plant and Machinery'][145], undefined);
  assert.deepEqual(trimmed['Plant and Machinery'], {});
});

test('cell asset schedules move into the visible tenure window without duplicating', () => {
  const schedule = { d136: 'Lathe', e136: 4, d148: '', e148: '', _openRows: [136] };
  const active = { 'Plant and Machinery': { start: 148, end: 157 } };
  const previous = { 'Plant and Machinery': { start: 136, end: 145 } };
  const moved = alignNamedCellSchedule(schedule, active, previous);
  assert.equal(moved.d148, 'Lathe');
  assert.equal(moved.e148, 4);
  assert.equal(moved.d136, '');
  assert.deepEqual(moved._openRows, [148]);
  assert.equal(alignNamedCellSchedule(moved, active, previous), moved);
});

test('means-of-finance defaults do not overwrite an explicit saved No', () => {
  assert.equal(savedOrFallback('No', 'Yes'), 'No');
  assert.equal(savedOrFallback('', 'Yes'), 'Yes');
  const means = withSavedMeansDefaults({ i11: 'No', i12: '' }, { i11: 'Yes', i12: 'Yes', i18: 'Yes' });
  assert.deepEqual(means, { i11: 'No', i12: 'Yes', i18: 'Yes' });
});
