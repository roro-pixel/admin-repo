import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../common/Button';
import type { Appointment, Barber, Haircut } from '../../types';

const appointmentSchema = z.object({
  clientId: z.string(),
  barberId: z.string(),
  haircutId: z.string(),
  appointmentTime: z.string(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface AppointmentFormProps {
  appointment?: Appointment;
  barbers: Barber[];
  haircuts: Haircut[];
  onSubmit: (data: AppointmentFormData) => Promise<void>;
  onCancel: () => void;
}

export const AppointmentForm: React.FC<AppointmentFormProps> = ({
  appointment,
  barbers,
  haircuts,
  onSubmit,
  onCancel,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    // Conversion de la date en chaîne au format "yyyy-MM-ddTHH:mm"
    defaultValues: appointment
      ? {
          ...appointment,
          appointmentTime: appointment.appointmentTime.toISOString().slice(0, 16), // Format "yyyy-MM-ddTHH:mm"
        }
      : undefined,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Coiffeur
        </label>
        <select
          {...register('barberId')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        >
          {barbers.map((barber) => (
            <option key={barber.barberId} value={barber.barberId}>
              {barber.barberPhone}
            </option>
          ))}
        </select>
        {errors.barberId && (
          <p className="mt-1 text-sm text-red-600">{errors.barberId.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Prestation
        </label>
        <select
          {...register('haircutId')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        >
          {haircuts.map((haircut) => (
            <option key={haircut.haircutId} value={haircut.haircutId}>
              {haircut.typeHaircut} - {haircut.price}€
            </option>
          ))}
        </select>
        {errors.haircutId && (
          <p className="mt-1 text-sm text-red-600">{errors.haircutId.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Date et heure
        </label>
        <input
          type="datetime-local"
          {...register('appointmentTime')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
        {errors.appointmentTime && (
          <p className="mt-1 text-sm text-red-600">
            {errors.appointmentTime.message}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {appointment ? 'Modifier' : 'Créer'}
        </Button>
      </div>
    </form>
  );
};
