import PublicPmepgChrome from '../../components/schemeFinder/PublicPmepgChrome';
import ClientScreeningForm from '../../components/forms/clientScreening/ClientScreeningForm';

/** Public client screening intake at `/client-screening`. */
const PublicClientScreeningPage = () => {
  return (
    <PublicPmepgChrome>
      <div className="max-w-3xl mx-auto">
        <ClientScreeningForm supportSource="ui:client-screening-public" />
      </div>
    </PublicPmepgChrome>
  );
};

export default PublicClientScreeningPage;
