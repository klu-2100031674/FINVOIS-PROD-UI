import { Platform } from 'react-native';
import type { LinkingOptions } from '@react-navigation/native';
import { sessionStore } from '~/auth/sessionStore';
import { allowedForRole, parsePushData } from '~/notifications/payload';
import type { RootStackParamList } from './types';

// Only two links open anything, and only for the role they belong to. Everything else is dropped:
//   finovis://request/<24-hex id>   agent request detail
//   finovis://requests/pending      admin Requests tab, pending filter
// The id is only a hint; the screen it opens loads it with the signed-in user's own session.
export const linking: LinkingOptions<RootStackParamList> = {
  enabled: Platform.OS !== 'web', // the web build is a test harness, not a deep-link target
  prefixes: ['finovis://'],
  getStateFromPath(path) {
    const session = sessionStore.getState();
    if (session.status !== 'signedIn') return undefined;
    const [kind, arg, ...rest] = path.split(/[?#]/)[0].replace(/^\/+|\/+$/g, '').split('/');
    if (rest.length) return undefined;
    const { role } = session.user;

    if (kind === 'request' && allowedForRole('dpr_assigned', role)) {
      const target = parsePushData({ type: 'dpr_assigned', id: arg });
      if (!target) return undefined;
      return { routes: [{ name: 'Agent' }, { name: 'AgentRequestDetail', params: { requestId: target.id } }] };
    }
    if (kind === 'requests' && arg === 'pending' && role === 'admin') {
      return { routes: [{ name: 'Admin', state: { routes: [{ name: 'Requests', params: { filter: 'pending' } }] } }] };
    }
    return undefined;
  },
};
