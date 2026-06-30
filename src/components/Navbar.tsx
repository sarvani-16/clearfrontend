import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Cloud, Activity, HelpCircle, Mail, Database } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

interface DBStatus {
  database_type: string;
  is_connected: boolean;
}

interface UserSession {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface NavbarProps {
  user: UserSession | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  const [dbStatus, setDbStatus] = useState<DBStatus | null>(null);

  useEffect(() => {
    const fetchDBStatus = () => {
      axios.get<DBStatus>(`${BACKEND_URL}/api/db-status`)
        .then(res => setDbStatus(res.data))
        .catch(() => setDbStatus(null));
    };

    fetchDBStatus();
    const interval = setInterval(fetchDBStatus, 8000);
    return () => clearInterval(interval);
  }, []);
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-dark-900/75 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo Brand */}
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-accent-purple to-accent-cyan p-[1px] shadow-[0_0_15px_rgba(0,240,255,0.15)] group-hover:shadow-[0_0_25px_rgba(0,240,255,0.3)] transition-all">
                <div className="flex h-full w-full items-center justify-center rounded-[11px] bg-dark-900">
                  <Cloud className="h-5 w-5 text-accent-cyan group-hover:scale-110 transition-transform" />
                </div>
                {/* Glowing ring background */}
                <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-tr from-accent-purple to-accent-cyan opacity-50 blur-sm group-hover:opacity-100 transition-opacity"></div>
              </div>
              <span className="text-xl font-bold tracking-wider text-white">
                CLOUDCLEAR <span className="bg-gradient-to-r from-accent-cyan to-accent-purple bg-clip-text text-transparent">AI</span>
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-1 sm:gap-4">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'text-accent-cyan bg-white/5'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <GlobeIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Home</span>
            </NavLink>

            <NavLink
              to={user?.role === 'admin' ? "/admin" : "/dashboard"}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'text-accent-cyan bg-white/5'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <Activity className="h-4 w-4" />
              <span>{user?.role === 'admin' ? 'Admin Panel' : 'Console'}</span>
            </NavLink>

            <NavLink
              to="/about"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'text-accent-cyan bg-white/5'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <HelpCircle className="h-4 w-4" />
              <span>About</span>
            </NavLink>

            <NavLink
              to="/contact"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'text-accent-cyan bg-white/5'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Contact</span>
            </NavLink>
          </div>

          {/* Status Indicator & Auth Controls */}
          <div className="hidden md:flex items-center gap-4">
            <Link 
              to="/dashboard?tab=database" 
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold backdrop-blur-md transition-all hover:scale-[1.02] ${
                dbStatus?.is_connected
                  ? dbStatus.database_type === 'PostgreSQL'
                    ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10'
                    : 'border-amber-500/20 bg-amber-500/5 text-amber-400 hover:bg-amber-500/10'
                  : 'border-rose-500/20 bg-rose-500/5 text-rose-400 hover:bg-rose-500/10'
              }`}
            >
              <Database className="h-3.5 w-3.5" />
              <span>
                {dbStatus?.is_connected
                  ? dbStatus.database_type === 'PostgreSQL'
                    ? 'Postres Connected'
                    : 'SQLite Fallback'
                  : 'DB Disconnected'}
              </span>
            </Link>

            {user ? (
              <div className="flex items-center gap-3">
                <span className="hidden lg:inline text-xs font-semibold text-slate-400">
                  User: <span className="text-white">{user.name}</span>
                </span>
                <button
                  onClick={onLogout}
                  className="rounded-lg border border-white/10 hover:border-rose-500/20 bg-white/5 hover:bg-rose-500/5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-rose-400 transition-all active:scale-95"
                >
                  Logout
                </button>
              </div>
            ) : (
              <NavLink
                to="/login"
                className="rounded-lg bg-gradient-to-r from-accent-cyan to-accent-purple px-4 py-1.5 text-xs font-semibold text-white shadow-lg transition-all hover:scale-102 hover:shadow-accent-cyan/20 active:scale-95"
              >
                Sign In
              </NavLink>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

// Helper internal icons
const GlobeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
    <path d="M2 12h20" />
  </svg>
);
