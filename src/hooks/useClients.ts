import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useAuth } from './useAuth';
import axios, { AxiosResponse } from 'axios';
import type { Client } from '../types';

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

export const useClients = () => {
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

  const clients = useQuery({
    queryKey: ['clients'], // Clé de requête sous forme de tableau
    queryFn: async () => {
      try {
        if (!isAuthenticated()) {
          throw new Error('Vous devez être connecté pour accéder à cette fonctionnalité.');
        }

        const api = createApiInstance();
        const response = await api.get<Client[]>('/client/admin/all');
        return handleResponse<Client[]>(response);
      } catch (error) {
        throw new Error('Erreur lors du chargement des clients. Veuillez réessayer.');
      }
    },
    enabled: isAuthenticated(),
  });

  const createClient = useMutation({
    mutationFn: async (client: Omit<Client, 'clientId'>) => {
      if (!isAuthenticated()) {
        throw new Error('Vous devez être connecté pour créer un client.');
      }

      const api = createApiInstance();
      const response = await api.post<Client>('auth/admin/signup/client', client);
      return handleResponse<Client>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] }); // Utilisation d'un objet
      toast.success('Client créé avec succès.');
    },
    onError: (error: Error | unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue.';
      toast.error(`Erreur lors de la création du client : ${errorMessage}`);
    },
  });

  const updateClient = useMutation({
    mutationFn: async (client: Client) => {
      if (!isAuthenticated()) {
        throw new Error('Vous devez être connecté pour modifier un client.');
      }

      const api = createApiInstance();
      const response = await api.put<Client>(`client/${client.id}/admin/update`, client);
      return handleResponse<Client>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] }); // Utilisation d'un objet
      toast.success('Client mis à jour avec succès.');
    },
    onError: (error: Error | unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue.';
      toast.error(`Erreur lors de la mise à jour du client : ${errorMessage}`);
    },
  });

  const deleteClient = useMutation({
    mutationFn: async (clientId: string) => {
      if (!isAuthenticated()) {
        throw new Error('Vous devez être connecté pour supprimer un client.');
      }

      const api = createApiInstance();
      const response = await api.delete(`/client/${clientId}/delete`);
      return handleResponse<void>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] }); // Utilisation d'un objet
      toast.success('Client supprimé avec succès.');
    },
    onError: (error: Error | unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue.';
      if (errorMessage.includes('réservé aux superviseurs')) {
        toast.error('Cette action est réservée aux superviseurs.');
      } else {
        toast.error(`Erreur lors de la suppression du client : ${errorMessage}`);
      }
    },
  });

  const deleteAllClients = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated()) {
        throw new Error('Vous devez être connecté pour supprimer tous les clients.');
      }

      const api = createApiInstance();
      const response = await api.delete('/client/admin/delete-all');
      return handleResponse<void>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Tous les clients ont été supprimés avec succès.');
    },
    onError: (error: Error | unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue.';
      if (errorMessage.includes('réservé aux superviseurs')) {
        toast.error('Cette action est réservée aux superviseurs.');
      } else {
        toast.error(`Erreur lors de la suppression des clients : ${errorMessage}`);
      }
    },
  });

  return {
    clients,
    createClient,
    updateClient,
    deleteClient,
    deleteAllClients
  };
};