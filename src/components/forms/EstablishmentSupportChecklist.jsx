import EstablishmentStagePicker from './EstablishmentStagePicker';
import { topicsForStage } from '../../constants/establishmentSupportTopics';

/**
 * Pre/Post-Establishment cards + topic checkboxes for scheme support pages.
 */
const EstablishmentSupportChecklist = ({
  stage,
  onStageChange,
  selected,
  onToggle,
  heading = 'What do you need help with?',
}) => {
  const options = topicsForStage(stage);

  return (
    <div className="space-y-6">
      <EstablishmentStagePicker value={stage} onChange={onStageChange} />
      {stage ? (
        <div>
          <p className="mb-4 text-base font-semibold text-gray-900">{heading}</p>
          <div className="space-y-3">
            {options.map((opt) => (
              <label
                key={opt.id}
                className={`flex cursor-pointer select-none items-start gap-3 rounded-lg border p-3 transition ${
                  selected[opt.id]
                    ? 'border-purple-300 bg-purple-50'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  checked={!!selected[opt.id]}
                  onChange={() => onToggle(opt.id)}
                />
                <span className="text-sm leading-snug text-gray-800">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default EstablishmentSupportChecklist;
