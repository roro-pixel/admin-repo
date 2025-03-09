import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Calendar, Scissors, Users, TrendingUp } from 'lucide-react';
import AppointmentsDetails from '../components/others/AppointmentsDetails';
import ActiveBarbers from '../components/others/ActivesBarbers';
import Clients from '../components/others/Clients';
import MonthlyRevenue from '../components/others/MonthlyRevenue';
import { useAppointments } from '../hooks/useAppointments';
import { useBarbers } from '../hooks/useBarbers';
import { useClients } from '../hooks/useClients';

const Dashboard = () => {
  const { appointments } = useAppointments();
  const { barbers } = useBarbers();
  const { clients } = useClients();
  const { data: appointmentsData, isLoading: isLoadingAppointments, isError: isErrorAppointments } = appointments;
  const [activeView, setActiveView] = useState('dashboard');

  // Calculer le nombre de coiffeurs actifs
  const activeBarberCount = useMemo(() => {
    if (!barbers.data) return 0;
    return barbers.data.filter(barber => barber.available).length;
  }, [barbers.data]);

  // Calculer le nombre de clients uniques avec rendez-vous
  const uniqueClientsCount = useMemo(() => {
    if (!appointmentsData) return 0;
    const clientIds = new Set(appointmentsData.map(appointment => appointment.clientId));
    return clientIds.size;
  }, [appointmentsData]);

  // Calculer le revenu mensuel
  const monthlyRevenue = useMemo(() => {
    if (!appointmentsData) return 0;
    
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const monthlyTotal = appointmentsData.reduce((total, appointment) => {
      const appointmentDate = new Date(appointment.appointmentTime);
      
      // Vérifier si l'appointment est dans le mois en cours
      if (appointmentDate.getMonth() === currentMonth && 
          appointmentDate.getFullYear() === currentYear) {
        return total + (appointment.price || 0);
      }
      return total;
    }, 0);
    
    return monthlyTotal;
  }, [appointmentsData]);

  // Génération des données pour le graphique des rendez-vous par jour
  const appointmentsByDay = useMemo(() => {
    if (!appointmentsData) return [];

    const dayCounts = appointmentsData.reduce((acc: { [key: string]: number }, appointment) => {
      const date = new Date(appointment.appointmentTime).toLocaleDateString('fr-FR');
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(dayCounts).map(([date, count]) => ({ date, count }));
  }, [appointmentsData]);

  if (isLoadingAppointments) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isErrorAppointments) {
    return <div>Erreur lors du chargement des données. Veuillez réessayer plus tard.</div>;
  }

  const statCards = [
    {
      title: 'Rendez-vous',
      value: appointmentsData?.length || 0,
      icon: <Calendar className="w-8 h-8 text-blue-600" />,
      onClick: () => setActiveView('appointmentsDetails'),
    },
    {
      title: 'Coiffeurs actifs',
      value: activeBarberCount,
      icon: <Scissors className="w-8 h-8 text-green-600" />,
      onClick: () => setActiveView('activeBarbers'),
    },
    {
      title: 'Clients',
      value: uniqueClientsCount,
      icon: <Users className="w-8 h-8 text-purple-600" />,
      onClick: () => setActiveView('clients'),
    },
    {
      title: 'Revenu mensuel',
      value: `${monthlyRevenue.toLocaleString()} FCFA`,
      icon: <TrendingUp className="w-8 h-8 text-yellow-600" />,
      onClick: () => setActiveView('monthlyRevenue'),
    },
  ];

  if (activeView === 'dashboard') {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Tableau de bord</h1>

        {/* Cartes de statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <div
              key={card.title}
              className="bg-white p-6 rounded-lg shadow-sm cursor-pointer"
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

        {/* Graphique des rendez-vous par jour avec Tooltip amélioré */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Rendez-vous par jour</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={appointmentsByDay} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  formatter={(value) => [`${value} rendez-vous`, 'Nombre']}
                  labelFormatter={(label) => `Jour : ${label}`}
                />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  }

  const renderActiveView = () => {
    switch (activeView) {
      case 'appointmentsDetails':
        return <AppointmentsDetails onBack={() => setActiveView('dashboard')} />;
      case 'activeBarbers':
        return <ActiveBarbers onBack={() => setActiveView('dashboard')} />;
      case 'clients':
        return <Clients onBack={() => setActiveView('dashboard')} />;
      case 'monthlyRevenue':
        return <MonthlyRevenue onBack={() => setActiveView('dashboard')} />;
      default:
        return null;
    }
  };

  return <div>{renderActiveView()}</div>;
};

export default Dashboard;