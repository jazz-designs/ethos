import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Production Render URL
const RENDER_API_URL = 'https://ethos-inr7.onrender.com';

const getApiBaseUrl = (): string => {
  // If explicitly in production build, always use Render
  if (!__DEV__) {
    return RENDER_API_URL;
  }

  // In development, you can toggle between Render or local testing
  // Default to Render URL so mobile builds / Expo Go directly test against Render
  return RENDER_API_URL;

  /* Local dev fallback if ever needed:
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip) return `http://${ip}:3000`;
  }
  return 'http://192.168.1.72:3000';
  */
};

export const API_BASE_URL = getApiBaseUrl();