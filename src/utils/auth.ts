import { jwtDecode } from 'jwt-decode';

export const getToken = () => localStorage.getItem('jwt_token');

export const setToken = (token: string) => {
  localStorage.setItem('jwt_token', token);
};

export const removeToken = () => {
  localStorage.removeItem('jwt_token');
};

export const isTokenValid = () => {
  const token = getToken();
  if (!token) return false;
  
  try {
    const decoded = jwtDecode(token);
    return decoded.exp ? decoded.exp * 1000 > Date.now() : false;
  } catch {
    return false;
  }
};