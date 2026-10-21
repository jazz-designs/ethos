import Constants from 'expo-constants';
import { Platform } from 'react-native';

// API base URL for the Ethos backend.
// Automatically detects your computer's local IP address from Expo bundler,
// and falls back to your active LAN IP (192.168.1.72).
const getApiBaseUrl = (): string => {
  // Expo Go / Dev Client provides hostUri (e.g. "192.168.1.72:8081")
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip) {
      return `http://${ip}:3000`;
    }
  }

  // Fallback for Android Emulator (when not on physical device)
  if (Platform.OS === 'android' && !Constants.isDevice) {
    return 'http://10.0.2.2:3000';
  }

  // Current active LAN IP for physical phone connection
  return 'http://192.168.1.72:3000';
};

export const API_BASE_URL = getApiBaseUrl();