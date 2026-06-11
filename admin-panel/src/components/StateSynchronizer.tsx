import { useEffect, useRef } from 'react';
import axios from 'axios';
import { useAppStore } from '../lib/store';

// Set up the API base URL based on the environment variables or a local fallback
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002/api/v1';

export const StateSynchronizer = () => {
  const currentUserId = useAppStore((state) => state.session.currentUserId);
  const users = useAppStore((state) => state.users);
  const currentUser = users.find((u) => u.id === currentUserId);
  const userEmail = currentUser?.email;

  const isSyncingRef = useRef(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPulledStateRef = useRef<string>('');

  // 1. Pull the latest state from the backend
  useEffect(() => {
    if (!userEmail) return;

    const pullState = async () => {
      try {
        isSyncingRef.current = true;
        const response = await axios.get(`${API_URL}/sync/${encodeURIComponent(userEmail)}`);
        
        if (response.data.success && response.data.state) {
          const fetchedState = response.data.state;
          const fetchedStateStr = JSON.stringify(fetchedState);

          // Only update local state if it differs from what we last pulled
          if (fetchedStateStr !== lastPulledStateRef.current) {
            lastPulledStateRef.current = fetchedStateStr;

            useAppStore.setState((state) => {
              // Extract non-function keys from the fetched state to merge
              const mergedState: Record<string, any> = { ...state };
              for (const [key, value] of Object.entries(fetchedState)) {
                if (typeof value !== 'function') {
                  mergedState[key] = value;
                }
              }
              // Force preservation of the active local session info to prevent auto-logouts
              mergedState.session = state.session;
              return mergedState as any;
            });
            console.log('[Sync] Synced workspace data with database.');
          }
        }
      } catch (error) {
        console.error('[Sync] Error pulling state from backend:', error);
      } finally {
        setTimeout(() => {
          isSyncingRef.current = false;
        }, 500);
      }
    };

    pullState();

    // Pull data when the window gains focus (e.g. user switching between Brave and Chrome)
    window.addEventListener('focus', pullState);
    return () => {
      window.removeEventListener('focus', pullState);
    };
  }, [userEmail]);

  // 2. Debounce and save local state changes to the backend
  useEffect(() => {
    if (!userEmail) return;

    const unsubscribe = useAppStore.subscribe((state) => {
      // Do not push back the changes if we are currently merging a pull
      if (isSyncingRef.current) return;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(async () => {
        try {
          // Filter out function fields so we only serialize state data
          const stateData: Record<string, any> = {};
          for (const [key, value] of Object.entries(state)) {
            if (typeof value !== 'function') {
              stateData[key] = value;
            }
          }

          const serializedState = JSON.stringify(stateData);
          // Only sync if the local state has changed from the database version
          if (serializedState === lastPulledStateRef.current) {
            return;
          }

          console.log('[Sync] Storing local workspace updates to database...');
          const response = await axios.post(`${API_URL}/sync/${encodeURIComponent(userEmail)}`, {
            state: stateData,
          });

          if (response.data.success) {
            lastPulledStateRef.current = serializedState;
            console.log('[Sync] Database sync complete.');
          }
        } catch (error) {
          console.error('[Sync] Error pushing state updates to database:', error);
        }
      }, 1500); // 1.5-second debounce window
    });

    return () => {
      unsubscribe();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [userEmail]);

  return null;
};
