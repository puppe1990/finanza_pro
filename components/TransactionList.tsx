
import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { formatCurrency } from '../utils';

interface TransactionListProps {
  transactions: Transaction[];
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    transactions.forEach(t => {
      const monthYear = t.date.slice(3);
      if (monthYear) months.add(monthYear);
    });
    return Array.from(months).sort((a, b) => {
      const [m1, y1] = a.split('/').map(Number);
      const [m2, y2] = b.split('/').map(Number);
      return y2 !== y1 ? y2 - y1 : m2 - m1;
    });
  }, [transactions]);

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           t.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || 
                         (filterType === 'income' && t.amount > 0) || 
                         (filterType === 'expense' && t.amount < 0);
      const matchesMonth = selectedMonth === 'all' || t.date.slice(3) === selectedMonth;
      
      return matchesSearch && matchesType && matchesMonth;
    }).sort((a, b) => {
        const [d1, m1, y1] = a.date.split('/');
        const [d2, m2, y2] = b.date.split('/');
        return new Date(`${y2}-${m2}-${d2}`).getTime() - new Date(`${y1}-${m1}-${d1}`).getTime();
    });
  }, [transactions, searchTerm, filterType, selectedMonth]);

  return (
    <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 md:p-6 border-b border-slate-100 space-y-4">
        {/* Search and Month Filter Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
            <input 
              type="text" 
              placeholder="Pesquisar..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="relative">
            <select 
              className="w-full sm:w-40 pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm appearance-none font-medium text-slate-600"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="all">Período</option>
              {availableMonths.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <i className="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[10px]"></i>
          </div>
        </div>

        {/* Quick Filters Row */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
          {[
            { id: 'all', label: 'Todos', color: 'indigo' },
            { id: 'income', label: 'Receitas', color: 'green' },
            { id: 'expense', label: 'Despesas', color: 'red' }
          ].map((f) => (
            <button 
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${
                filterType === f.id 
                ? `bg-${f.color}-600 border-${f.color}-600 text-white shadow-sm` 
                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[500px]">
          <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-widest font-bold">
            <tr>
              <th className="px-4 md:px-6 py-3 w-10"></th>
              <th className="px-4 md:px-6 py-3">Data</th>
              <th className="px-4 md:px-6 py-3">Descrição</th>
              <th className="px-4 md:px-6 py-3 text-right">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length > 0 ? (
              filtered.map((t) => (
                <React.Fragment key={t.id}>
                  <tr 
                    className={`hover:bg-slate-50 transition-colors cursor-pointer group ${expandedRows[t.id] ? 'bg-indigo-50/30' : ''}`}
                    onClick={() => toggleRow(t.id)}
                  >
                    <td className="px-4 md:px-6 py-4">
                      <i className={`fa-solid fa-chevron-right text-[10px] transition-transform duration-200 ${expandedRows[t.id] ? 'rotate-90 text-indigo-600' : 'text-slate-300 group-hover:text-slate-500'}`}></i>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-xs font-medium text-slate-400">{t.date}</td>
                    <td className="px-4 md:px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-700 leading-tight">{t.description}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">{t.category}</span>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-right">
                      <span className={`text-sm font-bold ${t.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(t.amount)}
                      </span>
                    </td>
                  </tr>
                  {expandedRows[t.id] && (
                    <tr className="bg-slate-50/50">
                      <td colSpan={4} className="px-4 md:px-6 py-4 border-t border-slate-100/50">
                        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
                          <div>
                            <p className="text-[9px] uppercase font-bold text-slate-400 mb-1">ID da Transação</p>
                            <p className="text-xs font-mono text-slate-600 truncate">{t.id}</p>
                          </div>
                          <div>
                            <p className="text-[9px] uppercase font-bold text-slate-400 mb-1">Método / Tipo</p>
                            <p className="text-xs text-slate-600 font-medium">{t.type || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-sm">
                  {transactions.length === 0 ? 'Nenhum dado importado.' : 'Nada encontrado.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionList;
