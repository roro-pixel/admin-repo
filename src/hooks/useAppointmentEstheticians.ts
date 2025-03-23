import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useAuth } from './useAuth';
import axios, { AxiosResponse } from 'axios';
import type { EstheticianAppointment } from '../types';

type CreateEstheticianAppointmentData = {
  email: string;
  estheticianId: string; // Remplace "barberId" par "estheticianId"
  estheticType: string; // Remplace "haircutType" par "beautyServiceType"
  appointmentTime: Date;
};

type UpdateEstheticianAppointmentData = {
  id: string;
  email: string;
  estheticianId: string; // Remplace "barberId" par "estheticianId"
  estheticType: string; // Remplace "haircutType" par "beautyServiceType"
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

export const useAppointmentEstheticians = () => {
  const { getToken } = useAuth(); // Utilisation de useAuth pour obtenir le token
  const queryClient = useQueryClient();

  // Récupérer tous les rendez-vous des esthéticiennes
  const estheticianAppointments = useQuery({
    queryKey: ['estheticianAppointments'],
    queryFn: async () => {
      try {
        const token = getToken();
        const response = await api.get<EstheticianAppointment[]>('/appointment/esthetician/all', {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true',
                Accept: 'application/json',
              }
            : undefined,
        });
        return handleResponse<EstheticianAppointment[]>(response);
      } catch (error) {
        toast.error('Erreur lors de la récupération des rendez-vous des esthéticiennes');
        throw error;
      }
    },
  });

  // Créer un rendez-vous pour une esthéticienne
  const createEstheticianAppointment = useMutation({
    mutationFn: async (appointment: CreateEstheticianAppointmentData) => {
      const token = getToken();
      const response = await api.post<EstheticianAppointment>('/appointment/', appointment, {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true',
              Accept: 'application/json',
            }
          : undefined,
      });
      return handleResponse<EstheticianAppointment>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estheticianAppointments'] });
      toast.success('Rendez-vous créé avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de la création du rendez-vous');
      console.error(error);
    },
  });

  // Mettre à jour un rendez-vous pour une esthéticienne
  const updateEstheticianAppointment = useMutation({
    mutationFn: async (appointment: UpdateEstheticianAppointmentData) => {
      const token = getToken();
      const response = await api.put<EstheticianAppointment>(
        `/appointment/${appointment.id}/admin/update`,
        appointment,
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
      return handleResponse<EstheticianAppointment>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estheticianAppointments'] });
      toast.success('Rendez-vous mis à jour avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour du rendez-vous');
      console.error(error);
    },
  });

  // Annuler un rendez-vous pour une esthéticienne
  const cancelEstheticianAppointment = useMutation({
    mutationFn: async (appointmentId: string) => {
      const token = getToken();
      const response = await api.put<EstheticianAppointment>(
        `/appointment/${appointmentId}/admin/cancel`,
        {},
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
      return handleResponse<EstheticianAppointment>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estheticianAppointments'] });
      toast.success('Rendez-vous annulé avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de l\'annulation du rendez-vous');
      console.error(error);
    },
  });

  // Marquer un rendez-vous comme terminé pour une esthéticienne
  const completeEstheticianAppointment = useMutation({
    mutationFn: async (appointmentId: string) => {
      const token = getToken();
      const response = await api.post<EstheticianAppointment>(
        `/appointment/${appointmentId}/status/completed`,
        {},
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
      return handleResponse<EstheticianAppointment>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estheticianAppointments'] });
      toast.success('Rendez-vous marqué comme terminé');
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour du statut');
      console.error(error);
    },
  });

  return {
    estheticianAppointments,
    createEstheticianAppointment,
    updateEstheticianAppointment,
    cancelEstheticianAppointment,
    completeEstheticianAppointment,
  };
};