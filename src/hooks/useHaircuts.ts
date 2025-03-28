import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useAuth } from './useAuth';
import axios, { AxiosResponse } from 'axios';
import type { Haircut } from '../types';

const API_URL = import.meta.env.VITE_API_URL;

const handleResponse = async <T>(response: AxiosResponse): Promise<T> => {
  const contentType = response.headers['content-type'];

  // Si la réponse est une erreur (statut HTTP 4xx ou 5xx)
  if (response.status < 200 || response.status >= 300) {
    let errorMessage = 'Une erreur est survenue. Veuillez réessayer plus tard.';

    // Si la réponse contient du JSON, essayez d'extraire un message d'erreur
    if (contentType?.includes('application/json')) {
      const errorData = response.data;
      errorMessage = errorData.message || errorData.error || errorMessage;
    }

    // Lancer une erreur avec un message convivial
    throw new Error(errorMessage);
  }

  // Si la réponse n'est pas du JSON, lancer une erreur conviviale
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error('La réponse du serveur est invalide. Veuillez contacter le support.');
  }

  // Si tout va bien, retourner les données
  return response.data;
};

export const useHaircuts = () => {
  const queryClient = useQueryClient();
  const { getToken, isAuthenticated } = useAuth();

  const createApiInstance = () => {
    const token = getToken();
    const instance = axios.create({
      baseURL: API_URL,
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
            Accept: 'application/json',
          }
        : undefined,
    });
    return instance;
  };

  const haircuts = useQuery({
    queryKey: ['haircuts'],
    queryFn: async () => {
      try {
        if (!isAuthenticated()) {
          throw new Error('Vous devez être connecté pour accéder à cette fonctionnalité.');
        }

        const api = createApiInstance();
        const response = await api.get<Haircut[]>('/haircut/all');
        return handleResponse<Haircut[]>(response);
      } catch (error) {
        throw new Error('Erreur lors du chargement des prestations. Veuillez réessayer.');
      }
    },
    enabled: isAuthenticated(),
  });

  const createHaircut = useMutation({
    mutationFn: async (haircut: Omit<Haircut, 'id'>) => {
      if (!isAuthenticated()) {
        throw new Error('Vous devez être connecté pour créer une prestation.');
      }

      const api = createApiInstance();
      const response = await api.post<Haircut>('/haircut/create', haircut);
      return handleResponse<Haircut>(response);
    },
    onSuccess: (newHaircut: Haircut) => {
      queryClient.setQueryData(['haircuts'], (oldData: Haircut[] | undefined) => {
        return oldData ? [...oldData, newHaircut] : [newHaircut];
      });
      toast.success('Prestation créée avec succès.');
    },
    onError: (error: Error | unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue.';
      toast.error(`Erreur lors de la création : ${errorMessage}`);
    },
  });

  const updateHaircut = useMutation({
    mutationFn: async (haircut: Haircut) => {
      if (!isAuthenticated()) {
        throw new Error('Vous devez être connecté pour modifier une prestation.');
      }

      if (haircut.id === undefined || haircut.id === null) {
        throw new Error('Identifiant de la prestation manquant.');
      }

      const api = createApiInstance();
      const response = await api.put<Haircut>(`/haircut/${haircut.id}/update`, haircut);
      return handleResponse<Haircut>(response);
    },
    onSuccess: (updatedHaircut: Haircut) => {
      queryClient.setQueryData(['haircuts'], (oldData: Haircut[] | undefined) => {
        return oldData?.map((haircut) =>
          haircut.id === updatedHaircut.id ? updatedHaircut : haircut
        );
      });
      toast.success('Prestation mise à jour avec succès.');
    },
    onError: (error: Error | unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue.';
      toast.error(`Erreur lors de la mise à jour : ${errorMessage}`);
    },
  });

  const deleteHaircut = useMutation({
    mutationFn: async (haircutId: string) => {
      if (!isAuthenticated()) {
        throw new Error('Vous devez être connecté pour supprimer une prestation.');
      }

      const api = createApiInstance();
      const response = await api.delete(`/haircut/${haircutId}/delete`);
      return handleResponse<void>(response);
    },
    onSuccess: (_, haircutId) => {
      queryClient.setQueryData(['haircuts'], (oldData: Haircut[] | undefined) => {
        return oldData?.filter((haircut) => haircut.id !== Number(haircutId));
      });
      toast.success('Prestation supprimée avec succès.');
    },
    onError: (error: Error | unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue.';
      toast.error(`Erreur lors de la suppression : ${errorMessage}`);
    },
  });

  return {
    haircuts,
    createHaircut,
    updateHaircut,
    deleteHaircut,
  };
};