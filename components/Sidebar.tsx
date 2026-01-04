
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ViewMode } from '../types';

interface SidebarProps {
  activeView: ViewMode;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView }) => {
  const location = useLocation();
  
  const menuItems = [
    { id: ViewMode.DASHBOARD, label: 'Dashboard', icon: 'fa-chart-line', path: '/dashboard' },
    { id: ViewMode.TRANSACTIONS, label: 'Transações', icon: 'fa-list-ul', path: '/transactions' },
    { id: ViewMode.REPORTS, label: 'Relatórios', icon: 'fa-file-invoice-dollar', path: '/reports' },
    { id: ViewMode.UPLOAD, label: 'Importar', icon: 'fa-file-import', path: '/upload' },
    { id: ViewMode.HISTORY, label: 'Histórico', icon: 'fa-clock-rotate-left', path: '/history' },
  ];

  const isActive = (path: string) => {
    return location.pathname === path || (path === '/dashboard' && location.pathname === '/');
  };

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0 hidden md:flex">
      <div className="p-8">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
            <i className="fa-solid fa-vault text-white text-lg"></i>
          </div>
          <span className="text-xl font-bold tracking-tight">Finanza Pro</span>
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive(item.path)
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <i className={`fa-solid ${item.icon} w-5`}></i>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
