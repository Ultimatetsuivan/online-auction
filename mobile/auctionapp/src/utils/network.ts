import { Alert } from 'react-native';
import NetInfo, { NetInfoState, NetInfoStateType } from '@react-native-community/netinfo';

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: NetInfoStateType | null;
}

class NetworkManager {
  private listeners: Set<(state: NetworkState) => void> = new Set();
  private currentState: NetworkState = {
    isConnected: true,
    isInternetReachable: true,
    type: null,
  };
  private unsubscribeNetInfo: (() => void) | null = null;

  constructor() {
    this.initialize();
  }

  private initialize() {
    // Subscribe to network state changes
    this.unsubscribeNetInfo = NetInfo.addEventListener((state: NetInfoState) => {
      const newState: NetworkState = {
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? null,
        type: state.type ?? null,
      };

      // Only update if state changed
      if (
        this.currentState.isConnected !== newState.isConnected ||
        this.currentState.isInternetReachable !== newState.isInternetReachable ||
        this.currentState.type !== newState.type
      ) {
        this.currentState = newState;
        // Notify all listeners
        this.listeners.forEach(listener => {
          listener(this.currentState);
        });
      }
    });

    // Get initial state
    this.checkNetworkState();
  }

  private async checkNetworkState() {
    try {
      const state = await NetInfo.fetch();
      const newState: NetworkState = {
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? null,
        type: state.type ?? null,
      };

      if (
        this.currentState.isConnected !== newState.isConnected ||
        this.currentState.isInternetReachable !== newState.isInternetReachable ||
        this.currentState.type !== newState.type
      ) {
        this.currentState = newState;
        this.listeners.forEach(listener => {
          listener(this.currentState);
        });
      }
    } catch (error) {
      console.error('Error checking network state:', error);
    }
  }

  subscribe(listener: (state: NetworkState) => void): () => void {
    this.listeners.add(listener);
    // Immediately call with current state
    listener(this.currentState);
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  getState(): NetworkState {
    return { ...this.currentState };
  }

  async checkConnection(): Promise<boolean> {
    try {
      const state = await NetInfo.fetch();
      return state.isConnected ?? false;
    } catch (error) {
      console.error('Error checking connection:', error);
      return false;
    }
  }

  async checkInternetReachable(): Promise<boolean> {
    try {
      const state = await NetInfo.fetch();
      return state.isInternetReachable ?? true;
    } catch (error) {
      console.error('Error checking internet reachability:', error);
      return false;
    }
  }

  showOfflineAlert() {
    Alert.alert(
      'No Internet Connection',
      'Please check your internet connection and try again.',
      [{ text: 'OK' }]
    );
  }

  destroy() {
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo();
      this.unsubscribeNetInfo = null;
    }
    this.listeners.clear();
  }
}

export const networkManager = new NetworkManager();

// Retry utility for network requests
export async function retryRequest<T>(
  request: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Check network before retry
      if (attempt > 1) {
        const isConnected = await networkManager.checkConnection();
        if (!isConnected) {
          throw new Error('No internet connection');
        }
      }

      return await request();
    } catch (error) {
      lastError = error;

      // Don't retry on authentication errors
      if (error?.response?.status === 401) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }

  throw lastError;
}

export default networkManager;

