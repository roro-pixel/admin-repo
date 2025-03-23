import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import ProtectedRoute from './components/Route_protected/ProtectedRoute';
import { ToastContainer } from 'react-toastify'; 
import 'react-toastify/dist/ReactToastify.css';

// Lazy load pages
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Login = React.lazy(() => import('./pages/Login'));
const Barbers = React.lazy(() => import('./pages/Barbers'));
const Estheticians = React.lazy(() => import('./pages/Estheticians'));
const Appointments = React.lazy(() => import('./pages/Appointments'));
const AppointmentsEstheticians = React.lazy(() => import('./pages/AppointmentsEstheticians'));
const Clients = React.lazy(() => import('./pages/Clients'));
const Services = React.lazy(() => import('./pages/Services'));
const BeautyServices = React.lazy(() => import('./pages/BeautyServices'));
const Settings = React.lazy(() => import('./pages/Settings'));

// Composant de chargement
const LoadingSpinner = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <React.Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Route publique */}
          <Route path="/login" element={<Login />} />
          
          {/* Routes protégées - utilisez le composant ProtectedRoute comme élément parent */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              {/* Redirection de la racine vers dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/barbers" element={<Barbers />} />
              <Route path="/estheticians" element={<Estheticians />} />
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/appointmentsEstheticians" element={<AppointmentsEstheticians />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/services" element={<Services />} />
              <Route path="/beautyServices" element={<BeautyServices />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>
          
          {/* Redirection des routes non définies vers login si non authentifié */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </React.Suspense>

      {/* ToastContainer doit être ajouté ici */}
      <ToastContainer
        position="top-right" // Position (top-right, bottom-right, etc.)
        autoClose={1500} // Durée avant fermeture automatique (en ms)
        hideProgressBar={false} // Affiche ou cache la barre de progression
        newestOnTop={false} // Affiche les nouveaux toasts au sommet
        closeOnClick // Permet de fermer le toast en cliquant dessus
        rtl={false} // Active ou non l'affichage RTL
        pauseOnFocusLoss // Pause les toasts lorsqu'une autre fenêtre est en focus
        draggable // Permet de déplacer les toasts
        pauseOnHover // Pause lorsqu'on survole le toast
        theme="colored" // Thème : colored, dark ou light
      />
    </BrowserRouter>
  );
}

export default App;
