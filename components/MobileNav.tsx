
import React from 'react';
import { ViewMode } from '../types';

interface MobileNavProps {
  activeView: ViewMode;
  setView: (view: ViewMode) => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ activeView, setView }) => {
  const menuItems = [
    { id: ViewMode.DASHBOARD, label: 'Início', icon: 'fa-house' },
    { id: ViewMode.TRANSACTIONS, label: 'Extrato', icon: 'fa-list-ul' },
    { id: ViewMode.REPORTS, label: 'Docs', icon: 'fa-file-invoice-dollar' },
    { id: ViewMode.UPLOAD, label: 'Subir', icon: 'fa-circle-plus' },
    { id: ViewMode.HISTORY, label: 'Logs', icon: 'fa-clock-rotate-left' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3 z-50 flex items-center justify-between shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
      {menuItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setView(item.id)}
          className={`flex flex-col items-center gap-1 transition-all duration-200 ${
            activeView === item.id ? 'text-indigo-600' : 'text-slate-400'
          }`}
        >
          <div className={`text-lg ${activeView === item.id ? 'scale-110' : ''}`}>
            <i className={`fa-solid ${item.icon}`}></i>
          </div>
          <span className="text-[9px] font-bold uppercase tracking-tight">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default MobileNav;
