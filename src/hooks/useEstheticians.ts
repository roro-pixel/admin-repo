import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useAuth } from './useAuth';
import axios, { AxiosResponse } from 'axios';
import type { Esthetician, EstheticianScheduleForm, EstheticianSchedule } from '../types';

const API_URL = import.meta.env.VITE_API_URL;

const handleResponse = async <T>(response: AxiosResponse): Promise<T> => {
  const contentType = response.headers['content-type'];

  if (response.status < 200 || response.status >= 300) {
    let errorMessage = 'Une erreur est survenue. Veuillez réessayer plus tard.';
    if (contentType?.includes('application/json')) {
      const errorData = response.data;
      errorMessage = errorData.message || errorData.error || errorMessage;
    }
    throw new Error(errorMessage);
  }

  if (!contentType || !contentType.includes('application/json')) {
    throw new Error('La réponse du serveur est invalide. Veuillez contacter le support.');
  }

  return response.data;
};

export const useEstheticians = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  // Récupérer toutes les esthéticiennes
  const estheticians = useQuery({
    queryKey: ['estheticians'],
    queryFn: async () => {
      try {
        const token = getToken();
        const response = await axios.get<Esthetician[]>(`${API_URL}/esthetician/all`, {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true',
                Accept: 'application/json',
              }
            : undefined,
        });
        return handleResponse<Esthetician[]>(response);
      } catch (error) {
        throw new Error('Erreur lors du chargement des esthéticiennes. Veuillez réessayer.');
      }
    },
  });

  // Créer une esthéticienne
  const createEsthetician = useMutation({
    mutationFn: async (esthetician: Omit<Esthetician, 'id'>) => {
      const token = getToken();
      const response = await axios.post<Esthetician>(`${API_URL}/esthetician/`, esthetician, {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true',
              Accept: 'application/json',
            }
          : undefined,
      });
      return handleResponse<Esthetician>(response);
    },
    onSuccess: (newEsthetician: Esthetician) => {
      queryClient.setQueryData(['estheticians'], (oldData: Esthetician[] | undefined) => {
        return oldData ? [...oldData, newEsthetician] : [newEsthetician];
      });
      toast.success('Esthéticienne créée avec succès.');
    },
    onError: (error: Error | unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue.';
      toast.error(`Erreur lors de la création de l'esthéticienne : ${errorMessage}`);
    },
  });

  // Mettre à jour une esthéticienne
  const updateEsthetician = useMutation({
    mutationFn: async (esthetician: Esthetician) => {
      const token = getToken();
      const response = await axios.put<Esthetician>(
        `${API_URL}/esthetician/${esthetician.id}/admin/update`,
        esthetician,
        {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true',
                Accept: 'application/json',
              }
            : undefined,
        }
      );
      return handleResponse<Esthetician>(response);
    },
    onSuccess: (updatedEsthetician: Esthetician) => {
      queryClient.setQueryData(['estheticians'], (oldData: Esthetician[] | undefined) => {
        return oldData?.map((e) => (e.id === updatedEsthetician.id ? updatedEsthetician : e));
      });
      toast.success('Esthéticienne mise à jour avec succès.');
    },
    onError: (error: Error | unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue.';
      toast.error(`Erreur lors de la mise à jour de l'esthéticienne : ${errorMessage}`);
    },
  });

  // Supprimer une esthéticienne
  const deleteEsthetician = useMutation({
    mutationFn: async (id: string) => {
      const token = getToken();
      const response = await axios.delete(`${API_URL}/esthetician/${id}/admin/delete`, {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true',
              Accept: 'application/json',
            }
          : undefined,
      });
      return handleResponse<void>(response);
    },
    onSuccess: (_, estheticianId) => {
      queryClient.setQueryData(['estheticians'], (oldData: Esthetician[] | undefined) => {
        return oldData?.filter((e) => e.id !== estheticianId);
      });
      toast.success('Esthéticienne supprimée avec succès.');
    },
    onError: (error: Error | unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue.';
      if (errorMessage.includes('réservé aux superviseurs')) {
        toast.error('Cette action est réservée aux superviseurs.');
      } else {
        toast.error(`Erreur lors de la suppression de l'esthéticienne : ${errorMessage}`);
      }
    },
  });

  // Créer un emploi du temps pour une esthéticienne
  const createEstheticianSchedule = useMutation({
    mutationFn: async (scheduleData: EstheticianScheduleForm) => {
      const token = getToken();
      const response = await axios.post(`${API_URL}/schedule/bulk`, scheduleData, {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true',
              Accept: 'application/json',
            }
          : undefined,
      });
      return handleResponse<void>(response);
    },
    onSuccess: (_, variables) => {
      toast.success('Emploi du temps créé avec succès.');
      // Invalider la requête pour cette esthéticienne spécifique
      queryClient.invalidateQueries({ queryKey: ['estheticianSchedules', variables.estheticianId] });
    },
    onError: (error: Error | unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue.';
      toast.error(`Erreur lors de la création de l'emploi du temps : ${errorMessage}`);
    },
  });

  // Récupérer les emplois du temps d'une esthéticienne spécifique
  const useEstheticianSchedules = (estheticianId?: string) => {
    return useQuery({
      queryKey: ['estheticianSchedules', estheticianId],
      queryFn: async () => {
        try {
          const token = getToken();
          const response = await axios.get<EstheticianSchedule[]>(
            `${API_URL}/schedule/${estheticianId}/esthetician`,
            {
              headers: token
                ? {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true',
                    Accept: 'application/json',
                  }
                : undefined,
            }
          );
          return handleResponse<EstheticianSchedule[]>(response);
        } catch (error) {
          throw new Error('Erreur lors du chargement des emplois du temps. Veuillez réessayer.');
        }
      },
      enabled: !!estheticianId,
    });
  };

  // Supprimer un emploi du temps d'une esthéticienne
  const deleteEstheticianSchedule = useMutation({
    mutationFn: async ({ scheduleId, estheticianId }: { scheduleId: string; estheticianId: string }) => {
      const token = getToken();
      const response = await axios.delete(`${API_URL}/schedule/${scheduleId}/delete`, {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true',
              Accept: 'application/json',
            }
          : undefined,
      });
      return { response: handleResponse<void>(response), estheticianId };
    },
    onSuccess: (data) => {
      // Invalider la requête pour cette esthéticienne spécifique
      queryClient.invalidateQueries({ queryKey: ['estheticianSchedules', data.estheticianId] });
      toast.success('Emploi du temps supprimé avec succès.');
    },
    onError: (error: Error | unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue.';
      toast.error(`Erreur lors de la suppression de l'emploi du temps : ${errorMessage}`);
    },
  });

  return {
    estheticians,
    createEsthetician,
    updateEsthetician,
    deleteEsthetician,
    createEstheticianSchedule,
    useEstheticianSchedules,
    deleteEstheticianSchedule,
  };
};