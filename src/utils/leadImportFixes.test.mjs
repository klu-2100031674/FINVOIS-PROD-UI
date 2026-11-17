import test from 'node:test';
import assert from 'node:assert/strict';
import { mapMsmeLeadToReportInitialData } from './msmeDprToReportMapper.js';
import { finishMeansOfFinance } from './mergeReportPrefill.js';

test('a generic service lead on term loan plus working capital uses service with stock', () => {
  const result = mapMsmeLeadToReportInitialData({ sector: 'Service', applicantName: 'A' }, 'TERM_LOAN_CC');
  assert.equal(result.initialData['General Information'].i14, 'service sector with stock');
});

test('gold loan import copies village, mandal, and district into the business address', () => {
  const result = mapMsmeLeadToReportInitialData({
    applicantName: 'A',
    villageCity: 'Tenali',
    mandal: 'Tenali',
    district: 'Guntur',
  }, 'GOLD_LOAN');
  assert.equal(result.initialData['General Information'].i7, 'Tenali, Tenali, Guntur');
});

test('switching the cash credit template keeps the customer yes and no answers', () => {
  const result = mapMsmeLeadToReportInitialData({
    applicantName: 'A',
    wcOdTypeChart: {
      hasWorkingCapitalLimitPresent: 'No',
      alsoNewTermLoanForAsset: '',
      wcLimitTopup: '',
    },
  }, 'frcc6');
  const means = finishMeansOfFinance(
    { i11: 'Yes', i12: 'No', h17: 'Yes' },
    result.initialData,
    { i11: 'Yes', i12: 'No', h17: 'Yes' },
  );
  assert.equal(means.i11, 'No');
  assert.equal(means.i12, '');
  assert.equal(means.h17, '');
  assert.equal(result.initialData.meansFromCustomerChart, true);
});
