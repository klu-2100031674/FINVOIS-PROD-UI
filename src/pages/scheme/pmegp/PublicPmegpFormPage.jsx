import PublicPmepgChrome from '../../../components/schemeFinder/PublicPmepgChrome';
import PmegpSectionAForm from '../../../components/forms/scheme/Pmegp';
import { PUBLIC_PMEGP_SCHEME_MAIL_PATH } from '../../../components/forms/scheme/pmegpSchemeMailConstants';

/**
 * Public PMEGP form at `/schemes/pmegp` (no login, no app sidebar, no footer).
 */
const PublicPmegpFormPage = () => {
  return (
    <PublicPmepgChrome>
      <div className="max-w-4xl mx-auto pb-16">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 font-['Manrope'] mb-4">
          PMEGP - Questionnaire for Client Screening & Consultancy
          </h1>
          <p className="text-lg text-gray-600 font-['Inter'] max-w-l mx-auto">
          Instructions for Client: Please answer all questions honestly and completely. 
          This questionnaire is based on the official PMEGP guidelines. Your answers will 
          help us quickly check your eligibility, identify gaps/Risks, and prepare a 
          tailored consultancy plan for you. Time to complete: 10–15 minutes. 
          You can fill this digitally or on paper.
          </p>
        </div>

        <PmegpSectionAForm schemeMailPath={PUBLIC_PMEGP_SCHEME_MAIL_PATH} />
      </div>
    </PublicPmepgChrome>
  );
};

export default PublicPmegpFormPage;
