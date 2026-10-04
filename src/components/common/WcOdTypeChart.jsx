import {
  applyWcOdChartAnswer,
  emptyWcOdTypeChartAnswers,
} from '@/utils/wcOdTypeChart';

function YesNoChoice({ name, value, label, yesLabel, noLabel, onChange }) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-800 mb-2">
        {label}
        <span className="text-red-500 ml-0.5">*</span>
      </p>
      <div className="flex gap-3">
        {['Yes', 'No'].map((opt) => {
          const selected = value === opt;
          return (
            <label
              key={opt}
              className={`flex-1 cursor-pointer rounded-xl border px-4 py-2.5 text-center text-sm font-semibold transition-all ${
                selected
                  ? 'border-orange-500 bg-orange-50 text-orange-800 ring-2 ring-orange-200'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-orange-300'
              }`}
            >
              <input
                type="radio"
                name={name}
                value={opt}
                checked={selected}
                onChange={() => onChange(opt)}
                className="sr-only"
              />
              {opt === 'Yes' ? yesLabel : noLabel}
            </label>
          );
        })}
      </div>
    </div>
  );
}

export default function WcOdTypeChart({ answers, onChange, copy }) {
  const chart = { ...emptyWcOdTypeChartAnswers(), ...(answers || {}) };
  const yesLabel = copy.typeChartYes || 'Yes';
  const noLabel = copy.typeChartNo || 'No';

  const setAnswer = (field, value) => {
    onChange(applyWcOdChartAnswer(chart, field, value));
  };

  const hasLimit = chart.hasWorkingCapitalLimitPresent;

  return (
    <div className="border rounded-2xl p-4 sm:p-5 border-gray-200 bg-gray-50/60 space-y-4">
      <YesNoChoice
        name="wcOd_hasWorkingCapitalLimitPresent"
        value={chart.hasWorkingCapitalLimitPresent}
        label={copy.typeChartQ1}
        yesLabel={yesLabel}
        noLabel={noLabel}
        onChange={(value) => setAnswer('hasWorkingCapitalLimitPresent', value)}
      />

      {hasLimit === 'Yes' && (
        <YesNoChoice
          name="wcOd_alsoNewTermLoanForAsset"
          value={chart.alsoNewTermLoanForAsset}
          label={copy.typeChartQ2}
          yesLabel={yesLabel}
          noLabel={noLabel}
          onChange={(value) => setAnswer('alsoNewTermLoanForAsset', value)}
        />
      )}

      {hasLimit === 'Yes' && chart.alsoNewTermLoanForAsset && (
        <YesNoChoice
          name="wcOd_wcLimitTopup"
          value={chart.wcLimitTopup}
          label={copy.typeChartQ3}
          yesLabel={yesLabel}
          noLabel={noLabel}
          onChange={(value) => setAnswer('wcLimitTopup', value)}
        />
      )}

      {hasLimit === 'No' && (
        <YesNoChoice
          name="wcOd_hasAuditedLastFy"
          value={chart.hasAuditedLastFy}
          label={copy.typeChartQ4}
          yesLabel={yesLabel}
          noLabel={noLabel}
          onChange={(value) => setAnswer('hasAuditedLastFy', value)}
        />
      )}

      {hasLimit === 'No' && chart.hasAuditedLastFy && (
        <YesNoChoice
          name="wcOd_hasProvisionalCurrentFy"
          value={chart.hasProvisionalCurrentFy}
          label={copy.typeChartQ5}
          yesLabel={yesLabel}
          noLabel={noLabel}
          onChange={(value) => setAnswer('hasProvisionalCurrentFy', value)}
        />
      )}
    </div>
  );
}
