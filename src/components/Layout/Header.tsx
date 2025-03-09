import { useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const Header = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  const handleLogout = async () => {
    try {
      // Utiliser la mutation de déconnexion de votre hook useAuth
      await logout.mutateAsync();
      
      // Force la navigation en plus de celle dans le hook
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      // Même en cas d'erreur, forcer la navigation vers login
      navigate('/login', { replace: true });
    }
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <User className="w-6 h-6" />
            <span className="font-medium">Admin</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            disabled={logout.isPending}
          >
            <LogOut className="w-5 h-5" />
            <span>{logout.isPending ? 'Déconnexion...' : 'Déconnexion'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;