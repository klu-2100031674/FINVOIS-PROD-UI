import { ESTABLISHMENT_STAGES } from '../../constants/establishmentSupportTopics';

/**
 * Two-card picker matching the generate DPR / CMA selection cards.
 */
const EstablishmentStagePicker = ({ value, onChange, required = true }) => {
  return (
    <div className="space-y-2.5">
      <p className="block text-sm font-semibold text-gray-800">
        Stage of establishment {required ? <span className="text-red-600">*</span> : null}
      </p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {ESTABLISHMENT_STAGES.map((stage) => {
          const selected = value === stage.id;
          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => onChange(stage.id)}
              className={`flex w-full flex-col items-start rounded-xl border-2 bg-gray-50 p-6 text-left transition-all duration-200 group ${
                selected
                  ? 'border-purple-500 bg-purple-50 shadow-sm'
                  : 'border-transparent hover:border-purple-200 hover:bg-purple-50'
              }`}
            >
              <h3
                className={`mb-1 text-lg font-bold ${
                  selected ? 'text-purple-800' : 'text-gray-900 group-hover:text-purple-700'
                }`}
              >
                {stage.title}
              </h3>
              <p className="text-sm leading-relaxed text-gray-500 group-hover:text-gray-600">
                {stage.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default EstablishmentStagePicker;
