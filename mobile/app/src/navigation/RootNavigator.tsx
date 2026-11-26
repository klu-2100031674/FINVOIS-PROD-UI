import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { ClipboardList, FileText, LayoutDashboard, Mail, MessageCircleQuestion, User, Users } from 'lucide-react-native';
import type { ComponentType } from 'react';
import { useSession } from '~/auth/useSession';
import LoginScreen from '~/screens/auth/LoginScreen';
import ProfileScreen from '~/screens/shared/ProfileScreen';
import PdfViewerScreen from '~/screens/shared/PdfViewerScreen';
import RequestFormScreen from '~/screens/shared/RequestFormScreen';
import EnquiryListScreen from '~/screens/shared/EnquiryListScreen';
import EnquiryDetailScreen from '~/screens/shared/EnquiryDetailScreen';
import FreeCreditsScreen from '~/screens/admin/FreeCreditsScreen';
import DashboardScreen from '~/screens/admin/DashboardScreen';
import ReportListScreen from '~/screens/admin/ReportListScreen';
import ReportDetailScreen from '~/screens/admin/ReportDetailScreen';
import RequestListScreen from '~/screens/admin/RequestListScreen';
import AdminRequestDetailScreen from '~/screens/admin/AdminRequestDetailScreen';
import EmailAutomationScreen from '~/screens/admin/EmailAutomationScreen';
import EmailFolderScreen from '~/screens/admin/EmailFolderScreen';
import EmailRequestDetailScreen from '~/screens/admin/EmailRequestDetailScreen';
import EmailScheduleScreen from '~/screens/admin/EmailScheduleScreen';
import EmailTemplateFormScreen from '~/screens/admin/EmailTemplateFormScreen';
import MyWorkScreen from '~/screens/agent/MyWorkScreen';
import AgentRequestDetailScreen from '~/screens/agent/AgentRequestDetailScreen';
import AgentDocumentsScreen from '~/screens/agent/AgentDocumentsScreen';
import AgentMessagesScreen from '~/screens/agent/AgentMessagesScreen';
import { linking } from './linking';
import { navigationRef } from './navigationRef';
import { TAB_ACTIVE, useTabOptions } from './tabOptions';
import type { AdminTabParamList, AgentTabParamList, RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const AdminTabs = createBottomTabNavigator<AdminTabParamList>();
const AgentTabs = createBottomTabNavigator<AgentTabParamList>();

const ACTIVE = TAB_ACTIVE;

type IconType = ComponentType<{ size?: number; color?: string }>;
const icon = (Icon: IconType) =>
  function TabIcon({ color, size }: { color: string; size: number }) {
    return <Icon size={size} color={color} />;
  };

function AdminNavigator() {
  const tabOptions = useTabOptions();
  return (
    <AdminTabs.Navigator screenOptions={tabOptions}>
      <AdminTabs.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: 'Home', tabBarIcon: icon(LayoutDashboard) }} />
      <AdminTabs.Screen name="Reports" component={ReportListScreen} options={{ tabBarIcon: icon(FileText) }} />
      <AdminTabs.Screen name="Requests" component={RequestListScreen} options={{ tabBarIcon: icon(Users) }} />
      <AdminTabs.Screen name="Enquiries" component={EnquiryListScreen} options={{ tabBarIcon: icon(MessageCircleQuestion) }} />
      <AdminTabs.Screen name="Email" component={EmailAutomationScreen} options={{ tabBarIcon: icon(Mail) }} />
      <AdminTabs.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: icon(User) }} />
    </AdminTabs.Navigator>
  );
}

function AgentNavigator() {
  const tabOptions = useTabOptions();
  return (
    <AgentTabs.Navigator screenOptions={tabOptions}>
      <AgentTabs.Screen name="My work" component={MyWorkScreen} options={{ tabBarIcon: icon(ClipboardList) }} />
      <AgentTabs.Screen name="Enquiries" component={EnquiryListScreen} options={{ tabBarIcon: icon(MessageCircleQuestion) }} />
      <AgentTabs.Screen name="Email" component={EmailAutomationScreen} options={{ tabBarIcon: icon(Mail) }} />
      <AgentTabs.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: icon(User) }} />
    </AgentTabs.Navigator>
  );
}

export function RootNavigator() {
  const session = useSession();

  if (session.status === 'loading') {
    return (
      <View className="flex-1 items-center justify-center bg-white" testID="splash">
        <ActivityIndicator color={ACTIVE} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {session.status === 'signedOut' ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : session.user.role === 'admin' ? (
          <>
            <Stack.Screen name="Admin" component={AdminNavigator} />
            <Stack.Screen name="ReportDetail" component={ReportDetailScreen} />
            <Stack.Screen name="AdminRequestDetail" component={AdminRequestDetailScreen} />
            <Stack.Screen name="EmailRequestDetail" component={EmailRequestDetailScreen} />
            <Stack.Screen name="EmailFolder" component={EmailFolderScreen} />
            <Stack.Screen name="EmailSchedule" component={EmailScheduleScreen} />
            <Stack.Screen name="EmailTemplateForm" component={EmailTemplateFormScreen} />
            <Stack.Screen name="AgentDocuments" component={AgentDocumentsScreen} />
            <Stack.Screen name="AgentMessages" component={AgentMessagesScreen} />
            <Stack.Screen name="RequestForm" component={RequestFormScreen} />
            <Stack.Screen name="PdfViewer" component={PdfViewerScreen} />
            <Stack.Screen name="EnquiryDetail" component={EnquiryDetailScreen} />
            <Stack.Screen name="FreeCredits" component={FreeCreditsScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Agent" component={AgentNavigator} />
            <Stack.Screen name="AgentRequestDetail" component={AgentRequestDetailScreen} />
            <Stack.Screen name="EmailRequestDetail" component={EmailRequestDetailScreen} />
            <Stack.Screen name="EmailFolder" component={EmailFolderScreen} />
            <Stack.Screen name="EmailSchedule" component={EmailScheduleScreen} />
            <Stack.Screen name="EmailTemplateForm" component={EmailTemplateFormScreen} />
            <Stack.Screen name="AgentDocuments" component={AgentDocumentsScreen} />
            <Stack.Screen name="AgentMessages" component={AgentMessagesScreen} />
            <Stack.Screen name="RequestForm" component={RequestFormScreen} />
            <Stack.Screen name="PdfViewer" component={PdfViewerScreen} />
            <Stack.Screen name="EnquiryDetail" component={EnquiryDetailScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
