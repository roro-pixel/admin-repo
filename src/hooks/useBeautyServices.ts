import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useAuth } from './useAuth';
import axios, { AxiosResponse } from 'axios';
import type { BeautyService } from '../types';

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

export const useBeautyServices = () => {
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

  const beautyServices = useQuery({
    queryKey: ['beautyServices'],
    queryFn: async () => {
      try {
        if (!isAuthenticated()) {
          throw new Error('Vous devez être connecté pour accéder à cette fonctionnalité.');
        }

        const api = createApiInstance();
        const response = await api.get<BeautyService[]>('/esthetic/all');
        return handleResponse<BeautyService[]>(response);
      } catch (error) {
        throw new Error('Erreur lors du chargement des services de beauté. Veuillez réessayer.');
      }
    },
    enabled: isAuthenticated(),
  });

  const createBeautyService = useMutation({
    mutationFn: async (beautyService: Omit<BeautyService, 'id'>) => {
      if (!isAuthenticated()) {
        throw new Error('Vous devez être connecté pour créer un service de beauté.');
      }

      const api = createApiInstance();
      const response = await api.post<BeautyService>('/esthetic/create', beautyService);
      return handleResponse<BeautyService>(response);
    },
    onSuccess: (newBeautyService: BeautyService) => {
      queryClient.setQueryData(['beautyServices'], (oldData: BeautyService[] | undefined) => {
        return oldData ? [...oldData, newBeautyService] : [newBeautyService];
      });
      toast.success('Service de beauté créé avec succès.');
    },
    onError: (error: Error | unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue.';
      toast.error(`Erreur lors de la création : ${errorMessage}`);
    },
  });

  const updateBeautyService = useMutation({
    mutationFn: async (beautyService: BeautyService) => {
      if (!isAuthenticated()) {
        throw new Error('Vous devez être connecté pour modifier un service de beauté.');
      }

      if (beautyService.id === undefined || beautyService.id === null) {
        throw new Error('Identifiant du service de beauté manquant.');
      }

      const api = createApiInstance();
      const response = await api.put<BeautyService>(`/esthetic/${beautyService.id}/update`, beautyService);
      return handleResponse<BeautyService>(response);
    },
    onSuccess: (updatedBeautyService: BeautyService) => {
      queryClient.setQueryData(['beautyServices'], (oldData: BeautyService[] | undefined) => {
        return oldData?.map((service) =>
          service.id === updatedBeautyService.id ? updatedBeautyService : service
        );
      });
      toast.success('Service de beauté mis à jour avec succès.');
    },
    onError: (error: Error | unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue.';
      toast.error(`Erreur lors de la mise à jour : ${errorMessage}`);
    },
  });

  const deleteBeautyService = useMutation({
    mutationFn: async (beautyServiceId: string) => {
      if (!isAuthenticated()) {
        throw new Error('Vous devez être connecté pour supprimer un service de beauté.');
      }

      const api = createApiInstance();
      const response = await api.delete(`/esthetic/${beautyServiceId}/delete`);
      return handleResponse<void>(response);
    },
    onSuccess: (_, beautyServiceId) => {
      queryClient.setQueryData(['beautyServices'], (oldData: BeautyService[] | undefined) => {
        return oldData?.filter((service) => service.id !== Number(beautyServiceId));
      });
      toast.success('Service de beauté supprimé avec succès.');
    },
    onError: (error: Error | unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue.';
      toast.error(`Erreur lors de la suppression : ${errorMessage}`);
    },
  });

  return {
    beautyServices,
    createBeautyService,
    updateBeautyService,
    deleteBeautyService,
  };
};