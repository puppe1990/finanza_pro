
import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell
} from 'recharts';
import { Transaction } from '../types';
import { formatCurrency, getFinancialSummary } from '../utils';

interface ReportsViewProps {
  transactions: Transaction[];
}

const ReportsView: React.FC<ReportsViewProps> = ({ transactions }) => {
  const [selectedMonth, setSelectedMonth] = useState('all');

  // Extract unique months from transactions for the filter
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    transactions.forEach(t => {
      const monthYear = t.date.slice(3); // Extracts MM/YYYY from DD/MM/YYYY
      if (monthYear && monthYear.length === 7) months.add(monthYear);
    });
    return Array.from(months).sort((a, b) => {
      const [m1, y1] = a.split('/').map(Number);
      const [m2, y2] = b.split('/').map(Number);
      return y2 !== y1 ? y2 - y1 : m2 - m1;
    });
  }, [transactions]);

  // Filter transactions based on selected month
  const filteredTransactions = useMemo(() => {
    if (selectedMonth === 'all') return transactions;
    return transactions.filter(t => t.date.slice(3) === selectedMonth);
  }, [transactions, selectedMonth]);

  const summary = useMemo(() => getFinancialSummary(filteredTransactions), [filteredTransactions]);

  // Aggregate data by description
  const descriptionStats = useMemo(() => {
    const groups: Record<string, { amount: number, count: number, isIncome: boolean }> = {};
    
    filteredTransactions.forEach(t => {
      const desc = t.description || 'Sem descrição';
      if (!groups[desc]) {
        groups[desc] = { amount: 0, count: 0, isIncome: t.amount > 0 };
      }
      groups[desc].amount += t.amount;
      groups[desc].count += 1;
    });

    return Object.entries(groups)
      .map(([name, data]) => ({
        name,
        ...data,
        absAmount: Math.abs(data.amount)
      }))
      .sort((a, b) => b.absAmount - a.absAmount);
  }, [filteredTransactions]);

  // Aggregate data by category for expenses
  const categoryData = useMemo(() => {
    const categories: { [key: string]: number } = {};
    const expenses = filteredTransactions.filter(t => t.amount < 0);
    
    expenses.forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + Math.abs(t.amount);
    });

    return Object.entries(categories)
      .map(([name, value]) => ({ 
        name, 
        value, 
        percentage: (value / (summary.totalExpenses || 1)) * 100 
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions, summary.totalExpenses]);

  // Compare Income vs Expenses
  const comparisonData = [
    { name: 'Entradas', valor: summary.totalIncome, fill: '#10b981' },
    { name: 'Saídas', valor: summary.totalExpenses, fill: '#ef4444' }
  ];

  // Top 5 largest individual expenses
  const topExpenses = useMemo(() => {
    return [...filteredTransactions]
      .filter(t => t.amount < 0)
      .sort((a, b) => a.amount - b.amount)
      .slice(0, 5);
  }, [filteredTransactions]);

  const savingsRate = summary.totalIncome > 0 
    ? ((summary.balance / summary.totalIncome) * 100).toFixed(1) 
    : '0';

  if (transactions.length === 0) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center shadow-sm">
        <i className="fa-solid fa-chart-pie text-5xl text-slate-200 mb-4"></i>
        <h2 className="text-xl font-bold text-slate-800">Sem dados para relatórios</h2>
        <p className="text-slate-500 mt-2 text-sm">Importe um arquivo CSV para visualizar as análises detalhadas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Report Filter Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Análise de Período</h2>
          <p className="text-xs text-slate-500">Exibindo dados de: <span className="font-bold text-indigo-600">{selectedMonth === 'all' ? 'Todo o histórico' : selectedMonth}</span></p>
        </div>
        <div className="relative">
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full md:w-48 pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-bold text-slate-700 appearance-none cursor-pointer"
          >
            <option value="all">Todo o Período</option>
            {availableMonths.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <i className="fa-solid fa-calendar-days absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"></i>
        </div>
      </div>

      {/* Header Executive Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-indigo-600 p-4 rounded-2xl text-white shadow-lg shadow-indigo-200 transition-all hover:scale-[1.02]">
          <p className="text-[10px] uppercase font-bold opacity-80">Taxa de Poupança</p>
          <h4 className="text-xl font-bold">{savingsRate}%</h4>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <p className="text-[10px] uppercase font-bold text-slate-400">Transações</p>
          <h4 className="text-xl font-bold text-slate-800">{filteredTransactions.length}</h4>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <p className="text-[10px] uppercase font-bold text-slate-400">Média de Gasto</p>
          <h4 className="text-xl font-bold text-slate-800">
            {formatCurrency(summary.totalExpenses / (filteredTransactions.filter(t => t.amount < 0).length || 1))}
          </h4>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <p className="text-[10px] uppercase font-bold text-slate-400">Saldo no Mês</p>
          <h4 className={`text-xl font-bold ${summary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(summary.balance)}
          </h4>
        </div>
      </div>

      {/* NEW SECTION: Summary by Description */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800">Acumulado por Descrição</h3>
            <p className="text-xs text-slate-500 mt-1">Total acumulado neste período por beneficiário.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-[10px] font-bold text-slate-400 uppercase">Itens: {descriptionStats.length}</span>
            <div className="bg-indigo-50 px-3 py-1 rounded-full">
              <span className="text-[10px] font-bold text-indigo-600 uppercase">Top 10</span>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-400 font-bold">
              <tr>
                <th className="px-6 py-4">Descrição / Beneficiário</th>
                <th className="px-6 py-4 text-center">Vezes</th>
                <th className="px-6 py-4 text-right">Total Acumulado</th>
                <th className="px-6 py-4 w-32">Peso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {descriptionStats.length > 0 ? (
                descriptionStats.slice(0, 10).map((stat) => {
                  const maxVal = Math.max(...descriptionStats.map(s => s.absAmount));
                  const barWidth = (stat.absAmount / maxVal) * 100;
                  
                  return (
                    <tr key={stat.name} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-slate-700 truncate block max-w-[200px] md:max-w-none">{stat.name}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-lg">
                          {stat.count}x
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-sm font-bold ${stat.isIncome ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(stat.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${stat.isIncome ? 'bg-green-500' : 'bg-indigo-500'}`}
                            style={{ width: `${barWidth}%` }}
                          ></div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-sm italic">
                    Nenhuma transação encontrada para este período.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
            <i className="fa-solid fa-scale-balanced text-indigo-500"></i>
            Entradas vs Saídas
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} stroke="#64748b" />
                <YAxis hide />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Bar dataKey="valor" radius={[8, 8, 0, 0]} barSize={60}>
                  {comparisonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
            <i className="fa-solid fa-layer-group text-indigo-500"></i>
            Gastos por Categoria
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData.slice(0, 6)} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} fontSize={10} width={80} stroke="#64748b" />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsView;
