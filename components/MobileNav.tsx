
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ViewMode } from '../types';

interface MobileNavProps {
  activeView: ViewMode;
}

const MobileNav: React.FC<MobileNavProps> = ({ activeView }) => {
  const location = useLocation();
  
  const menuItems = [
    { id: ViewMode.DASHBOARD, label: 'Início', icon: 'fa-house', path: '/dashboard' },
    { id: ViewMode.TRANSACTIONS, label: 'Extrato', icon: 'fa-list-ul', path: '/transactions' },
    { id: ViewMode.REPORTS, label: 'Docs', icon: 'fa-file-invoice-dollar', path: '/reports' },
    { id: ViewMode.UPLOAD, label: 'Subir', icon: 'fa-circle-plus', path: '/upload' },
    { id: ViewMode.HISTORY, label: 'Logs', icon: 'fa-clock-rotate-left', path: '/history' },
  ];

  const isActive = (path: string) => {
    return location.pathname === path || (path === '/dashboard' && location.pathname === '/');
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3 z-50 flex items-center justify-between shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
      {menuItems.map((item) => (
        <Link
          key={item.id}
          to={item.path}
          className={`flex flex-col items-center gap-1 transition-all duration-200 ${
            isActive(item.path) ? 'text-indigo-600' : 'text-slate-400'
          }`}
        >
          <div className={`text-lg ${isActive(item.path) ? 'scale-110' : ''}`}>
            <i className={`fa-solid ${item.icon}`}></i>
          </div>
          <span className="text-[9px] font-bold uppercase tracking-tight">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
};

export default MobileNav;
