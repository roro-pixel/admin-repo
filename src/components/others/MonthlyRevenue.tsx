import React, { useMemo } from 'react';
import { useAppointments } from '../../hooks/useAppointments';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, Calendar, Users } from 'lucide-react';

interface MonthlyRevenueProps {
  onBack: () => void;
}

const MonthlyRevenue: React.FC<MonthlyRevenueProps> = ({ onBack }) => {
  const { appointments } = useAppointments();

  const revenueData = useMemo(() => {
    if (!appointments.data) return [];

    const monthlyData = appointments.data.reduce((acc, appointment) => {
      const date = new Date(appointment.appointmentTime);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[monthYear]) {
        acc[monthYear] = {
          month: monthYear,
          revenue: 0,
          appointments: 0,
          clients: new Set(),
        };
      }
      
      acc[monthYear].revenue += appointment.price;
      acc[monthYear].appointments += 1;
      acc[monthYear].clients.add(appointment.clientId);
      
      return acc;
    }, {} as Record<string, { month: string; revenue: number; appointments: number; clients: Set<string> }>);

    return Object.values(monthlyData)
      .map(data => ({
        ...data,
        clients: data.clients.size,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6); // Derniers 6 mois
  }, [appointments.data]);

  const currentMonthData = revenueData[revenueData.length - 1] || {
    revenue: 0,
    appointments: 0,
    clients: 0,
  };

  if (appointments.isLoading) {
    return <div className="p-4">Chargement des données...</div>;
  }

  if (appointments.isError) {
    return <div className="p-4">Erreur lors du chargement des données</div>;
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Retour
        </button>
      </div>

      <h2 className="text-2xl font-bold">Revenu mensuel</h2>

      {/* Stats du mois en cours */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <DollarSign className="w-5 h-5" />
            <h3 className="font-semibold">Revenu total</h3>
          </div>
          <p className="text-2xl font-bold">{currentMonthData.revenue.toLocaleString()} FCFA</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 text-green-600 mb-2">
            <Calendar className="w-5 h-5" />
            <h3 className="font-semibold">Rendez-vous</h3>
          </div>
          <p className="text-2xl font-bold">{currentMonthData.appointments}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 text-purple-600 mb-2">
            <Users className="w-5 h-5" />
            <h3 className="font-semibold">Clients uniques</h3>
          </div>
          <p className="text-2xl font-bold">{currentMonthData.clients}</p>
        </div>
      </div>

      {/* Graphique des revenus */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Évolution des revenus</h3>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                tickFormatter={(value) => {
                  const [year, month] = value.split('-');
                  const date = new Date(parseInt(year), parseInt(month) - 1);
                  return date.toLocaleDateString('fr-FR', { month: 'short' });
                }}
              />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [`${value.toLocaleString()} FCFA`, 'Revenu']}
                labelFormatter={(label) => {
                  const [year, month] = label.split('-');
                  const date = new Date(parseInt(year), parseInt(month) - 1);
                  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
                }}
              />
              <Bar dataKey="revenue" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tableau détaillé */}
      <div className="bg-white p-6 rounded-lg shadow-sm overflow-x-auto">
        <h3 className="text-lg font-semibold mb-4">Détails mensuels</h3>
        <table className="min-w-full">
          <thead>
            <tr className="border-b">
              <th className="py-2 px-4 text-left">Mois</th>
              <th className="py-2 px-4 text-right">Revenu</th>
              <th className="py-2 px-4 text-right">Rendez-vous</th>
              <th className="py-2 px-4 text-right">Clients uniques</th>
            </tr>
          </thead>
          <tbody>
            {revenueData.map((data) => (
              <tr key={data.month} className="border-b hover:bg-gray-50">
                <td className="py-2 px-4">
                  {new Date(data.month).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                </td>
                <td className="py-2 px-4 text-right">{data.revenue.toLocaleString()} FCFA</td>
                <td className="py-2 px-4 text-right">{data.appointments}</td>
                <td className="py-2 px-4 text-right">{data.clients}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MonthlyRevenue;