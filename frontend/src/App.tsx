import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { CitizenAuthPage } from './pages/CitizenAuthPage';
import { CitizenDashboardPage } from './pages/CitizenDashboardPage';
import { GovAuthPage } from './pages/GovAuthPage';
import { GovDashboardPage } from './pages/GovDashboardPage';
import { PublicAccountabilityPage } from './pages/PublicAccountabilityPage';
import { Shield, MapPin, LogOut, Activity, Sparkles } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    return location.pathname === path;
  };

  return (
    <header className="glass-header px-6 py-3 border-b border-stone-200 flex items-center justify-between sticky top-0 z-50">
      <Link to="/" className="flex items-center gap-2.5 text-decoration-none group">
        <div className="p-2 bg-gradient-to-br from-orange-600 to-amber-600 rounded-xl text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <span className="font-extrabold text-lg text-stone-900 tracking-tight font-heading flex items-center gap-1.5">
            CityPulse <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">Prime</span>
          </span>
          <span className="block text-[9.5px] text-stone-500 font-mono tracking-wider uppercase font-semibold">
            AI Civic Governance Platform
          </span>
        </div>
      </Link>

      <div className="flex items-center gap-2 text-xs font-semibold">
        <Link
          to="/public"
          className={`nav-pill ${isActive('/public') ? 'active' : ''}`}
        >
          <Activity className="w-4 h-4 text-sky-600" />
          <span>Public Transparency</span>
        </Link>
        <Link
          to="/citizen"
          className={`nav-pill ${isActive('/citizen') ? 'active' : ''}`}
        >
          <MapPin className="w-4 h-4 text-emerald-600" />
          <span>Citizen Portal</span>
        </Link>
        <Link
          to="/gov/dashboard"
          className={`nav-pill ${isActive('/gov/dashboard') ? 'active' : ''}`}
        >
          <Shield className="w-4 h-4 text-orange-600" />
          <span>Officer Command</span>
        </Link>

        {isAuthenticated && user ? (
          <div className="flex items-center gap-3 pl-3 ml-2 border-l border-stone-200">
            <div className="flex items-center gap-2 bg-stone-100 py-1.5 px-3 rounded-full border border-stone-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-stone-700 text-xs font-medium">
                {user.full_name || user.email}
              </span>
              <span className="text-[10px] bg-orange-100 text-orange-700 font-bold px-1.5 py-0.5 rounded-full uppercase">
                {user.role}
              </span>
            </div>
            <button
              onClick={logout}
              className="text-stone-500 hover:text-rose-600 flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md hover:bg-rose-50 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 ml-2 pl-2 border-l border-stone-200">
            <Link to="/auth" className="btn-secondary text-xs py-1.5 px-3">
              Citizen Login
            </Link>
            <Link to="/gov/login" className="btn-primary text-xs py-1.5 px-3">
              <Sparkles className="w-3.5 h-3.5" /> Officer Portal
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

const RootRedirect: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-stone-500 text-sm font-medium">
        Initializing CityPulse Prime Engine...
      </div>
    );
  }

  if (isAuthenticated && user) {
    if (user.role === 'official' || user.role === 'admin') {
      return <Navigate to="/gov/dashboard" replace />;
    }
    return <Navigate to="/citizen" replace />;
  }

  return <CitizenDashboardPage />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-[#fafaf9]">
          <Navbar />
          <div className="flex-1">
            <Routes>
              {/* Public Governance Dashboard (No login required) */}
              <Route path="/public" element={<PublicAccountabilityPage />} />

              {/* Citizen Routes */}
              <Route path="/" element={<RootRedirect />} />
              <Route path="/auth" element={<CitizenAuthPage />} />
              <Route
                path="/citizen"
                element={
                  <ProtectedRoute allowedRoles={['citizen']}>
                    <CitizenDashboardPage />
                  </ProtectedRoute>
                }
              />

              {/* Government / MCD Official Routes */}
              <Route path="/gov/login" element={<GovAuthPage />} />
              <Route
                path="/gov/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['official', 'admin']}>
                    <GovDashboardPage />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/public" replace />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};
