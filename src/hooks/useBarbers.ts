import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useAuth } from './useAuth';
import axios, { AxiosResponse } from 'axios';
import type { Barber, ScheduleForm } from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

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

export const useBarbers = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const barbers = useQuery({
    queryKey: ['barbers'],
    queryFn: async () => {
      try {
        const token = getToken();
        const response = await api.get<Barber[]>('/barber/all', {
          headers: token ? {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
            'Accept': 'application/json'
          } : undefined
        });
        return handleResponse<Barber[]>(response);
      } catch (error) {
        toast.error('Erreur lors de la récupération des coiffeurs');
        throw error;
      }
    }
  });

  const createBarber = useMutation({
    mutationFn: async (barber: Omit<Barber, 'id'>) => {
      const token = getToken();
      const response = await api.post<Barber>('/barber/', barber, {
        headers: token ? {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json'
        } : undefined
      });
      return handleResponse<Barber>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barbers'] });
      toast.success('Coiffeur créé avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de la création du coiffeur');
      console.error(error);
    },
  });

  const updateBarber = useMutation({
    mutationFn: async (barber: Barber) => {
      const token = getToken();
      const response = await api.put<Barber>(`/barber/${barber.id}/admin/update`, barber, {
        headers: token ? {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json'
        } : undefined
      });
      return handleResponse<Barber>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barbers'] });
      toast.success('Coiffeur mis à jour avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour du coiffeur');
      console.error(error);
    },
  });

  const deleteBarber = useMutation({
    mutationFn: async (barberId: string) => {
      const token = getToken();
      const response = await api.delete(`/barber/${barberId}/admin/delete`, {
        headers: token ? {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json'
        } : undefined
      });
      return handleResponse<void>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barbers'] });
      toast.success('Coiffeur supprimé avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de la suppression du coiffeur');
      console.error(error);
    },
  });

  const createSchedule = useMutation({
    mutationFn: async (scheduleData: ScheduleForm) => {
      const token = getToken();
      const response = await api.post('/schedule/create', scheduleData, {
        headers: token ? {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json'
        } : undefined
      });
      return handleResponse<void>(response);
    },
    onSuccess: () => {
      toast.success('Emploi du temps créé avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de la création de l\'emploi du temps');
      console.error(error);
    },
  });

  return {
    barbers,  
    createBarber,
    updateBarber,
    deleteBarber,
    createSchedule,
  };
};