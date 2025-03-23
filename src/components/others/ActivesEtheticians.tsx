import React, { useState, useEffect } from 'react';
import { useEstheticians } from '../../hooks/useEstheticians';
import type { Esthetician } from '../../types';

interface ActiveEstheticiansProps {
  onBack: () => void;
}

const ActiveEstheticians: React.FC<ActiveEstheticiansProps> = ({ onBack }) => {
  const { estheticians } = useEstheticians();
  const [searchTerm, setSearchTerm] = useState(''); // État pour la barre de recherche
  const [phoneValue, setPhoneValue] = useState(''); // État pour surveiller le numéro de téléphone

  // Fonction pour formater le numéro de téléphone
  const formatPhoneNumber = (phone: string | undefined): string => {
    if (!phone) return ''; // Si le numéro est vide, retourner une chaîne vide
    const cleanedPhone = phone.replace(/\D/g, ''); // Supprimer tous les caractères non numériques
    if (cleanedPhone.length === 9 && cleanedPhone.startsWith('0')) {
      return cleanedPhone; // Si le numéro est déjà au bon format, le retourner tel quel
    }
    if (cleanedPhone.length === 8) {
      return `0${cleanedPhone}`; // Ajouter un zéro au début si le numéro a 8 chiffres
    }
    return phone; // Retourner le numéro original si le format n'est pas valide
  };

  // Utiliser useEffect pour formater le numéro de téléphone
  useEffect(() => {
    if (phoneValue && !phoneValue.startsWith('0') && phoneValue.length === 8) {
      setPhoneValue(`0${phoneValue}`); // Ajouter un zéro au début si nécessaire
    }
  }, [phoneValue]);

  if (estheticians.isLoading) {
    return <div>Chargement des esthéticiennes actives...</div>;
  }

  if (estheticians.isError) {
    return <div>Erreur lors du chargement des esthéticiennes actives</div>;
  }

  // Filtrer les esthéticiennes actives en fonction du terme de recherche
  const activeEstheticians = estheticians.data?.filter(
    (esthetician: Esthetician) =>
      esthetician.available &&
      (esthetician.firstname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        esthetician.lastname?.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  return (
    <div className="p-4">
      <button 
        onClick={onBack}
        className="mb-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
      >
        Retour
      </button>
      <h2 className="text-2xl font-bold mb-4">Esthéticiennes actives</h2>

      {/* Barre de recherche */}
      <div className="mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)} // Met à jour le terme de recherche
          placeholder="Rechercher une esthéticienne..."
          className="block w-full rounded-lg border-gray-300 shadow focus:border-blue-600 focus:ring-blue-600 text-lg p-3"
        />
      </div>

      <ul className="space-y-4">
        {activeEstheticians.map((esthetician: Esthetician) => {
          // Formater le numéro de téléphone pour chaque esthéticienne
          const formattedPhone = formatPhoneNumber(esthetician.phone);
          return (
            <li key={esthetician.id} className="p-4 bg-white rounded-lg shadow">
              <p className="font-semibold">
                Nom: {esthetician.firstname || 'N/A'} {esthetician.lastname || 'N/A'}
              </p>
              <p>Email: {esthetician.email || 'N/A'}</p>
              <p>Téléphone: {formattedPhone || 'N/A'}</p>
              <p>Description: {esthetician.description || 'N/A'}</p>
            </li>
          );
        })}
        {activeEstheticians.length === 0 && (
          <p className="text-gray-500">Aucune esthéticienne active trouvée</p>
        )}
      </ul>
    </div>
  );
};

export default ActiveEstheticians;