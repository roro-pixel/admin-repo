import React, { useState, useEffect } from 'react';
import { useBeautyServices } from '../hooks/useBeautyServices';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { BeautyService } from '../types';
import { Plus, Edit2, Trash } from 'lucide-react';
import { toast } from 'react-toastify';

// Schéma de validation pour les services de beauté
const beautyServiceSchema = z.object({
  type: z.string().min(1, 'Le type de service est requis.'),
  description: z.string().min(1, 'La description est requise.'),
  duration: z.number().min(1, 'La durée doit être supérieure à 0.'),
  price: z.number().min(0, 'Le prix doit être positif.'),
});

type BeautyServiceFormData = z.infer<typeof beautyServiceSchema>;

const BeautyServices = () => {
  const { beautyServices, createBeautyService, updateBeautyService, deleteBeautyService } = useBeautyServices();
  const [selectedBeautyService, setSelectedBeautyService] = useState<BeautyService | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
  } = useForm<BeautyServiceFormData>({
    resolver: zodResolver(beautyServiceSchema),
    defaultValues: {
      type: '',
      description: '',
      duration: 30,
      price: 0,
    },
  });

  useEffect(() => {
    if (selectedBeautyService) {
      setValue('type', selectedBeautyService.type);
      setValue('description', selectedBeautyService.description);
      setValue('duration', selectedBeautyService.duration);
      setValue('price', selectedBeautyService.price);
    }
  }, [selectedBeautyService, setValue]);

  const onSubmit = async (data: BeautyServiceFormData) => {
    try {
      if (selectedBeautyService) {
        if (!selectedBeautyService.id) {
          toast.error('Erreur : Identifiant du service manquant.');
          return;
        }

        const beautyServiceUpdateData: BeautyService = {
          id: selectedBeautyService.id,
          type: data.type,
          description: data.description,
          duration: data.duration,
          price: data.price,
        };

        await updateBeautyService.mutateAsync(beautyServiceUpdateData);
        // toast.success('Service mis à jour avec succès.');
      } else {
        await createBeautyService.mutateAsync(data);
        // toast.success('Service créé avec succès.');
      }
      setIsModalOpen(false);
      setSelectedBeautyService(null);
      reset();
    } catch (error) {
      // L'erreur est déjà gérée dans le hook, donc pas besoin de la gérer ici
    }
  };

  const handleEditClick = (beautyService: BeautyService) => {
    setSelectedBeautyService(beautyService);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (beautyServiceId: number) => {
    const confirmDelete = window.confirm('Êtes-vous sûr de vouloir supprimer ce service ?');
    if (confirmDelete) {
      try {
        await deleteBeautyService.mutateAsync(String(beautyServiceId));
        // toast.success('Service supprimé avec succès.');
      } catch (error) {
        // L'erreur est déjà gérée dans le hook, donc pas besoin de la gérer ici
      }
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedBeautyService(null);
    reset();
  };

  const filteredBeautyServices = beautyServices.data?.filter((beautyService) =>
    beautyService.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Services de beauté</h1>
        <button
          onClick={() => {
            setSelectedBeautyService(null);
            reset();
            setIsModalOpen(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nouveau service
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Rechercher un service..."
          className="block w-full py-4 px-6 text-lg rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Liste des services</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBeautyServices?.map((beautyService) => (
            <div
              key={beautyService.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{beautyService.type}</h3>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditClick(beautyService)}
                    className="text-gray-600 hover:text-blue-600"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(beautyService.id)}
                    className="text-gray-600 hover:text-red-600"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>{beautyService.description}</p>
                <p>Durée : {beautyService.duration} min</p>
                <p>Prix : {beautyService.price} FCFA</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">
              {selectedBeautyService ? 'Modifier le service' : 'Nouveau service'}
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Type de service
                </label>
                <input
                  type="text"
                  {...register('type')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Ex : Soin du visage"
                />
                {errors.type && (
                  <p className="text-red-600 text-sm mt-1">{errors.type.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                  placeholder="Décrivez le service..."
                />
                {errors.description && (
                  <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Durée (minutes)
                </label>
                <input
                  type="number"
                  {...register('duration', { valueAsNumber: true })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="30"
                />
                {errors.duration && (
                  <p className="text-red-600 text-sm mt-1">{errors.duration.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Prix (FCFA)
                </label>
                <input
                  type="number"
                  {...register('price', { valueAsNumber: true })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="0"
                />
                {errors.price && (
                  <p className="text-red-600 text-sm mt-1">{errors.price.message}</p>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {selectedBeautyService ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BeautyServices;