import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  
  // On vérifie l'authentification à chaque rendu du composant
  if (!isAuthenticated()) {
    // On sauvegarde l'URL actuelle pour pouvoir y revenir après connexion
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Si l'utilisateur est authentifié, afficher les composants enfants
  return <Outlet />;
};

export default ProtectedRoute;