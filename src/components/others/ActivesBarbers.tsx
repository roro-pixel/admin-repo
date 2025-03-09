import React, { useState } from 'react';
import { useBarbers } from '../../hooks/useBarbers';
import type { Barber } from '../../types';

interface ActiveBarbersProps {
  onBack: () => void;
}

const ActiveBarbers: React.FC<ActiveBarbersProps> = ({ onBack }) => {
  const { barbers } = useBarbers();
  const [searchTerm, setSearchTerm] = useState(''); // État pour la barre de recherche

  if (barbers.isLoading) {
    return <div>Chargement des coiffeurs actifs...</div>;
  }

  if (barbers.isError) {
    return <div>Erreur lors du chargement des coiffeurs actifs</div>;
  }

  // Filtrer les coiffeurs actifs en fonction du terme de recherche
  const activeBarbers = barbers.data?.filter(
    (barber: Barber) =>
      barber.available &&
      (barber.firstname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        barber.lastname?.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  return (
    <div className="p-4">
      <button 
        onClick={onBack}
        className="mb-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
      >
        Retour
      </button>
      <h2 className="text-2xl font-bold mb-4">Coiffeurs actifs</h2>

      {/* Barre de recherche */}
      <div className="mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)} // Met à jour le terme de recherche
          placeholder="Rechercher un coiffeur..."
          className="block w-full rounded-lg border-gray-300 shadow focus:border-blue-600 focus:ring-blue-600 text-lg p-3"
        />
      </div>

      <ul className="space-y-4">
        {activeBarbers.map((barber: Barber) => (
          <li key={barber.id} className="p-4 bg-white rounded-lg shadow">
            <p className="font-semibold">
              Nom: {barber.firstname || 'N/A'} {barber.lastname || 'N/A'}
            </p>
            <p>Email: {barber.email || 'N/A'}</p>
            <p>Téléphone: {barber.phone || 'N/A'}</p>
            <p>Description: {barber.description || 'N/A'}</p>
          </li>
        ))}
        {activeBarbers.length === 0 && (
          <p className="text-gray-500">Aucun coiffeur actif trouvé</p>
        )}
      </ul>
    </div>
  );
};

export default ActiveBarbers;
