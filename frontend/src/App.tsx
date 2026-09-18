import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { CitizenAuthPage } from './pages/CitizenAuthPage';
import { CitizenDashboardPage } from './pages/CitizenDashboardPage';
import { GovAuthPage } from './pages/GovAuthPage';
import { GovDashboardPage } from './pages/GovDashboardPage';
import { PublicAccountabilityPage } from './pages/PublicAccountabilityPage';
import { Shield, MapPin, User, LogOut, Activity } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  if (location.pathname === '/public' && !isAuthenticated) {
    // Show clean public navigation for /public route
  }

  return (
    <header className="glass-header px-6 py-3.5 border-b border-white/10 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2 text-decoration-none">
        <div className="p-2 bg-blue-600 rounded-lg text-white shadow-lg shadow-blue-500/30">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <span className="font-extrabold text-lg text-white tracking-tight font-heading">
            CityPulse <span className="text-blue-500">Prime</span>
          </span>
          <span className="block text-[9px] text-slate-400 font-mono tracking-widest uppercase">
            AI Civic Governance Engine
          </span>
        </div>
      </Link>

      <div className="flex items-center gap-4 text-xs font-semibold">
        <Link to="/public" className="text-slate-300 hover:text-blue-400 flex items-center gap-1.5 transition-colors">
          <Activity className="w-4 h-4 text-cyan-400" /> Public Transparency
        </Link>
        <Link to="/citizen" className="text-slate-300 hover:text-blue-400 flex items-center gap-1.5 transition-colors">
          <MapPin className="w-4 h-4 text-emerald-400" /> Citizen Portal
        </Link>
        <Link to="/gov/dashboard" className="text-slate-300 hover:text-blue-400 flex items-center gap-1.5 transition-colors">
          <Shield className="w-4 h-4 text-purple-400" /> Officer Command
        </Link>

        {isAuthenticated && user ? (
          <div className="flex items-center gap-3 pl-4 border-l border-white/10">
            <span className="text-slate-300 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-blue-400" /> {user.full_name || user.email}
            </span>
            <button onClick={logout} className="text-rose-400 hover:text-rose-300 flex items-center gap-1">
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        ) : (
          <Link to="/gov/login" className="btn-secondary text-xs">
            Officer Login
          </Link>
        )}
      </div>
    </header>
  );
};

const RootRedirect: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">
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
        <div className="min-h-screen flex flex-col bg-[#090d16]">
          <Navbar />
          <div className="flex-1">
            <Routes>
              {/* Public Governance Dashboard (No login required) */}
              <Route path="/public" element={<PublicAccountabilityPage />} />

              {/* Citizen Routes */}
              <Route path="/" element={<RootRedirect />} />
              <Route path="/auth" element={<CitizenAuthPage />} />
              <Route path="/citizen" element={<CitizenDashboardPage />} />

              {/* Government / MCD Official Routes */}
              <Route path="/gov/login" element={<GovAuthPage />} />
              <Route path="/gov/dashboard" element={<GovDashboardPage />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/public" replace />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};
