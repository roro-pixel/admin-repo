import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useAuth } from './useAuth';
import axios, { AxiosResponse } from 'axios';
import type { Haircut } from '../types';

// Création d'une instance API avec l'URL de base
const API_URL = import.meta.env.VITE_API_URL;

// Fonction pour traiter les réponses de l'API
const handleResponse = async <T>(response: AxiosResponse): Promise<T> => {
  const contentType = response.headers['content-type'];

  if (response.status < 200 || response.status >= 300) {
    let errorMessage = 'Une erreur est survenue';
    if (contentType?.includes('application/json')) {
      const errorData = response.data;
      errorMessage = errorData.message || errorData.error || errorMessage;
    } else {
      errorMessage = response.statusText;
    }
    throw new Error(errorMessage);
  }

  if (!contentType || !contentType.includes('application/json')) {
    throw new Error('La réponse du serveur n\'est pas un JSON valide');
  }

  return response.data;
};

export const useHaircuts = () => {
  const queryClient = useQueryClient();
  const { getToken, isAuthenticated } = useAuth();

  // Création d'une instance Axios pour ce hook spécifique
  const createApiInstance = () => {
    const token = getToken();
    // console.log("Token utilisé dans useHaircuts:", token);

    const instance = axios.create({
      baseURL: API_URL,
      headers: token ? {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        'Accept': 'application/json'
      } : undefined
    });

    return instance;
  };

  // Fonction pour obtenir toutes les coupes de cheveux
  const haircuts = useQuery({
    queryKey: ['haircuts'],
    queryFn: async () => {
      try {
        if (!isAuthenticated()) {
          throw new Error('Vous devez être connecté pour accéder à cette ressource');
        }

        // console.log("Récupération des coupes de cheveux...");
        const api = createApiInstance();
        const response = await api.get<Haircut[]>('/haircut/all');
        // console.log("Réponse de l'API haircuts:", response);

        return handleResponse<Haircut[]>(response);
      } catch (error) {
        // console.error('Erreur lors de la récupération des coupes de cheveux:', error);
        toast.error('Erreur lors de la récupération des coupes de cheveux');
        throw error;
      }
    },
    enabled: isAuthenticated() // N'exécute la requête que si l'utilisateur est authentifié
  });

  // Fonction pour créer une coupe de cheveux
  const createHaircut = useMutation({
    mutationFn: async (haircut: Omit<Haircut, 'id'>) => {
      if (!isAuthenticated()) {
        throw new Error('Vous devez être connecté pour créer une coupe de cheveux');
      }

      // console.log("Création d'une coupe de cheveux:", haircut);
      const api = createApiInstance();
      const response = await api.post<Haircut>('/haircut/create', haircut);
      // console.log("Réponse création coupe:", response);

      return handleResponse<Haircut>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['haircuts'] });
      // toast.success('Coupe de cheveux créée avec succès');
    },
    onError: (error: Error | unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(`Erreur lors de la création de la coupe: ${errorMessage}`);
      // console.error('Erreur création coupe:', error);
    },
  });

  // Fonction pour mettre à jour une coupe de cheveux
  const updateHaircut = useMutation({
    mutationFn: async (haircut: Haircut) => {
      if (!isAuthenticated()) {
        throw new Error('Vous devez être connecté pour mettre à jour une coupe de cheveux');
      }

      if (haircut.id === undefined || haircut.id === null) {
        throw new Error('ID de la coupe manquant');
      }

      // console.log("Mise à jour de la coupe de cheveux:", haircut);
      const api = createApiInstance();
      const response = await api.put<Haircut>(`/haircut/${haircut.id}/update`, haircut);
      // console.log("Réponse mise à jour coupe:", response);

      return handleResponse<Haircut>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['haircuts'] });
      // toast.success('Coupe de cheveux mise à jour avec succès');
    },
    onError: (error: Error | unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(`Erreur lors de la mise à jour de la coupe: ${errorMessage}`);
      // console.error('Erreur mise à jour coupe:', error);
    },
  });

  const deleteHaircut = useMutation({
    mutationFn: async (haircutId: string) => { // haircutId est de type string
      if (!isAuthenticated()) {
        throw new Error('Vous devez être connecté pour supprimer une coupe de cheveux');
      }
  
      // console.log("Suppression de la coupe de cheveux avec l'ID:", haircutId);
      const api = createApiInstance();
      const response = await api.delete(`/haircut/${haircutId}/delete`);
      // console.log("Réponse suppression coupe:", response);
  
      return handleResponse<void>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['haircuts'] });
      // toast.success('Coupe de cheveux supprimée avec succès');
    },
    onError: (error: Error | unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      if (errorMessage.includes('réservé aux superviseurs')) {
        toast.error('Cette action est réservée aux superviseurs');
      } else {
        toast.error(`Erreur lors de la suppression de la coupe: ${errorMessage}`);
      }
      // console.error('Erreur suppression coupe:', error);
    },
  });

  return {
    haircuts,
    createHaircut,
    updateHaircut,
    deleteHaircut, 
  };
};