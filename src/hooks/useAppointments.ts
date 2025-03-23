import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useAuth } from './useAuth';
import axios, { AxiosResponse } from 'axios';
import type { Appointment } from '../types';

type CreateAppointmentData = {
  email: string;
  barberId: string;
  haircutType: string;
  appointmentTime: Date;
};

type UpdateAppointmentData = {
  id: string;
  email: string;
  barberId: string;
  haircutType: string;
  appointmentTime: Date;
};

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

export const useAppointments = () => {
  const { getToken } = useAuth(); // Utilisation de useAuth pour obtenir le token
  const queryClient = useQueryClient();

  const appointments = useQuery({
    queryKey: ['appointments'],
    queryFn: async () => {
      try {
        const token = getToken();
        const response = await api.get<Appointment[]>('/appointment/barber/all', {
          headers: token ? {
            'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json'
          } : undefined
        });
        return handleResponse<Appointment[]>(response);
      } catch (error) {
        toast.error('Erreur lors de la récupération des rendez-vous');
        throw error;
      }
    }
  });

  const createAppointment = useMutation({
    mutationFn: async (appointment: CreateAppointmentData) => {
      const token = getToken();
      const response = await api.post<Appointment>('/appointment/', appointment, {
        headers: token ? {
          'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        'Accept': 'application/json'
        } : undefined
      });
      return handleResponse<Appointment>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      // toast.success('Rendez-vous créé avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de la création du rendez-vous');
      // console.error(error);
    },
  });

  const updateAppointment = useMutation({
    mutationFn: async (appointment: UpdateAppointmentData) => {
      const token = getToken();
      const response = await api.put<Appointment>(`/appointment/${appointment.id}/admin/update`, appointment, {
        headers: token ? {
          'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        'Accept': 'application/json'
        } : undefined
      });
      return handleResponse<Appointment>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      // toast.success('Rendez-vous mis à jour avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour du rendez-vous');
      // console.error(error);
    },
  });

  const cancelAppointment = useMutation({
    mutationFn: async (appointmentId: string) => {
      const token = getToken();
      const response = await api.put<Appointment>(`/appointment/${appointmentId}/admin/cancel`, {}, {
        headers: token ? {
          'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        'Accept': 'application/json'
        } : undefined
      });
      return handleResponse<Appointment>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      // toast.success('Rendez-vous annulé avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de l\'annulation du rendez-vous');
      // console.error(error);
    },
  });

  const completeAppointment = useMutation({
    mutationFn: async (appointmentId: string) => {
      const token = getToken();
      const response = await api.post<Appointment>(`/appointment/${appointmentId}/status/completed`, {}, {
        headers: token ? {
          'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        'Accept': 'application/json'
        } : undefined
      });
      return handleResponse<Appointment>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      // toast.success('Rendez-vous marqué comme terminé');
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour du statut');
      // console.error(error);
    },
  });

  return {
    appointments,
    createAppointment,
    updateAppointment,
    cancelAppointment,
    completeAppointment,
  };
};
