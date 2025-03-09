import React, { useState, useEffect } from 'react';
import { useHaircuts } from '../hooks/useHaircuts';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Haircut } from '../types';
import { Plus, Edit2, Scissors, Trash } from 'lucide-react';
import { toast } from 'react-toastify';

// Schéma Zod correspondant à l'interface Haircut
const haircutSchema = z.object({
  type: z.string().min(1, 'Le type de coupe est requis'),
  description: z.string().min(1, 'La description est requise'),
  duration: z.number().min(1, 'La durée doit être supérieure à 0'),
  price: z.number().min(0, 'Le prix doit être positif'),
});

type HaircutFormData = z.infer<typeof haircutSchema>;

const Services = () => {
  const { haircuts, createHaircut, updateHaircut, deleteHaircut } = useHaircuts();
  const [selectedHaircut, setSelectedHaircut] = useState<Haircut | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
  } = useForm<HaircutFormData>({
    resolver: zodResolver(haircutSchema),
    defaultValues: {
      type: '',
      description: '',
      duration: 30,
      price: 0,
    },
  });

  // Pré-remplir les champs lors de la sélection d'une prestation pour modification
  useEffect(() => {
    if (selectedHaircut) {
      setValue('type', selectedHaircut.type);
      setValue('description', selectedHaircut.description);
      setValue('duration', selectedHaircut.duration);
      setValue('price', selectedHaircut.price);
    }
  }, [selectedHaircut, setValue]);

  const onSubmit = async (data: HaircutFormData) => {
    try {
      if (selectedHaircut) {
        if (!selectedHaircut.id) {
          toast.error('Erreur : ID de la coupe manquant');
          return;
        }

        const haircutUpdateData: Haircut = {
          id: selectedHaircut.id,
          type: data.type,
          description: data.description,
          duration: data.duration,
          price: data.price,
        };

        await updateHaircut.mutateAsync(haircutUpdateData);
        toast.success('Prestation mise à jour avec succès');
      } else {
        await createHaircut.mutateAsync(data);
        toast.success('Nouvelle prestation créée avec succès');
      }
      setIsModalOpen(false);
      setSelectedHaircut(null);
      reset();
    } catch (error) {
      toast.error('Une erreur est survenue lors de l\'opération');
    }
  };

  const handleEditClick = (haircut: Haircut) => {
    setSelectedHaircut(haircut);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (haircutId: string) => {
    try {
      await deleteHaircut.mutateAsync(haircutId);
      toast.success('Prestation supprimée avec succès');
    } catch (error) {
      toast.error('Erreur lors de la suppression de la prestation');
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedHaircut(null);
    reset();
  };

  const filteredHaircuts = haircuts.data?.filter((haircut) =>
    haircut.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Prestations</h1>
        <button
          onClick={() => {
            setSelectedHaircut(null);
            reset();
            setIsModalOpen(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nouvelle prestation
        </button>
      </div>

      <div className="mb-4">
  <input
    type="text"
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    placeholder="Rechercher une prestation..."
    className="block w-full py-4 px-6 text-lg rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
  />
</div>


      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Types de coupe</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHaircuts?.map((haircut) => (
            <div
              key={haircut.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <Scissors className="w-5 h-5 text-blue-600" />
                  <h3 className="font-medium">{haircut.type}</h3>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditClick(haircut)}
                    className="text-gray-600 hover:text-blue-600"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(String(haircut.id))} // Convertir en string
                    className="text-gray-600 hover:text-red-600"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>{haircut.description}</p>
                <p>Durée : {haircut.duration} min</p>
                <p>Prix : {haircut.price} FCFA</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">
              {selectedHaircut ? 'Modifier la prestation' : 'Nouvelle prestation'}
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Type de coupe
                </label>
                <input
                  type="text"
                  {...register('type')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Ex : Coupe homme classique"
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
                  placeholder="Décrivez la prestation..."
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
                  {selectedHaircut ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;