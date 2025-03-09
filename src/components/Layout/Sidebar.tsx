import { Link, useLocation } from 'react-router-dom';
import {
  Users,
  Scissors,
  Calendar,
  BarChart2,
  Menu, 
  X, 
  Settings
} from 'lucide-react';
import { useState } from 'react';

const Sidebar = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false); // État pour gérer l'ouverture du menu burger

  const menuItems = [
    { path: '/dashboard', icon: <BarChart2 />, label: 'Tableau de bord' },
    { path: '/barbers', icon: <Users />, label: 'Coiffeurs' },
    { path: '/appointments', icon: <Calendar />, label: 'Rendez-vous' },
    { path: '/clients', icon: <Users />, label: 'Clients' },
    { path: '/services', icon: <Scissors />, label: 'Prestations' }, 
    { path: '/settings', icon: <Settings />, label: 'Paramètres' }, 
  ];

  return (
    <div className="relative">
      {/* Barre supérieure pour les petits écrans */}
      <div className="lg:hidden flex justify-between items-center p-4 bg-gray-900 text-white">
        <button onClick={() => setIsOpen(!isOpen)} className="text-white">
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar pour les grands écrans */}
      <div className="hidden lg:block h-screen w-64 bg-gray-900 text-white p-4">
        <nav>
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors ${
                location.pathname === item.path
                  ? 'bg-blue-600'
                  : 'hover:bg-gray-800'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Menu burger pour petits écrans */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsOpen(false)}></div>
          <div className="absolute top-0 left-0 w-64 h-full bg-gray-900 text-white p-4 shadow-lg">
            <nav>
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)} // Ferme le menu au clic
                  className={`flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors ${
                    location.pathname === item.path
                      ? 'bg-blue-600'
                      : 'hover:bg-gray-800'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
