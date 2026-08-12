import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Stethoscope, LogOut, User, Activity } from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {user && (
        <nav className="fixed top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-lg">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <Link to="/" className="flex items-center gap-3">
              <Stethoscope className="w-8 h-8 text-emerald-500" />
              <span className="text-2xl font-bold tracking-tighter">HealthKey</span>
            </Link>
            <div className="flex items-center gap-8">
              {user.role === 'patient' && (
                <Link to="/dashboard" className={`flex items-center gap-2 text-sm hover:text-emerald-400 ${isActive('/dashboard') ? 'text-emerald-400' : 'text-zinc-400'}`}>
                  <Activity className="w-4 h-4" />
                  Dashboard
                </Link>
              )}
              {user.role === 'doctor' && (
                <Link to="/doctor-dashboard" className={`flex items-center gap-2 text-sm hover:text-emerald-400 ${isActive('/doctor-dashboard') ? 'text-emerald-400' : 'text-zinc-400'}`}>
                  <Activity className="w-4 h-4" />
                  Dashboard
                </Link>
              )}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <User className="w-4 h-4" />
                  {user.name}
                </div>
                <button onClick={logout} className="text-zinc-400 hover:text-white">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </nav>
      )}
      <main className={user ? 'pt-20' : ''}>
        <Outlet />
      </main>
    </div>
  );
}
