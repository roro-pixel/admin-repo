import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useAuth } from './useAuth';
import axios, { AxiosResponse } from 'axios';
import type { Barber, ScheduleForm, Schedule } from '../types';
import { CloudSnow } from 'lucide-react';

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

export const useBarbers = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  // Récupérer tous les coiffeurs
  const barbers = useQuery({
    queryKey: ['barbers'],
    queryFn: async () => {
      try {
        const token = getToken();
        const response = await axios.get<Barber[]>(`${API_URL}/barber/all`, {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true',
                Accept: 'application/json',
              }
            : undefined,
        });
        return handleResponse<Barber[]>(response);
      } catch (error) {
        throw new Error('Erreur lors du chargement des coiffeurs. Veuillez réessayer.');
      }
    },
  });

  // Créer un coiffeur
  const createBarber = useMutation({
    mutationFn: async (barber: Omit<Barber, 'barberId'>) => {
      const token = getToken();
      const response = await axios.post<Barber>(`${API_URL}/barber/`, barber, {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true',
              Accept: 'application/json',
            }
          : undefined,
      });
      return handleResponse<Barber>(response);
    },
    onSuccess: (newBarber: Barber) => {
      queryClient.setQueryData(['barbers'], (oldData: Barber[] | undefined) => {
        return oldData ? [...oldData, newBarber] : [newBarber];
      });
      toast.success('Coiffeur créé avec succès.');
    },
    onError: (error: Error | unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue.';
      toast.error(`Erreur lors de la création du coiffeur : ${errorMessage}`);
    },
  });

  // Mettre à jour un coiffeur
  const updateBarber = useMutation({
    mutationFn: async (barber: Barber) => {
      const token = getToken();
      const response = await axios.put<Barber>(
        `${API_URL}/barber/${barber.id}/admin/update`,
        barber,
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
      return handleResponse<Barber>(response);
    },
    onSuccess: (updatedBarber: Barber) => {
      queryClient.setQueryData(['barbers'], (oldData: Barber[] | undefined) => {
        return oldData?.map((b) => (b.id === updatedBarber.id ? updatedBarber : b));
      });
      toast.success('Coiffeur mis à jour avec succès.');
    },
    onError: (error: Error | unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue.';
      toast.error(`Erreur lors de la mise à jour du coiffeur : ${errorMessage}`);
    },
  });

  // Supprimer un coiffeur
  const deleteBarber = useMutation({
    mutationFn: async (id: string) => {
      const token = getToken();
      const response = await axios.delete(`${API_URL}/barber/${id}/admin/delete`, {
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
    onSuccess: (_, barberId) => {
      queryClient.setQueryData(['barbers'], (oldData: Barber[] | undefined) => {
        return oldData?.filter((b) => b.id !== barberId);
      });
      toast.success('Coiffeur supprimé avec succès.');
    },
    onError: (error: Error | unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue.';
      if (errorMessage.includes('réservé aux superviseurs')) {
        toast.error('Cette action est réservée aux superviseurs.');
      } else {
        toast.error(`Erreur lors de la suppression du coiffeur : ${errorMessage}`);
      }
    },
  });

  const createSchedule = useMutation({
    mutationFn: async (scheduleData: ScheduleForm) => {
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
      queryClient.invalidateQueries({ queryKey: ['barberSchedules', variables.barberId] });
    },
    onError: (error: Error | unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue.';
      toast.error(`Erreur lors de la création de l'emploi du temps : ${errorMessage}`);
    },
  });

  // Récupérer les emplois du temps d'un coiffeur spécifique
  const useBarberSchedules = (barberId?: string) => {
    return useQuery({
      queryKey: ['barberSchedules', barberId],
      queryFn: async () => {
        try {
          const token = getToken();
          const response = await axios.get<Schedule[]>(`${API_URL}/schedule/${barberId}/barber`, {
            headers: token
              ? {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                  'ngrok-skip-browser-warning': 'true',
                  Accept: 'application/json',
                }
              : undefined,
          });
          return handleResponse<Schedule[]>(response);
        } catch (error) {
          throw new Error('Erreur lors du chargement des emplois du temps. Veuillez réessayer.');
        }
      },
      enabled: !!barberId,
    });
  };
  
  // Supprimer un emploi du temps
  const deleteSchedule = useMutation({
    mutationFn: async ({ scheduleId, barberId }: { scheduleId: string; barberId: string }) => {
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
      return { response: handleResponse<void>(response), barberId };
    },
    onSuccess: (data) => {
      // Invalider la requête pour ce coiffeur spécifique
      queryClient.invalidateQueries({ queryKey: ['barberSchedules', data.barberId] });
      toast.success('Emploi du temps supprimé avec succès.');
    },
    onError: (error: Error | unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue.';
      toast.error(`Erreur lors de la suppression de l'emploi du temps : ${errorMessage}`);
    },
  });

  // NOUVELLE MÉTHODE: Supprimer tous les emplois du temps de tous les coiffeurs
  const deleteAllSchedules = useMutation({
    mutationFn: async () => {
      const token = getToken();
      const response = await axios.delete(`${API_URL}/schedule/admin/delete-all`, {
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
    onSuccess: () => {
      // Invalider toutes les requêtes d'emplois du temps
      queryClient.invalidateQueries({ queryKey: ['barberSchedules'] });
      toast.success('Tous les emplois du temps ont été supprimés avec succès.');
    },
    onError: (error: Error | unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue.';
      if (errorMessage.includes('réservé aux superviseurs')) {
        toast.error('Cette action est réservée aux superviseurs.');
      } else {
        toast.error(`Erreur lors de la suppression des emplois du temps : ${errorMessage}`);
      }
    },
  });

  // NOUVELLE MÉTHODE: Supprimer tous les emplois d'un coiffeur spécifque
  const deleteAllBarberSchedules = useMutation({
    mutationFn: async (barberId: string) => {
      const token = getToken();
      const response = await axios.delete(`${API_URL}/schedule/${barberId}/barber/delete-all`, {
          headers: token
        ? {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
            Accept: 'application/json',
          }
        : undefined,
      });
      return { response: handleResponse<void>(response), barberId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['barberSchedules', data.barberId] });
      toast.success('Tous les emplois du temps du coiffeur ont été supprimés avec succès.');
    },
    onError: (error: Error | unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue.';
      toast.error(`Erreur lors de la suppression des emplois du temps : ${errorMessage}`);
    },
  });



  return {
    barbers,
    createBarber,
    updateBarber,
    deleteBarber,
    createSchedule,
    useBarberSchedules,
    deleteSchedule,
    deleteAllBarberSchedules,
    deleteAllSchedules
  };
};