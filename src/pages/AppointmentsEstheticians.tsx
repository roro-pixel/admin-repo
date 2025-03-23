import { useState, useMemo } from 'react';
import { useAppointmentEstheticians } from '../hooks/useAppointmentEstheticians';
import { useEstheticians } from '../hooks/useEstheticians';
import { useClients } from '../hooks/useClients';
import { useBeautyServices } from '../hooks/useBeautyServices';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { EstheticianAppointment, Client, Esthetician, BeautyService, CreateEstheticianAppointmentData, UpdateEstheticianAppointmentData } from '../types';
import { Plus, X, Check, Clock } from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useQueryClient } from '@tanstack/react-query';

// Schéma de validation Zod pour le formulaire de rendez-vous
const appointmentSchema = z.object({
  email: z.string().email('Email du client requis et valide'),
  estheticianId: z.string().nonempty('L\'esthéticienne est requise'),
  estheticType: z.string().nonempty('Le service est requis'),
  appointmentDate: z.string().nonempty('La date est requise'),
  appointmentTime: z.string().nonempty('L\'heure est requise'),
});

// Type pour le formulaire de rendez-vous
type AppointmentForm = z.infer<typeof appointmentSchema>;

// Type pour les disponibilités
interface AvailableTime {
  id: number;
  estheticianId: string;
  starTime: string;
  endTime: string;
  available: boolean;
}

const AppointmentsEstheticians = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<EstheticianAppointment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]); // Date par défaut : aujourd'hui
  const [availableTimes, setAvailableTimes] = useState<AvailableTime[]>([]);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);

  // Utilisation des hooks avec destructuring correct
  const { estheticianAppointments, createEstheticianAppointment, updateEstheticianAppointment, cancelEstheticianAppointment, completeEstheticianAppointment } = useAppointmentEstheticians();
  const { estheticians } = useEstheticians();
  const { clients } = useClients();
  const { beautyServices } = useBeautyServices();

  const today = useMemo(() => new Date(), []);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AppointmentForm>({
    resolver: zodResolver(appointmentSchema),
  });

  // Fonctions utilitaires pour la gestion des disponibilités
  const isToday = (date: string): boolean => {
    const selected = new Date(date);
    return selected.toDateString() === today.toDateString();
  };

  const adjustAvailableTimes = (times: AvailableTime[]): AvailableTime[] => {
    if (!isToday(selectedDate)) return times;   
    const currentTime = new Date();
    return times.filter(slot => {
      const slotTime = new Date(slot.starTime);
      // Ajoute une marge de 2 heures
      return slotTime.getTime() > currentTime.getTime() + 7200 * 1000;
    });
  };

  // Récupérer les disponibilités pour une esthéticienne et une date donnée
  const fetchAvailability = async (estheticianId: string, date: string): Promise<void> => {
    setIsLoadingAvailability(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/availability/esthetician/${estheticianId}/slot?date=${date}`, {
        headers: token ? {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json'
        } : undefined
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des disponibilités');
      }

      const data: AvailableTime[] = await response.json();
      const adjustedTimes = adjustAvailableTimes(data);
      setAvailableTimes(adjustedTimes);

      if (adjustedTimes.length === 0) {
        toast.warning('Aucun horaire disponible pour cette date. Veuillez choisir une autre date.');
      }
    } catch (error: unknown) {
      toast.error('Erreur lors de la récupération des disponibilités');
      setAvailableTimes([]);
    } finally {
      setIsLoadingAvailability(false);
    }
  };

  // Gérer le changement de date
  const handleDateChange = (date: string): void => {
    setSelectedDate(date);
    setAvailableTimes([]);
    setValue('appointmentTime', ''); // Réinitialiser l'heure sélectionnée

    const estheticianId = watch('estheticianId');
    if (estheticianId) {
      fetchAvailability(estheticianId, date);
    }
  };

  // Gérer le changement d'esthéticienne
  const handleEstheticianChange = (estheticianId: string): void => {
    if (selectedDate && estheticianId) {
      fetchAvailability(estheticianId, selectedDate);
    }
  };

  // Ouvrir le modal de modification avec les données du rendez-vous sélectionné
  const openEditModal = (appointment: EstheticianAppointment): void => {
    setSelectedAppointment(appointment);

    // Trouver le client pour récupérer l'email
    const client = clients.data?.find((c: Client) => c.id === appointment.clientId);

    // Séparer la date et l'heure
    const appointmentDateTime = new Date(appointment.appointmentTime);
    const dateString = appointmentDateTime.toISOString().split('T')[0];
    const timeString = appointmentDateTime.toISOString().split('T')[1].substring(0, 5);

    setValue('email', client?.email || '');
    setValue('estheticianId', appointment.estheticianId || '');
    setValue('estheticType', appointment.estheticType || '');
    setValue('appointmentDate', dateString);
    setValue('appointmentTime', timeString);

    setSelectedDate(dateString);
    fetchAvailability(appointment.estheticianId, dateString);
    setIsModalOpen(true);
  };

  // Soumettre le formulaire
  const onSubmit = async (data: AppointmentForm): Promise<void> => {
    // Construire la date et l'heure complètes en UTC
    const [year, month, day] = data.appointmentDate.split('-').map(Number);
    const [hours, minutes] = data.appointmentTime.split(':').map(Number);

    // Créer une date en UTC
    const fullDateTime = new Date(Date.UTC(year, month - 1, day, hours, minutes));

    // Vérifier si le créneau est disponible
    const isSlotAvailable = availableTimes.some(
      (slot) => slot.starTime.split('T')[1].substring(0, 5) === data.appointmentTime
    );

    if (!isSlotAvailable) {
      toast.error('Le créneau sélectionné n\'est plus disponible');
      return;
    }

    try {
      if (selectedAppointment) {
        // Données pour la mise à jour
        const appointmentUpdateData: UpdateEstheticianAppointmentData = {
          id: selectedAppointment.id,
          email: data.email,
          estheticianId: data.estheticianId,
          estheticType: data.estheticType,
          appointmentTime: fullDateTime, // Envoyer la date en UTC
        };

        // Mettre à jour le rendez-vous
        await updateEstheticianAppointment.mutateAsync(appointmentUpdateData, {
          onSuccess: () => {
            toast.success('Rendez-vous mis à jour avec succès');
            setIsModalOpen(false);
            reset();
            queryClient.invalidateQueries({ queryKey: ['estheticianAppointments'] });
          },
          onError: () => {
            toast.error('Erreur lors de la mise à jour du rendez-vous');
          },
        });
      } else {
        // Données pour la création
        const appointmentCreateData: CreateEstheticianAppointmentData = {
          email: data.email,
          estheticianId: data.estheticianId,
          estheticType: data.estheticType,
          appointmentTime: fullDateTime, // Envoyer la date en UTC
        };

        // Créer un nouveau rendez-vous
        await createEstheticianAppointment.mutateAsync(appointmentCreateData, {
          onSuccess: () => {
            toast.success('Rendez-vous créé avec succès');
            setIsModalOpen(false);
            reset();
            queryClient.invalidateQueries({ queryKey: ['estheticianAppointments'] });
          },
          onError: () => {
            toast.error('Erreur lors de la création du rendez-vous');
          },
        });
      }
    } catch (error: unknown) {
      // console.error(error);
    }
  };

  // Annuler un rendez-vous
  const handleCancel = async (id: string): Promise<void> => {
    try {
      await cancelEstheticianAppointment.mutateAsync(id, {
        onSuccess: () => {
          toast.success('Rendez-vous annulé avec succès');
          queryClient.invalidateQueries({ queryKey: ['estheticianAppointments'] });
        },
        onError: () => {
          toast.error('Erreur lors de l\'annulation du rendez-vous');
        },
      });
    } catch (error: unknown) {
      // console.error(error);
    }
  };

  // Terminer un rendez-vous
  const handleComplete = async (id: string): Promise<void> => {
    try {
      await completeEstheticianAppointment.mutateAsync(id, {
        onSuccess: () => {
          toast.success('Rendez-vous marqué comme terminé');
          queryClient.invalidateQueries({ queryKey: ['estheticianAppointments'] });
        },
        onError: () => {
          toast.error('Erreur lors de la complétion du rendez-vous');
        },
      });
    } catch (error: unknown) {
      console.error(error);
    }
  };

  // Filtrer les rendez-vous en fonction de la recherche et de la date
  const filteredAppointments = estheticianAppointments.data?.filter((appointment: EstheticianAppointment) => {
    const appointmentDate = appointment.appointmentTime ? new Date(appointment.appointmentTime).toISOString().split('T')[0] : '';
    const matchesDate = selectedDate ? appointmentDate === selectedDate : true;

    return (
      matchesDate &&
      (
        (appointment.id?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (appointment.clientFirstname?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (appointment.clientLastname?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (appointment.estheticianFirstname?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (appointment.estheticianLastname?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (appointment.estheticType?.toLowerCase() || '').includes(searchQuery.toLowerCase())
      )
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestion des rendez-vous (Esthéticiennes)</h1>
        <button
          onClick={() => {
            setSelectedAppointment(null);
            reset();
            setIsModalOpen(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nouveau rendez-vous
        </button>
      </div>

      <div className="flex justify-end gap-2">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-64 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          placeholder="Rechercher un rendez-vous..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-64 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID du rendez-vous
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Esthéticienne
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Service
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAppointments?.map((appointment: EstheticianAppointment) => (
              <tr key={appointment.id}>
                <td className="px-6 py-4 whitespace-nowrap">{appointment.id || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {appointment.appointmentTime
                    ? new Date(appointment.appointmentTime).toLocaleString()
                    : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {appointment.estheticianFirstname || 'N/A'} {appointment.estheticianLastname || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {appointment.clientFirstname || 'N/A'} {appointment.clientLastname || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {appointment.estheticType || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      appointment.status === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-800'
                        : appointment.status === 'CONFIRMED'
                        ? 'bg-green-100 text-green-800'
                        : appointment.status === 'PROGRESSION'
                        ? 'bg-blue-100 text-blue-800'
                        : appointment.status === 'COMPLETED'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {appointment.status || 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {appointment.status === 'PROGRESSION' && (
                    <button
                      onClick={() => handleComplete(appointment.id)}
                      className="text-green-600 hover:text-green-900 mr-2 flex items-center"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Terminer
                    </button>
                  )}
                  {appointment.status === 'CONFIRMED' && (
                    <>
                      <button
                        onClick={() => openEditModal(appointment)}
                        className="text-blue-600 hover:text-blue-900 mr-2"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleComplete(appointment.id)}
                        className="text-green-600 hover:text-green-900 mr-2 flex items-center"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Terminer
                      </button>
                      <button
                        onClick={() => handleCancel(appointment.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <X className="w-4 h-4" />
                        Annuler
                      </button>
                    </>
                  )}
                  {appointment.status === 'COMPLETED' && (
                    <span className="text-gray-500 italic">Rendez-vous terminé</span>
                  )}
                  {appointment.status === 'CANCELLED_BY_PROVIDER' && (
                    <span className="text-gray-500 italic">Rendez-vous annulé</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-semibold mb-4">
              {selectedAppointment ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'}
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email du client
                </label>
                <input
                  type="email"
                  {...register('email')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  placeholder="email@example.com"
                />
                {errors.email && (
                  <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Esthéticienne
                </label>
                <select
                  {...register('estheticianId')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  onChange={(e) => {
                    const value = e.target.value;
                    handleEstheticianChange(value);
                  }}
                >
                  <option value="">Sélectionner une esthéticienne</option>
                  {estheticians.data?.map((esthetician: Esthetician) => (
                    <option key={esthetician.id} value={esthetician.id}>
                      {esthetician.firstname} {esthetician.lastname}
                    </option>
                  ))}
                </select>
                {errors.estheticianId && (
                  <p className="text-red-600 text-sm mt-1">{errors.estheticianId.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Service
                </label>
                <select
                  {...register('estheticType')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                >
                  <option value="">Sélectionner un service</option>
                  {beautyServices.data?.map((service: BeautyService) => (
                    <option key={service.id} value={service.type}>
                      {service.type} - {service.price}FCFA
                    </option>
                  ))}
                </select>
                {errors.estheticType && (
                  <p className="text-red-600 text-sm mt-1">{errors.estheticType.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Date
                </label>
                <input
                  type="date"
                  {...register('appointmentDate')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  min={today.toISOString().split('T')[0]}
                  onChange={(e) => handleDateChange(e.target.value)}
                />
                {errors.appointmentDate && (
                  <p className="text-red-600 text-sm mt-1">{errors.appointmentDate.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Heure
                </label>
                <select
                  {...register('appointmentTime')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  disabled={!watch('estheticianId') || !selectedDate || isLoadingAvailability}
                >
                  <option value="">
                    {isLoadingAvailability ? 'Chargement...' : 'Choisir une heure'}
                  </option>
                  {availableTimes && availableTimes.length > 0 ? (
                    availableTimes.map((slot) => (
                      <option
                        key={slot.id}
                        value={slot.starTime.split('T')[1].substring(0, 5)}
                        disabled={!slot.available}
                      >
                        {slot.starTime.split('T')[1].substring(0, 5)}
                      </option>
                    ))
                  ) : (
                    <option value="">
                      {!selectedDate
                        ? "Veuillez d'abord sélectionner une date"
                        : !watch('estheticianId')
                        ? 'Veuillez sélectionner une esthéticienne'
                        : 'Aucun horaire disponible'}
                    </option>
                  )}
                </select>
                {errors.appointmentTime && (
                  <p className="text-red-600 text-sm mt-1">{errors.appointmentTime.message}</p>
                )}
                {isLoadingAvailability && (
                  <p className="text-gray-600 text-sm mt-1">Chargement des disponibilités...</p>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  {selectedAppointment ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentsEstheticians;