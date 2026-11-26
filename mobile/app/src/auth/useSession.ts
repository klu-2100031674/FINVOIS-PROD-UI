import { useSyncExternalStore } from 'react';
import { sessionStore } from './sessionStore';

export function useSession() {
  return useSyncExternalStore(sessionStore.subscribe, sessionStore.getState);
}
