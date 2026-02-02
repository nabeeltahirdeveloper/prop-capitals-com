import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { createPageUrl } from '../utils';

export default function ProtectedRoute({ allowedRoles = [] }) {
  const location = useLocation();
  const { status, user } = useAuth();
  const { t } = useTranslation();

  // Block ALL rendering until auth status is resolved
  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to sign in
  if (status === 'unauthenticated' || !user) {
    return <Navigate to={createPageUrl('SignIn')} state={{ from: location }} replace />;
  }

  // Check role-based access
  if (allowedRoles.length > 0) {
    const userRole = user.role?.toUpperCase(); // Normalize to uppercase
    const hasAccess = allowedRoles.some(role => role.toUpperCase() === userRole);

    if (!hasAccess) {
      // Redirect to trader dashboard
      return <Navigate to={createPageUrl('TraderDashboard')} replace />;
    }
  }

  // User is authenticated and has the required role - render child routes
  return <Outlet />;
}

// Component to redirect to appropriate dashboard based on user role
export function DashboardRedirect() {
  const { status, user } = useAuth();
  const { t } = useTranslation();

  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' || !user) {
    return <Navigate to={createPageUrl('SignIn')} replace />;
  }

  return <Navigate to={createPageUrl('TraderDashboard')} replace />;
}

// Component to redirect authenticated users away from auth pages (SignIn/SignUp)
// This prevents logged-in users from accessing authentication pages
export function PublicOnlyRoute({ children }) {
  const { status, user } = useAuth();
  const { t } = useTranslation();

  // Block ALL rendering until auth status is resolved
  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // If authenticated, redirect to trader dashboard
  if (status === 'authenticated' && user) {
    return <Navigate to={createPageUrl('TraderDashboard')} replace />;
  }

  // User is not authenticated - allow access to auth pages
  return children;
}

