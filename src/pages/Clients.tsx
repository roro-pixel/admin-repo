import { useState } from 'react';
import { useClients } from '../hooks/useClients';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Client } from '../types';
import { Plus, Edit2, Trash, Phone, Mail, Loader } from 'lucide-react';
import { toast } from 'react-toastify';

// Schéma de validation pour le formulaire
const clientSchema = z.object({
  firstname: z.string().nonempty("Le prénom est requis"),
  lastname: z.string().nonempty("Le nom est requis"),
  email: z.string().email("Email invalide"),
  phone: z.string()
});

type ClientForm = z.infer<typeof clientSchema>;

const Clients = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { clients, createClient, updateClient, deleteClient } = useClients();

  const { data = [], status } = clients;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
  } = useForm<ClientForm>({
    resolver: zodResolver(clientSchema),
  });

  const filteredClients = data?.filter((client) => {
    const searchTerm = searchQuery.toLowerCase();
    return (
      (client.firstname?.toLowerCase() || '').includes(searchTerm) ||
      (client.lastname?.toLowerCase() || '').includes(searchTerm) ||
      (client.email?.toLowerCase() || '').includes(searchTerm) ||
      (client.phone?.toLowerCase() || '').includes(searchTerm)
    );
  });

  const openEditModal = (client: Client) => {
    setSelectedClient(client);
    setValue('firstname', client.firstname);
    setValue('lastname', client.lastname);
    setValue('email', client.email);
    setValue('phone', client.phone || '');
    setIsModalOpen(true);
  };

  const onSubmit = async (data: ClientForm) => {
    try {
      const clientData: Client = {
        id: selectedClient?.id || '',
        firstname: data.firstname,
        lastname: data.lastname,
        email: data.email,
        phone: data.phone,
        noShowCount: selectedClient?.noShowCount || 0
      };

      if (selectedClient) {
        await updateClient.mutateAsync(clientData);
        toast.success('Client mis à jour avec succès');
      } else {
        await createClient.mutateAsync(clientData);
        toast.success('Client créé avec succès');
      }
      setIsModalOpen(false);
      reset();
    } catch (error: unknown) {
      toast.error('Erreur lors de la soumission du formulaire');
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    try {
      await deleteClient.mutateAsync(clientId);
      toast.success('Client supprimé avec succès');
    } catch (error) {
      toast.error('Erreur lors de la suppression du client');
      // console.error('Erreur suppression client:', error);
    }
  };

  if (status === 'pending') {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="text-center text-red-600 py-8">
        Une erreur est survenue lors du chargement des clients
        <button
          onClick={() => clients.refetch()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des clients</h1>
        <button
          onClick={() => {
            setSelectedClient(null);
            reset();
            setIsModalOpen(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
          aria-label="Ajouter un nouveau client"
        >
          <Plus className="w-4 h-4" />
          Nouveau client
        </button>
      </div>

      <div className="flex justify-end">
        <input
          type="text"
          placeholder="Rechercher un client..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-64 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients && filteredClients.length > 0 ? (
          filteredClients.map(({ id, firstname, lastname, email, phone, noShowCount }: Client) => (
            <div key={id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900">
                    {firstname} {lastname}
                  </h3>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span className="text-sm">{phone || 'Non renseigné'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm">{email}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal({ id, firstname, lastname, email, phone, noShowCount })}
                    className="text-gray-600 hover:text-blue-600 p-1"
                    aria-label={`Modifier ${firstname} ${lastname}`}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteClient(id)}
                    className="text-gray-600 hover:text-red-600 p-1"
                    aria-label={`Supprimer ${firstname} ${lastname}`}
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {noShowCount > 0 && (
                <div className="text-sm text-red-600 mt-2 p-2 bg-red-50 rounded-md">
                  Absences: {noShowCount}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-full text-center text-gray-500 py-8">
            {searchQuery ? 'Aucun client ne correspond à votre recherche' : 'Aucun client enregistré'}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 max-w-[90%]">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">
              {selectedClient ? 'Modifier le client' : 'Nouveau client'}
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label htmlFor="firstname" className="block text-sm font-medium text-gray-700">
                  Prénom
                </label>
                <input
                  id="firstname"
                  {...register('firstname')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Entrez le prénom"
                />
                {errors.firstname && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstname.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="lastname" className="block text-sm font-medium text-gray-700">
                  Nom
                </label>
                <input
                  id="lastname"
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
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Téléphone
                </label>
                <input
                  id="phone"
                  {...register('phone')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Numéro de téléphone"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                )}
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
                  aria-label={selectedClient ? 'Modifier le client' : 'Créer le client'}
                  disabled={createClient.isPending || updateClient.isPending}
                >
                  {(createClient.isPending || updateClient.isPending) ? 'Chargement...' : (selectedClient ? 'Modifier' : 'Créer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;