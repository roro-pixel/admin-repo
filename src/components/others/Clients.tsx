import React, { useState } from 'react';
import { useAppointments } from '../../hooks/useAppointments';
import { useClients } from '../../hooks/useClients';
import type { Appointment, Client } from '../../types';

interface ClientsProps {
  onBack: () => void;
}

const Clients: React.FC<ClientsProps> = ({ onBack }) => {
  const { appointments } = useAppointments();
  const { clients } = useClients();
  const [searchTerm, setSearchTerm] = useState(''); // État pour gérer la recherche

  if (appointments.isLoading || clients.isLoading) {
    return <div>Chargement des clients...</div>;
  }

  if (appointments.isError || clients.isError) {
    return <div>Erreur lors du chargement des clients</div>;
  }

  const clientIds = new Set(appointments.data?.map((appointment: Appointment) => appointment.clientId));
  const clientsWithAppointments = clients.data?.filter((client: Client) => clientIds.has(client.id)) || [];

  // Filtrer les clients en fonction du terme de recherche
  const filteredClients = clientsWithAppointments.filter(
    (client: Client) =>
      client.firstname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.lastname?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4">
      <button 
        onClick={onBack}
        className="mb-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
      >
        Retour
      </button>
      <h2 className="text-2xl font-bold mb-4">Clients</h2>

      {/* Barre de recherche */}
      <div className="mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)} // Mise à jour de la recherche
          placeholder="Rechercher un client..."
          className="block w-full rounded-lg border-gray-300 shadow focus:border-blue-600 focus:ring-blue-600 text-lg p-3"
        />
      </div>

      <ul className="space-y-4">
        {filteredClients.map((client: Client) => (
          <li key={client.id} className="p-4 bg-white rounded-lg shadow">
            <div className="space-y-2">
              <p className="font-semibold">
                Nom: {client.firstname || 'N/A'} {client.lastname || 'N/A'}
              </p>
              <p>Email: {client.email || 'N/A'}</p>
              <p>Téléphone: {client.phone || 'N/A'}</p>
              <p>Nombre de no-show: {client.noShowCount || '0'}</p>
            </div>
          </li>
        ))}
        {filteredClients.length === 0 && (
          <p className="text-gray-500">Aucun client correspondant trouvé</p>
        )}
      </ul>
    </div>
  );
};

export default Clients;
