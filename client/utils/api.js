import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// Prefer runtime config (app.json -> extra). Fallback to hardcoded dev IP.
const API_BASE = Constants?.manifest?.extra?.API_BASE || 'http://192.168.0.114:3000';

// Ensure axios will send/receive cookies (for session support)
const api = axios.create({ baseURL: API_BASE, withCredentials: true });

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('jwtToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Attach any persisted guest cart id so server can resolve cart for mobile clients
  const guestId = await SecureStore.getItemAsync('guestCartId');
  if (guestId) {
    config.headers['x-guest-cart-id'] = guestId;
  }
  return config;
});

export default api;