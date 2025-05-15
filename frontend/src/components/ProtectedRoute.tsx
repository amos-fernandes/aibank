
import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOpenFinance?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireOpenFinance = true 
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // Show loading state while checking authentication
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-bank-teal text-2xl">Carregando...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // User is not logged in, redirect to login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireOpenFinance && user && !user.hasCompletedOpenFinance) {
    // User hasn't completed OpenFinance onboarding, redirect them
    return <Navigate to="/open-finance" state={{ from: location }} replace />;
  }

  // User is authenticated and has completed OpenFinance if required
  return <>{children}</>;
};

export default ProtectedRoute;
