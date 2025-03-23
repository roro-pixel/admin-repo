import React, { useState } from 'react';
import { useAppointmentEstheticians } from '../../hooks/useAppointmentEstheticians';
import type { EstheticianAppointment } from '../../types';

interface AppointmentsEstheticiansDetailsProps {
  onBack: () => void;
}

const AppointmentsEstheticiansDetails: React.FC<AppointmentsEstheticiansDetailsProps> = ({ onBack }) => {
  const { estheticianAppointments } = useAppointmentEstheticians();
  const [searchTerm, setSearchTerm] = useState(''); // État pour gérer la recherche

  if (estheticianAppointments.isLoading) {
    return <div>Chargement des rendez-vous...</div>;
  }

  if (estheticianAppointments.isError) {
    return <div>Erreur lors du chargement des rendez-vous</div>;
  }

  // Vérifier si les données existent pour éviter les erreurs
  const appointmentData = estheticianAppointments.data || [];

  // Filtrer les rendez-vous en fonction du terme de recherche
  const filteredAppointments = appointmentData.filter((appointment: EstheticianAppointment) =>
    appointment.clientFirstname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    appointment.clientLastname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    appointment.estheticianFirstname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    appointment.estheticianLastname?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4">
      <button 
        onClick={onBack}
        className="mb-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
      >
        Retour
      </button>
      <h2 className="text-2xl font-bold mb-4">Détails des rendez-vous esthétiques</h2>

      {/* Barre de recherche */}
      <div className="mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)} // Mise à jour du terme de recherche
          placeholder="Rechercher par nom de client ou d'esthéticienne..."
          className="block w-full rounded-lg border-gray-300 shadow focus:border-blue-600 focus:ring-blue-600 text-lg p-3"
        />
      </div>

      <ul className="space-y-4">
        {filteredAppointments.map((appointment: EstheticianAppointment) => (
          <li key={appointment.id} className="p-4 bg-white rounded-lg shadow">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-semibold">Client</p>
                <p>Nom: {appointment.clientFirstname} {appointment.clientLastname}</p>
                {/* Vérifier si l'email existe avant de l'afficher */}
                <p>Email: {appointment.clientEmail || 'Non renseigné'}</p>
              </div>
              <div>
                <p className="font-semibold">Esthéticienne</p>
                <p>Nom: {appointment.estheticianFirstname} {appointment.estheticianLastname}</p>
              </div>
              <div>
                <p className="font-semibold">Rendez-vous</p>
                <p>Date: {new Date(appointment.appointmentTime).toLocaleDateString()}</p>
                {/* Afficher l'heure au format 24h */}
                <p>Heure: {new Date(appointment.appointmentTime).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false, // Désactiver le format 12h (AM/PM)
                })}</p>
                <p>Type de service: {appointment.estheticType}</p>
                <p>Prix: {appointment.price} FCFA</p>
              </div>
              <div>
                <p className="font-semibold">Status</p>
                <p>{appointment.status}</p>
              </div>
            </div>
          </li>
        ))}
        {/* Afficher un message clair lorsqu'il n'y a pas de résultats */}
        {filteredAppointments.length === 0 && (
          <p className="text-gray-500 text-center">Aucun rendez-vous correspondant trouvé</p>
        )}
      </ul>
    </div>
  );
};

export default AppointmentsEstheticiansDetails;