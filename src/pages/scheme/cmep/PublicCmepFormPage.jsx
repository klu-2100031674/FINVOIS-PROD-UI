import PublicPmepgChrome from '../../../components/schemeFinder/PublicPmepgChrome';
import CmepSectionAForm from '../../../components/forms/scheme/Cmep';
import { PUBLIC_CMEP_SCHEME_MAIL_PATH } from '../../../components/forms/scheme/cmepSchemeMailConstants';

const PublicCmepFormPage = () => {
  return (
    <PublicPmepgChrome>
      <div className="max-w-4xl mx-auto pb-16">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 font-['Manrope'] mb-4">
            CMEP - Questionnaire for Client Screening &amp; Consultancy
          </h1>
          <p className="text-lg text-gray-600 font-['Inter'] max-w-l mx-auto">
            Instructions for Client: Please answer all questions honestly and completely. This
            questionnaire is based on the official CMEP guidelines. Your answers will help us quickly
            check your eligibility, identify gaps/Risks, and prepare a tailored consultancy plan for
            you. Time to complete: 10–15 minutes. You can fill this digitally or on paper.
          </p>
        </div>

        <CmepSectionAForm schemeMailPath={PUBLIC_CMEP_SCHEME_MAIL_PATH} />
      </div>
    </PublicPmepgChrome>
  );
};

export default PublicCmepFormPage;
