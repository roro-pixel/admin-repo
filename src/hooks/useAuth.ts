import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { useState, useEffect } from 'react';

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  email: string;
  role: string;
}

interface JwtPayload {
  exp: number;
  // Autres champs du JWT si nécessaire
}

const AUTH_KEY = 'auth';
const TOKEN_KEY = 'token';
const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
});

// Ajout de l'intercepteur pour inclure automatiquement le token dans les requêtes
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Ajout d'un intercepteur pour gérer les erreurs 401 (token expiré ou invalide)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Effacer l'authentification et rediriger vers login
      localStorage.removeItem(AUTH_KEY);
      localStorage.removeItem(TOKEN_KEY);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Fonction pour vérifier si le token est valide (non expiré)
const isTokenValid = (): boolean => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return false;
  
  try {
    const decodedToken = jwtDecode<JwtPayload>(token);
    // Vérifier si le token est expiré
    return decodedToken.exp * 1000 > Date.now();
  } catch (error) {
    // console.error('Erreur lors du décodage du token:', error);
    return false;
  }
};

export const useAuth = () => {
  const navigate = useNavigate();
  // État local pour stocker les informations d'authentification
  const [authState, setAuthState] = useState<LoginResponse | null>(() => {
    // Initialiser depuis localStorage au chargement du hook
    const authData = localStorage.getItem(AUTH_KEY);
    return authData ? JSON.parse(authData) : null;
  });
  
  // Mettre à jour l'état et le localStorage
  const setAuthData = (data: LoginResponse | null): void => {
    setAuthState(data);
    if (data) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(data));
      localStorage.setItem(TOKEN_KEY, data.token);
    } else {
      localStorage.removeItem(AUTH_KEY);
      localStorage.removeItem(TOKEN_KEY);
    }
  };
  
  // Réagir aux changements de localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const authData = localStorage.getItem(AUTH_KEY);
      setAuthState(authData ? JSON.parse(authData) : null);
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      // console.log("Tentative de connexion avec:", credentials.email);
      const response = await api.post<LoginResponse>('/auth/login', credentials);
      const authData = response.data;
      // console.log("Réponse de l'API:", authData);
      setAuthData(authData);
      return authData;
    },
    onSuccess: () => {
      toast.success('Connexion réussie');
      navigate('/dashboard'); // Redirection automatique après connexion réussie
    },
    onError: (error) => {
      // console.error("Erreur de connexion:", error);
      toast.error('Échec de la connexion : email ou mot de passe incorrect');
    }
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const token = getToken();
      // console.log("Déconnexion avec token:", token);
      if (token) {
        try {
          await api.post('/auth/logout', null, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            },
          });
        } catch (error) {
          // console.error('Erreur lors de la déconnexion:', error);
        }
      }
      setAuthData(null); // Mettre à jour l'état et effacer le localStorage
      return true;
    },
    onSuccess: () => {
      toast.success('Déconnexion réussie');
      navigate('/login'); // Redirection vers login après déconnexion
    },
    onError: (error) => {
      // console.error("Erreur lors de la déconnexion:", error);
      toast.error('Erreur lors de la déconnexion');
    }
  });

  // Fonction pour obtenir le token
  const getToken = (): string | null => {
    return authState?.token || localStorage.getItem(TOKEN_KEY);
  };
  
  // Fonction pour obtenir les données d'authentification
  const getAuthData = (): LoginResponse | null => {
    return authState || (localStorage.getItem(AUTH_KEY) ? JSON.parse(localStorage.getItem(AUTH_KEY)!) : null);
  };
  
  // Fonction pour vérifier si l'utilisateur est authentifié
  const isAuthenticated = (): boolean => {
    return !!authState?.token || isTokenValid();
  };

  // Fonction pour obtenir le rôle de l'utilisateur
  const getUserRole = (): string | null => {
    return authState?.role || (getAuthData()?.role || null);
  };

  return {
    login: loginMutation,
    logout: logoutMutation,
    getToken,
    getAuthData,
    clearAuth: () => setAuthData(null),
    isAuthenticated,
    getUserRole,
    isTokenValid
  };
};

export default api;