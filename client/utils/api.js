import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE = 'http://192.168.0.114:3000'; // Your laptop IP

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('jwtToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;