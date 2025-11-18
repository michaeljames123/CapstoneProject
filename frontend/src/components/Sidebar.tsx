import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const linkBase = 'flex items-center gap-3 px-4 py-2 rounded-lg transition-colors';
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `${linkBase} ${isActive ? 'bg-primary-100 text-primary-800' : 'text-gray-700 hover:bg-gray-100'}`;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside
      className={
        `fixed top-16 bottom-0 right-0 z-40 w-72 transform bg-white/90 backdrop-blur-md border-l transition-transform duration-300
         ${open ? 'translate-x-0' : 'translate-x-full'}`
      }
      aria-hidden={!open}
    >
      <div className="h-16 flex items-center px-6 border-b justify-between">
        <span className="text-lg font-semibold text-gray-900">AgridroneInsight</span>
        <button
          type="button"
          onClick={onClose}
          className="md:hidden text-gray-500 hover:text-gray-700 p-2 rounded"
          aria-label="Close sidebar"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        <NavLink to="/dashboard" className={linkClass}>
          <span className="w-5 h-5 rounded bg-primary-200 text-primary-700 flex items-center justify-center">D</span>
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/analyze" className={linkClass}>
          <span className="w-5 h-5 rounded bg-primary-200 text-primary-700 flex items-center justify-center">A</span>
          <span>Analyze</span>
        </NavLink>
        <NavLink to="/field-estimation" className={linkClass}>
          <span className="w-5 h-5 rounded bg-primary-200 text-primary-700 flex items-center justify-center">F</span>
          <span>Field Estimation</span>
        </NavLink>
        <NavLink to="/profile" className={linkClass}>
          <span className="w-5 h-5 rounded bg-primary-200 text-primary-700 flex items-center justify-center">P</span>
          <span>Profile</span>
        </NavLink>
      </nav>
      <div className="p-4 border-t">
        <button onClick={handleLogout} className="w-full bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
