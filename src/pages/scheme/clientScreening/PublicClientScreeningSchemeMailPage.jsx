import PublicPmepgChrome from '../../../components/schemeFinder/PublicPmepgChrome';
import ClientScreeningSchemeMailForm from '../../../components/forms/scheme/ClientScreeningSchemeMailForm';

/** Public client screening — mail-only page (no application wizard). */
const PublicClientScreeningSchemeMailPage = () => {
  return (
    <PublicPmepgChrome>
      <div className="max-w-3xl mx-auto">
        <ClientScreeningSchemeMailForm supportSource="ui:client-screening-public" />
      </div>
    </PublicPmepgChrome>
  );
};

export default PublicClientScreeningSchemeMailPage;
