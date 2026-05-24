import { Link } from 'react-router-dom';

/**
 * Scheme-agnostic empty state for AI chat. The scheme provides copy + a form
 * path to send the user to when their form payload is missing.
 *
 * @param {object} props
 * @param {boolean} props.missingForm
 * @param {string}  props.formPath
 * @param {object}  props.copy
 * @param {string}  props.copy.title              e.g. "PMEGP AI Assistance"
 * @param {string}  props.copy.intro              short paragraph below the title
 * @param {string}  props.copy.missingFormMessage shown when the form is missing
 * @param {string}  props.copy.missingFormLinkLabel  link label e.g. "Go to PMEGP Form"
 * @param {string[]} props.copy.exampleQuestions    suggested questions list
 */
const ChatEmptyState = ({ missingForm, formPath, copy }) => {
  const {
    title,
    intro,
    missingFormMessage,
    missingFormLinkLabel,
    exampleQuestions = [],
  } = copy || {};

  return (
    <div className="p-6 sm:p-10">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        <p className="mt-2 text-sm text-gray-600">{intro}</p>

        {missingForm ? (
          <div className="mt-4 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            {missingFormMessage}
            <div className="mt-2">
              <Link to={formPath} className="font-semibold underline">
                {missingFormLinkLabel}
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-4 text-sm text-gray-700">
            Start by asking something like:
            <ul className="list-disc ml-5 mt-2 space-y-1 text-gray-600">
              {exampleQuestions.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatEmptyState;
