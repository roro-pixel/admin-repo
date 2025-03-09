import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useAuth } from './useAuth';
import axios, { AxiosResponse } from 'axios';
import type { Client } from '../types';

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

export const useClients = () => {
  const queryClient = useQueryClient();
  const { getToken, isAuthenticated } = useAuth();

  // Création d'une instance Axios pour ce hook spécifique
  const createApiInstance = () => {
    const token = getToken();
    // console.log("Token utilisé dans useClients:", token);

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

  // Fonction pour obtenir tous les clients
  const clients = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      try {
        if (!isAuthenticated()) {
          throw new Error('Vous devez être connecté pour accéder à cette ressource');
        }

        // console.log("Récupération des clients...");
        const api = createApiInstance();
        const response = await api.get<Client[]>('/client/admin/all');
        // console.log("Réponse de l'API clients:", response);

        return handleResponse<Client[]>(response);
      } catch (error) {
        // console.error('Erreur lors de la récupération des clients:', error);
        toast.error('Erreur lors de la récupération des clients');
        throw error;
      }
    },
    enabled: isAuthenticated() // N'exécute la requête que si l'utilisateur est authentifié
  });

  // Fonction pour créer un client
  const createClient = useMutation({
    mutationFn: async (client: Omit<Client, 'clientId'>) => {
      if (!isAuthenticated()) {
        throw new Error('Vous devez être connecté pour créer un client');
      }

      // console.log("Création d'un client:", client);
      const api = createApiInstance();
      const response = await api.post<Client>('auth/admin/signup/client', client);
      // console.log("Réponse création client:", response);

      return handleResponse<Client>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client créé avec succès');
    },
    onError: (error: Error | unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(`Erreur lors de la création du client: ${errorMessage}`);
      // console.error('Erreur création client:', error);
    },
  });

  // Fonction pour mettre à jour un client
  const updateClient = useMutation({
    mutationFn: async (client: Client) => {
      if (!isAuthenticated()) {
        throw new Error('Vous devez être connecté pour mettre à jour un client');
      }

      // console.log("Mise à jour du client:", client);
      const api = createApiInstance();
      const response = await api.put<Client>(`client/${client.id}/admin/update`, client);
      // console.log("Réponse mise à jour client:", response);

      return handleResponse<Client>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client mis à jour avec succès');
    },
    onError: (error: Error | unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(`Erreur lors de la mise à jour du client: ${errorMessage}`);
      // console.error('Erreur mise à jour client:', error);
    },
  });

  // Fonction pour supprimer un client
  const deleteClient = useMutation({
    mutationFn: async (clientId: string) => {
      if (!isAuthenticated()) {
        throw new Error('Vous devez être connecté pour supprimer un client');
      }

      // console.log("Suppression du client avec l'ID:", clientId);
      const api = createApiInstance();
      const response = await api.delete(`/client/${clientId}/delete`);
      // console.log("Réponse suppression client:", response);

      return handleResponse<void>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      // toast.success('Client supprimé avec succès');
    },
    onError: (error: Error | unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      if (errorMessage.includes('réservé aux superviseurs')) {
        toast.error('Cette action est réservée aux superviseurs');
      } else {
        toast.error(`Erreur lors de la suppression du client: ${errorMessage}`);
      }
      // console.error('Erreur suppression client:', error);
    },
  });

  return {
    clients,
    createClient,
    updateClient,
    deleteClient,
  };
};