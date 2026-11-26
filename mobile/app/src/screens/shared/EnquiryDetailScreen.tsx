import { Linking, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { MessageCircle, Phone } from 'lucide-react-native';
import { ErrorState } from '~/components/ErrorState';
import { ScreenHeader } from '~/components/ScreenHeader';
import { Button } from '~/components/ui/button';
import { Skeleton } from '~/components/ui/skeleton';
import { Text } from '~/components/ui/text';
import { enquiryKeys, getEnquiry } from '~/api/enquiries';
import type { RootStackParamList } from '~/navigation/types';
import { telUrl, whatsappUrl } from '~/utils/agentRequest';
import { apiErrorMessage, apiErrorStatus } from '~/utils/errors';
import { formatDate, formatTime } from '~/utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'EnquiryDetail'>;

function Field({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <View className="gap-1">
      <Text className="text-xs uppercase text-gray-500">{label}</Text>
      <Text className="text-base text-gray-900">{value}</Text>
    </View>
  );
}

export default function EnquiryDetailScreen({ navigation, route }: Props) {
  const { enquiryId } = route.params;
  const enquiry = useQuery({ queryKey: enquiryKeys.detail(enquiryId), queryFn: () => getEnquiry(enquiryId) });
  const e = enquiry.data;
  const tel = telUrl(e?.phone);
  const wa = whatsappUrl(e?.phone);
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <ScreenHeader title="Enquiry" onBack={() => navigation.goBack()} />
      {enquiry.isLoading ? (
        <View className="gap-3 px-5">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </View>
      ) : enquiry.isError || !e ? (
        <ErrorState
          message={
            apiErrorStatus(enquiry.error) === 404 || apiErrorStatus(enquiry.error) === 403
              ? "You don't have access to this enquiry."
              : apiErrorMessage(enquiry.error, "Couldn't load the enquiry. Try again.")
          }
          onRetry={() => void enquiry.refetch()}
        />
      ) : (
        <ScrollView contentContainerClassName="gap-5 px-5 pb-10">
          <View className="gap-1 rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <Text testID="enquiry-name" className="text-lg font-semibold text-gray-900">{e.fullName}</Text>
            <Text className="text-gray-600">{e.phone || 'No phone'}</Text>
            {e.submittedAt ? (
              <Text className="text-xs text-gray-400">
                {formatDate(e.submittedAt)} {formatTime(e.submittedAt)}
              </Text>
            ) : null}
          </View>
          <View className="flex-row gap-3">
            <Button testID="enquiry-call" variant="outline" disabled={!tel} className="h-12 flex-1 rounded-xl" onPress={() => tel && void Linking.openURL(tel)}>
              <Phone size={18} color="#111827" />
              <Text>Call</Text>
            </Button>
            <Button testID="enquiry-whatsapp" variant="outline" disabled={!wa} className="h-12 flex-1 rounded-xl" onPress={() => wa && void Linking.openURL(wa)}>
              <MessageCircle size={18} color="#111827" />
              <Text>WhatsApp</Text>
            </Button>
          </View>
          <Field label="Challenge or doubt" value={e.otherText} />
          <Field label="Topics" value={e.topics.join(', ')} />
          <Field label="Nature of business" value={e.natureOfBusiness} />
          <Field label="Stage" value={e.establishmentStage} />
          <Field label="Raw material" value={e.rawMaterialText} />
          <Field label="Machinery" value={e.machineryText} />
          <Field label="Scheme" value={e.scheme} />
          <Field label="Source" value={e.source} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
