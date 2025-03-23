import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart, 
  Pie,
  Cell
} from 'recharts';
import { Calendar, User, Users, TrendingUp } from 'lucide-react';
import AppointmentsDetails from '../components/others/AppointmentsDetails';
import AppointmentsEstheticiansDetails from '../components/others/AppointmentsEtheticiansDetails';
import ActiveBarbers from '../components/others/ActivesBarbers';
import ActiveEstheticians from '../components/others/ActivesEtheticians';
import Clients from '../components/others/Clients';
import MonthlyRevenue from '../components/others/MonthlyRevenue';
import MonthlyRevenueEstheticians from '../components/others/MonthlyRevenueEstheticians';
import { useAppointments } from '../hooks/useAppointments';
import { useAppointmentEstheticians } from '../hooks/useAppointmentEstheticians';
import { useBarbers } from '../hooks/useBarbers';
import { useEstheticians } from '../hooks/useEstheticians';
import { useClients } from '../hooks/useClients';

const UnifiedDashboard = () => {
  const { appointments } = useAppointments();
  const { estheticianAppointments } = useAppointmentEstheticians();
  const { barbers } = useBarbers();
  const { estheticians } = useEstheticians();
  const { clients } = useClients();
  
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedDetailView, setSelectedDetailView] = useState('');

  // Wrap the appointment data in useMemo to prevent unnecessary recalculations
  const barberAppointmentsData = useMemo(() => appointments.data || [], [appointments.data]);
  const estheticianAppointmentsData = useMemo(() => estheticianAppointments.data || [], [estheticianAppointments.data]);
  
  const isLoading = appointments.isLoading || estheticianAppointments.isLoading;
  const isError = appointments.isError || estheticianAppointments.isError;

  // Calculer les statistiques combinées
  const totalAppointments = useMemo(() => 
    barberAppointmentsData.length + estheticianAppointmentsData.length, 
    [barberAppointmentsData, estheticianAppointmentsData]
  );
  
  // Calculer le nombre de professionnels actifs
  const activeBarberCount = useMemo(() => {
    if (!barbers.data) return 0;
    return barbers.data.filter(barber => barber.available).length;
  }, [barbers.data]);

  const activeEstheticianCount = useMemo(() => {
    if (!estheticians.data) return 0;
    return estheticians.data.filter(esthetician => esthetician.available).length;
  }, [estheticians.data]);
  
  const totalActiveProfessionals = useMemo(() => 
    activeBarberCount + activeEstheticianCount, 
    [activeBarberCount, activeEstheticianCount]
  );

  // Calculer le nombre de clients uniques
  const uniqueClientsCount = useMemo(() => {
    if (!barberAppointmentsData.length && !estheticianAppointmentsData.length) return 0;
    
    const clientIds = new Set();
    barberAppointmentsData.forEach(appointment => clientIds.add(appointment.clientId));
    estheticianAppointmentsData.forEach(appointment => clientIds.add(appointment.clientId));
    
    return clientIds.size;
  }, [barberAppointmentsData, estheticianAppointmentsData]);

  // Calculer le revenu mensuel combiné
  const monthlyRevenue = useMemo(() => {
    if (!barberAppointmentsData.length && !estheticianAppointmentsData.length) return 0;
    
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const barberTotal = barberAppointmentsData.reduce((total, appointment) => {
      const appointmentDate = new Date(appointment.appointmentTime);
      
      if (appointmentDate.getMonth() === currentMonth && 
          appointmentDate.getFullYear() === currentYear) {
        return total + (appointment.price || 0);
      }
      return total;
    }, 0);
    
    const estheticianTotal = estheticianAppointmentsData.reduce((total, appointment) => {
      const appointmentDate = new Date(appointment.appointmentTime);
      
      if (appointmentDate.getMonth() === currentMonth && 
          appointmentDate.getFullYear() === currentYear) {
        return total + (appointment.price || 0);
      }
      return total;
    }, 0);
    
    return barberTotal + estheticianTotal;
  }, [barberAppointmentsData, estheticianAppointmentsData]);

  // Générer des données pour le graphique combiné des rendez-vous par jour
  const combinedAppointmentsByDay = useMemo(() => {
    if (!barberAppointmentsData.length && !estheticianAppointmentsData.length) return [];
    
    const dayCounts: Record<string, { date: string, barberCount: number, estheticianCount: number, totalCount: number }> = {};
    
    // Compter les rendez-vous des coiffeurs
    barberAppointmentsData.forEach(appointment => {
      const date = new Date(appointment.appointmentTime).toLocaleDateString('fr-FR');
      if (!dayCounts[date]) {
        dayCounts[date] = { date, barberCount: 0, estheticianCount: 0, totalCount: 0 };
      }
      dayCounts[date].barberCount += 1;
      dayCounts[date].totalCount += 1;
    });
    
    // Compter les rendez-vous des esthéticiennes
    estheticianAppointmentsData.forEach(appointment => {
      const date = new Date(appointment.appointmentTime).toLocaleDateString('fr-FR');
      if (!dayCounts[date]) {
        dayCounts[date] = { date, barberCount: 0, estheticianCount: 0, totalCount: 0 };
      }
      dayCounts[date].estheticianCount += 1;
      dayCounts[date].totalCount += 1;
    });
    
    // Convertir en tableau et trier par date
    return Object.values(dayCounts).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [barberAppointmentsData, estheticianAppointmentsData]);

  // Données pour le pie chart de répartition des rendez-vous
  const appointmentDistribution = useMemo(() => [
    { name: 'Coiffure', value: barberAppointmentsData.length },
    { name: 'Esthétique', value: estheticianAppointmentsData.length }
  ], [barberAppointmentsData.length, estheticianAppointmentsData.length]);

  // Données pour le dashboard
  const statCards = [
    {
      title: 'Tous les rendez-vous',
      value: totalAppointments,
      icon: <Calendar className="w-8 h-8 text-blue-600" />,
      onClick: () => {
        setSelectedDetailView('appointments');
        setActiveView('details');
      },
    },
    {
      title: 'Professionnels actifs',
      value: totalActiveProfessionals,
      icon: <User className="w-8 h-8 text-green-600" />,
      onClick: () => {
        setSelectedDetailView('professionals');
        setActiveView('details');
      },
    },
    {
      title: 'Clients',
      value: uniqueClientsCount,
      icon: <Users className="w-8 h-8 text-purple-600" />,
      onClick: () => {
        setSelectedDetailView('clients');
        setActiveView('details');
      },
    },
    {
      title: 'Revenu mensuel total',
      value: `${monthlyRevenue.toLocaleString()} FCFA`,
      icon: <TrendingUp className="w-8 h-8 text-yellow-600" />,
      onClick: () => {
        setSelectedDetailView('revenue');
        setActiveView('details');
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isError) {
    return <div>Erreur lors du chargement des données. Veuillez réessayer plus tard.</div>;
  }

  // Afficher le dashboard principal
  if (activeView === 'dashboard') {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Tableau de bord</h1>

        {/* Cartes de statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <div
              key={card.title}
              className="bg-white p-6 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              onClick={card.onClick}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{card.title}</p>
                  <p className="text-2xl font-semibold mt-1">{card.value}</p>
                </div>
                {card.icon}
              </div>
            </div>
          ))}
        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Graphique des rendez-vous par jour */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Rendez-vous par jour</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={combinedAppointmentsByDay} 
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    formatter={(value, name) => {
                      const label = 
                        name === 'barberCount' ? 'Coiffure' : 
                        name === 'estheticianCount' ? 'Esthétique' : 'Total';
                      return [`${value} rendez-vous`, label];
                    }}
                    labelFormatter={(label) => `Date : ${label}`}
                  />
                  <Legend 
                    formatter={(value) => {
                      return value === 'barberCount' ? 'Coiffure' : 
                            value === 'estheticianCount' ? 'Esthétique' : 'Total';
                    }} 
                  />
                  <Bar dataKey="barberCount" stackId="a" fill="#3B82F6" />
                  <Bar dataKey="estheticianCount" stackId="a" fill="#DD6B9D" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Répartition des rendez-vous */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Répartition des rendez-vous</h2>
            <div className="h-80 flex flex-col justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={appointmentDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {appointmentDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#3B82F6' : '#DD6B9D'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} rendez-vous`, 'Nombre']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Cartes des services individuels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Carte des services de coiffure */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Services de coiffure</h2>
              <button 
                onClick={() => {
                  setSelectedDetailView('barberDetails');
                  setActiveView('details');
                }}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Voir détails
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Rendez-vous</p>
                <p className="text-xl font-semibold">{barberAppointmentsData.length}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Coiffeurs actifs</p>
                <p className="text-xl font-semibold">{activeBarberCount}</p>
              </div>
            </div>
          </div>

          {/* Carte des services d'esthétique */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Services d'esthétique</h2>
              <button 
                onClick={() => {
                  setSelectedDetailView('estheticianDetails');
                  setActiveView('details');
                }}
                className="text-pink-600 hover:text-pink-800 text-sm font-medium"
              >
                Voir détails
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-pink-50 rounded-lg">
                <p className="text-sm text-gray-600">Rendez-vous</p>
                <p className="text-xl font-semibold">{estheticianAppointmentsData.length}</p>
              </div>
              <div className="p-4 bg-pink-50 rounded-lg">
                <p className="text-sm text-gray-600">Esthéticiennes actives</p>
                <p className="text-xl font-semibold">{activeEstheticianCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Afficher la vue détaillée sélectionnée
  const renderDetailView = () => {
    switch (selectedDetailView) {
      case 'appointments':
        return (
          <div className="space-y-6">
            <button 
              onClick={() => setActiveView('dashboard')}
              className="mb-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              Retour au tableau de bord
            </button>
            <h2 className="text-2xl font-bold">Tous les rendez-vous</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Coiffure</h3>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {barberAppointmentsData.length} rendez-vous
                  </span>
                </div>
                <button 
                  onClick={() => {
                    setSelectedDetailView('barberDetails');
                    setActiveView('details');
                  }}
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Voir les détails des rendez-vous de coiffure
                </button>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Esthétique</h3>
                  <span className="px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm">
                    {estheticianAppointmentsData.length} rendez-vous
                  </span>
                </div>
                <button 
                  onClick={() => {
                    setSelectedDetailView('estheticianDetails');
                    setActiveView('details');
                  }}
                  className="w-full py-2 px-4 bg-pink-600 hover:bg-pink-700 text-white rounded-lg"
                >
                  Voir les détails des rendez-vous d'esthétique
                </button>
              </div>
            </div>
          </div>
        );
      case 'professionals':
        return (
          <div className="space-y-6">
            <button 
              onClick={() => setActiveView('dashboard')}
              className="mb-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              Retour au tableau de bord
            </button>
            <h2 className="text-2xl font-bold">Professionnels actifs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Coiffeurs</h3>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {activeBarberCount} actifs
                  </span>
                </div>
                <button 
                  onClick={() => {
                    setSelectedDetailView('activeBarbers');
                    setActiveView('details');
                  }}
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Voir les coiffeurs actifs
                </button>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Esthéticiennes</h3>
                  <span className="px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm">
                    {activeEstheticianCount} actives
                  </span>
                </div>
                <button 
                  onClick={() => {
                    setSelectedDetailView('activeEstheticians');
                    setActiveView('details');
                  }}
                  className="w-full py-2 px-4 bg-pink-600 hover:bg-pink-700 text-white rounded-lg"
                >
                  Voir les esthéticiennes actives
                </button>
              </div>
            </div>
          </div>
        );
      case 'clients':
        return <Clients onBack={() => setActiveView('dashboard')} />;
      case 'revenue':
        return (
          <div className="space-y-6">
            <button 
              onClick={() => setActiveView('dashboard')}
              className="mb-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              Retour au tableau de bord
            </button>
            <h2 className="text-2xl font-bold">Revenus</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Revenus coiffure</h3>
                </div>
                <button 
                  onClick={() => {
                    setSelectedDetailView('barberRevenue');
                    setActiveView('details');
                  }}
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Voir les revenus coiffure
                </button>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Revenus esthétique</h3>
                </div>
                <button 
                  onClick={() => {
                    setSelectedDetailView('estheticianRevenue');
                    setActiveView('details');
                  }}
                  className="w-full py-2 px-4 bg-pink-600 hover:bg-pink-700 text-white rounded-lg"
                >
                  Voir les revenus esthétique
                </button>
              </div>
            </div>
          </div>
        );
      case 'barberDetails':
        return <AppointmentsDetails onBack={() => setActiveView('dashboard')} />;
      case 'estheticianDetails':
        return <AppointmentsEstheticiansDetails onBack={() => setActiveView('dashboard')} />;
      case 'activeBarbers':
        return <ActiveBarbers onBack={() => setActiveView('dashboard')} />;
      case 'activeEstheticians':
        return <ActiveEstheticians onBack={() => setActiveView('dashboard')} />;
      case 'barberRevenue':
        return <MonthlyRevenue onBack={() => setActiveView('dashboard')} />;
      case 'estheticianRevenue':
        return <MonthlyRevenueEstheticians onBack={() => setActiveView('dashboard')} />;
      default:
        return null;
    }
  };

  return <div>{renderDetailView()}</div>;
};

export default UnifiedDashboard;