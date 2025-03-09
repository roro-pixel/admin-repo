import { useState, useEffect } from 'react';
import { useBarbers } from '../hooks/useBarbers';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Barber, ScheduleForm } from '../types';
import { Plus, Edit2, Calendar, Phone, Mail, Loader, Trash } from 'lucide-react';
import { toast } from 'react-toastify';

// Schéma de validation pour les coiffeurs
const barberSchema = z.object({
  firstname: z.string().nonempty("Le prénom est requis"),
  lastname: z.string().nonempty("Le nom est requis"),
  email: z.string().email("Email invalide"),
  phone: z.string()
    .refine(val => !val || /^0\d{8}$/.test(val), { 
      message: "Le numéro doit commencer par 0 et contenir 9 chiffres au total" 
    }),
  description: z.string(), // Champ description
  available: z.boolean(), // Champ available
});

// Schéma de validation pour l'emploi du temps
const scheduleSchema = z.object({
  id: z.string().nonempty("L'ID du coiffeur est requis"),
  dayOfWeek: z.number().min(1).max(6, "Le jour de la semaine doit être compris entre 1 (lundi) et 6 (samedi)"),
  startHour: z.string().nonempty("L'heure de début est requise"),
  startMinute: z.string().nonempty("Les minutes de début sont requises"),
  endHour: z.string().nonempty("L'heure de fin est requise"),
  endMinute: z.string().nonempty("Les minutes de fin sont requises"),
  startTime: z.date().optional(), // Ce champ sera généré dynamiquement
  endTime: z.date().optional(), // Ce champ sera généré dynamiquement
  isRecurring: z.boolean(),
  effectiveFrom: z.string()
    .nonempty("La date de début est requise")
    .refine(val => {
      const selectedDate = new Date(val);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Ignorer l'heure pour la comparaison
      return selectedDate >= today;
    }, { message: "La date de début ne peut pas être dans le passé" }),
  effectiveTo: z.string()
    .nonempty("La date de fin est requise")
    .refine(val => {
      const selectedDate = new Date(val);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Ignorer l'heure pour la comparaison
      return selectedDate >= today;
    }, { message: "La date de fin ne peut pas être dans le passé" }),
});

type BarberForm = z.infer<typeof barberSchema>;
type ScheduleFormInput = z.infer<typeof scheduleSchema>;

// Fonction pour formater le numéro de téléphone
const formatPhoneNumber = (phone: string | undefined): string => {
  if (!phone) return '';
  if (phone.length === 9 && phone.startsWith('0')) return phone;
  if (phone.length === 8) return `0${phone}`;
  return phone;
};

// Fonction pour générer les options d'heures
const generateHourOptions = (start: number, end: number) => {
  const hours = [];
  for (let i = start; i <= end; i++) {
    hours.push(i.toString().padStart(2, '0'));
  }
  return hours;
};

// Fonction pour générer les options de minutes
const generateMinuteOptions = (interval: number) => {
  const minutes = [];
  for (let i = 0; i < 60; i += interval) {
    minutes.push(i.toString().padStart(2, '0'));
  }
  return minutes;
};

const Barbers = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedBarberForSchedule, setSelectedBarberForSchedule] = useState<Barber | null>(null);
  const { barbers, createBarber, updateBarber, deleteBarber, createSchedule } = useBarbers();
  const { data = [], isLoading, isError } = barbers;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    watch,
  } = useForm<BarberForm>({
    resolver: zodResolver(barberSchema),
  });

  const {
    register: registerSchedule,
    handleSubmit: handleSubmitSchedule,
    reset: resetSchedule,
    formState: { errors: errorsSchedule },
    setValue: setScheduleValue,
    watch: watchSchedule,
  } = useForm<ScheduleFormInput>({
    resolver: zodResolver(scheduleSchema),
  });

  // Surveiller le numéro de téléphone pour le formater si nécessaire
  const phoneValue = watch('phone');
  useEffect(() => {
    if (phoneValue && !phoneValue.startsWith('0') && phoneValue.length === 8) {
      setValue('phone', `0${phoneValue}`);
    }
  }, [phoneValue, setValue]);

  // Surveiller les heures et minutes pour les concaténer
  const startHour = watchSchedule('startHour');
  const startMinute = watchSchedule('startMinute');
  const endHour = watchSchedule('endHour');
  const endMinute = watchSchedule('endMinute');

  useEffect(() => {
    if (startHour && startMinute) {
      const startTime = new Date();
      startTime.setHours(Number(startHour), Number(startMinute), 0, 0);
      setScheduleValue('startTime', startTime);
    }
  }, [startHour, startMinute, setScheduleValue]);

  useEffect(() => {
    if (endHour && endMinute) {
      const endTime = new Date();
      endTime.setHours(Number(endHour), Number(endMinute), 0, 0);
      setScheduleValue('endTime', endTime);
    }
  }, [endHour, endMinute, setScheduleValue]);

  // Ouvrir le modal pour éditer un coiffeur
  const openEditModal = (barber: Barber) => {
    setSelectedBarber(barber);
    setValue('firstname', barber.firstname);
    setValue('lastname', barber.lastname);
    setValue('email', barber.email);
    setValue('phone', formatPhoneNumber(barber.phone));
    setValue('description', barber.description);
    setValue('available', barber.available);
    setIsModalOpen(true);
  };

  // Soumettre le formulaire de coiffeur
  const onSubmit = async (data: BarberForm) => {
    try {
      const formattedPhone = formatPhoneNumber(data.phone);
      const barberData: Barber = {
        id: selectedBarber?.id || '',
        firstname: data.firstname,
        lastname: data.lastname,
        email: data.email,
        phone: formattedPhone,
        description: data.description,
        available: data.available,
      };

      if (selectedBarber) {
        await updateBarber.mutateAsync(barberData);
        toast.success('Coiffeur mis à jour avec succès');
      } else {
        await createBarber.mutateAsync(barberData);
        toast.success('Coiffeur créé avec succès');
      }
      setIsModalOpen(false);
      reset();
    } catch (error) {
      toast.error('Erreur lors de la soumission du formulaire');
      console.error(error);
    }
  };

  // Supprimer un coiffeur
  const handleDeleteClick = async (barberId: string) => {
    try {
      await deleteBarber.mutateAsync(barberId);
      toast.success('Coiffeur supprimé avec succès');
    } catch (error) {
      toast.error('Erreur lors de la suppression du coiffeur');
      console.error(error);
    }
  };

  // Soumettre le formulaire d'emploi du temps
  const onSubmitSchedule = async (data: ScheduleFormInput) => {
    try {
      if (!selectedBarberForSchedule) {
        throw new Error("Aucun coiffeur sélectionné");
      }

      const scheduleData: ScheduleForm = {
        id: selectedBarberForSchedule.id, // ID du coiffeur
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime!, // Utilisez startTime généré dynamiquement
        endTime: data.endTime!, // Utilisez endTime généré dynamiquement
        isRecurring: data.isRecurring,
        effectiveFrom: data.effectiveFrom,
        effectiveTo: data.effectiveTo,
      };

      await createSchedule.mutateAsync(scheduleData);
      setIsScheduleModalOpen(false);
      resetSchedule();
      toast.success('Emploi du temps créé avec succès');
    } catch (error) {
      toast.error('Erreur lors de la création de l\'emploi du temps');
      console.error(error);
    }
  };

  // Ouvrir le modal pour générer un emploi du temps
  const openScheduleModal = (barber: Barber) => {
    setSelectedBarberForSchedule(barber);
    setScheduleValue('id', barber.id); // Pré-remplir l'ID du coiffeur
    setIsScheduleModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center text-red-600 py-8">
        Une erreur est survenue lors du chargement des coiffeurs
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des coiffeurs</h1>
        <button
          onClick={() => {
            setSelectedBarber(null);
            reset();
            setIsModalOpen(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
          aria-label="Ajouter un nouveau coiffeur"
        >
          <Plus className="w-4 h-4" />
          Nouveau coiffeur
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data && data.length > 0 ? (
          data.map(({ id, firstname, lastname, email, phone, description, available }: Barber) => (
            <div key={id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900">
                    {firstname} {lastname}
                  </h3>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span className="text-sm">{formatPhoneNumber(phone) || 'Non renseigné'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm">{email}</span>
                    </div>
                  </div>
                  {description && (
                    <p className="text-sm text-gray-600 mt-2">{description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal({ 
                      id, 
                      firstname, 
                      lastname, 
                      email, 
                      phone, 
                      description, 
                      available 
                    })}
                    className="text-gray-600 hover:text-blue-600 p-1"
                    aria-label={`Modifier ${firstname} ${lastname}`}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openScheduleModal({ 
                      id, 
                      firstname, 
                      lastname, 
                      email, 
                      phone, 
                      description, 
                      available 
                    })}
                    className="text-gray-600 hover:text-blue-600 p-1"
                    aria-label={`Gérer la disponibilité de ${firstname} ${lastname}`}
                  >
                    <Calendar className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(String(id))}
                    className="text-gray-600 hover:text-red-600 p-1"
                    aria-label={`Supprimer ${firstname} ${lastname}`}
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <span
                  className={`w-2 h-2 rounded-full ${
                    available ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  aria-hidden="true"
                />
                <span className="text-sm text-gray-600">
                  {available ? 'Disponible' : 'Indisponible'}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center text-gray-500 py-8">
            Aucun coiffeur disponible
          </div>
        )}
      </div>

      {/* Modal pour créer/modifier un coiffeur */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 max-w-[90%]">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">
              {selectedBarber ? 'Modifier le coiffeur' : 'Nouveau coiffeur'}
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  Prénom
                </label>
                <input 
                  id="firstName"
                  {...register('firstname')} 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Entrez le prénom"
                />
                {errors.firstname && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstname.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Nom
                </label>
                <input 
                  id="lastName"
                  {...register('lastname')} 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Entrez le nom"
                />
                {errors.lastname && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastname.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input 
                  id="email"
                  {...register('email')} 
                  type="email"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="exemple@email.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="barberPhone" className="block text-sm font-medium text-gray-700">
                  Téléphone
                </label>
                <input 
                  id="barberPhone"
                  {...register('phone')} 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="0XXXXXXXX"
                />
                <p className="mt-1 text-xs text-gray-500">Format: 0XXXXXXXX (9 chiffres)</p>
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="barberDescription" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="barberDescription"
                  {...register('description')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 resize-none"
                  rows={3}
                  placeholder="Description du coiffeur"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  {...register('available')} 
                  id="available"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="available" className="text-sm font-medium text-gray-700">
                  Disponible
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    reset();
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900"
                  aria-label="Annuler"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                  aria-label={selectedBarber ? 'Modifier le coiffeur' : 'Créer le coiffeur'}
                >
                  {selectedBarber ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal pour générer un emploi du temps */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 max-w-[90%]">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">
              Générer un emploi du temps pour {selectedBarberForSchedule?.firstname} {selectedBarberForSchedule?.lastname}
            </h2>
            <form onSubmit={handleSubmitSchedule(onSubmitSchedule)} className="space-y-4">
              <div>
                <label htmlFor="dayOfWeek" className="block text-sm font-medium text-gray-700">
                  Jour de la semaine
                </label>
                <select
                  id="dayOfWeek"
                  {...registerSchedule('dayOfWeek', { valueAsNumber: true })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value={1}>Lundi</option>
                  <option value={2}>Mardi</option>
                  <option value={3}>Mercredi</option>
                  <option value={4}>Jeudi</option>
                  <option value={5}>Vendredi</option>
                  <option value={6}>Samedi</option>
                </select>
                {errorsSchedule.dayOfWeek && (
                  <p className="mt-1 text-sm text-red-600">{errorsSchedule.dayOfWeek.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                  Heure de début
                </label>
                <div className="flex gap-2">
                  <select
                    id="startHour"
                    {...registerSchedule('startHour')}
                    className="mt-1 block w-1/2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    {generateHourOptions(8, 18).map((hour) => (
                      <option key={hour} value={hour}>
                        {hour}
                      </option>
                    ))}
                  </select>
                  <select
                    id="startMinute"
                    {...registerSchedule('startMinute')}
                    className="mt-1 block w-1/2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    {generateMinuteOptions(30).map((minute) => (
                      <option key={minute} value={minute}>
                        {minute}
                      </option>
                    ))}
                  </select>
                </div>
                {errorsSchedule.startTime && (
                  <p className="mt-1 text-sm text-red-600">{errorsSchedule.startTime.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
                  Heure de fin
                </label>
                <div className="flex gap-2">
                  <select
                    id="endHour"
                    {...registerSchedule('endHour')}
                    className="mt-1 block w-1/2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    {generateHourOptions(9, 19).map((hour) => (
                      <option key={hour} value={hour}>
                        {hour}
                      </option>
                    ))}
                  </select>
                  <select
                    id="endMinute"
                    {...registerSchedule('endMinute')}
                    className="mt-1 block w-1/2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    {generateMinuteOptions(30).map((minute) => (
                      <option key={minute} value={minute}>
                        {minute}
                      </option>
                    ))}
                  </select>
                </div>
                {errorsSchedule.endTime && (
                  <p className="mt-1 text-sm text-red-600">{errorsSchedule.endTime.message}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...registerSchedule('isRecurring')}
                  id="isRecurring"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isRecurring" className="text-sm font-medium text-gray-700">
                  Récurrent
                </label>
              </div>
              <div>
                <label htmlFor="effectiveFrom" className="block text-sm font-medium text-gray-700">
                  Date de début
                </label>
                <input
                  id="effectiveFrom"
                  type="date"
                  {...registerSchedule('effectiveFrom')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  min={new Date().toISOString().split('T')[0]} // Bloquer les dates passées
                />
                {errorsSchedule.effectiveFrom && (
                  <p className="mt-1 text-sm text-red-600">{errorsSchedule.effectiveFrom.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="effectiveTo" className="block text-sm font-medium text-gray-700">
                  Date de fin
                </label>
                <input
                  id="effectiveTo"
                  type="date"
                  {...registerSchedule('effectiveTo')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  min={new Date().toISOString().split('T')[0]} // Bloquer les dates passées
                />
                {errorsSchedule.effectiveTo && (
                  <p className="mt-1 text-sm text-red-600">{errorsSchedule.effectiveTo.message}</p>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsScheduleModalOpen(false);
                    resetSchedule();
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900"
                  aria-label="Annuler"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                  aria-label="Générer l'emploi du temps"
                >
                  Générer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Barbers;