import { useState, useEffect } from 'react';
import { networkManager, NetworkState } from '../utils/network';

export function useNetwork(): NetworkState & { isOffline: boolean } {
  const [state, setState] = useState<NetworkState>(networkManager.getState());

  useEffect(() => {
    const unsubscribe = networkManager.subscribe(newState => {
      setState(newState);
    });

    return unsubscribe;
  }, []);

  return {
    ...state,
    isOffline: !state.isConnected || state.isInternetReachable === false,
  };
}

