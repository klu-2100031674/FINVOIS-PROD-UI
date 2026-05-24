import PublicPmepgChrome from '../../../components/schemeFinder/PublicPmepgChrome';
import ApIdpSectionAForm from '../../../components/forms/scheme/ApIdp';
import { PUBLIC_AP_IDP_SCHEME_MAIL_PATH } from '../../../components/forms/scheme/apIdpSchemeMailConstants';

/**
 * Public AP IDP 4.0 form at `/schemes/ap-idp` (no login, no app sidebar, no footer).
 */
const PublicApIdpFormPage = () => {
  return (
    <PublicPmepgChrome>
      <div className="max-w-4xl mx-auto pb-16">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 font-['Manrope'] mb-4">
          AP IDP 4.0  – Questionnaire for Client Screening & Consultancy
          </h1>
          <p className="text-lg text-gray-600 font-['Inter'] max-w-l mx-auto">
          Instructions for Client: Please answer all questions honestly and completely. 
          This questionnaire is based on the official AP IDP 4.0 guidelines. 
          Your answers will help us quickly check your eligibility, identify gaps, 
          and prepare a tailored consultancy plan for you. Time to complete: 10–15 minutes.
          </p>
        </div>

        <ApIdpSectionAForm schemeMailPath={PUBLIC_AP_IDP_SCHEME_MAIL_PATH} />
      </div>
    </PublicPmepgChrome>
  );
};

export default PublicApIdpFormPage;
