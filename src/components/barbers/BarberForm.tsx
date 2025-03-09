import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../common/Button';
import type { Barber } from '../../types';
import { phoneSchema } from '../../utils/validation';

const barberSchema = z.object({
  userId: z.string(),
  barberPhone: phoneSchema,
  barberDescription: z.string(),
  available: z.boolean(),
});

type BarberFormData = z.infer<typeof barberSchema>;

interface BarberFormProps {
  barber?: Barber;
  onSubmit: (data: BarberFormData) => Promise<void>;
  onCancel: () => void;
}

export const BarberForm: React.FC<BarberFormProps> = ({
  barber,
  onSubmit,
  onCancel,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BarberFormData>({
    resolver: zodResolver(barberSchema),
    defaultValues: barber,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Téléphone
        </label>
        <input
          type="tel"
          {...register('barberPhone')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
        {errors.barberPhone && (
          <p className="mt-1 text-sm text-red-600">
            {errors.barberPhone.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          {...register('barberDescription')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          rows={3}
        />
        {errors.barberDescription && (
          <p className="mt-1 text-sm text-red-600">
            {errors.barberDescription.message}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          {...register('available')}
          className="rounded border-gray-300"
        />
        <label className="text-sm font-medium text-gray-700">
          Disponible
        </label>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {barber ? 'Modifier' : 'Créer'}
        </Button>
      </div>
    </form>
  );
};