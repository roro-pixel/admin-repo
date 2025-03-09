import axios from 'axios';
import { getToken } from '../utils/auth'; 

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, 
});

api.interceptors.request.use((config) => {
  const token = getToken(); 
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  config.headers['Content-Type'] = 'application/json';
  config.headers['Accept'] = 'application/json';
  config.headers['ngrok-skip-browser-warning'] = 'true'; 
  return config;
});

export default api;