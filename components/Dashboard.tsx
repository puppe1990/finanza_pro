
import React, { useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar 
} from 'recharts';
import { Transaction } from '../types';
import { getFinancialSummary, formatCurrency } from '../utils';

interface DashboardProps {
  transactions: Transaction[];
}

const Dashboard: React.FC<DashboardProps> = ({ transactions }) => {
  const summary = useMemo(() => getFinancialSummary(transactions), [transactions]);

  const chartData = useMemo(() => {
    const groups: { [key: string]: number } = {};
    transactions.forEach(t => {
      const date = t.date;
      groups[date] = (groups[date] || 0) + t.amount;
    });
    return Object.entries(groups)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => {
        const [d1, m1, y1] = a.date.split('/');
        const [d2, m2, y2] = b.date.split('/');
        return new Date(`${y1}-${m1}-${d1}`).getTime() - new Date(`${y2}-${m2}-${d2}`).getTime();
      });
  }, [transactions]);

  const categoryData = useMemo(() => {
    const categories: { [key: string]: number } = {};
    transactions.filter(t => t.amount < 0).forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + Math.abs(t.amount);
    });
    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-6">
          <i className="fa-solid fa-cloud-arrow-up text-2xl text-slate-300"></i>
        </div>
        <h3 className="text-lg font-bold text-slate-800">Pronto para começar?</h3>
        <p className="text-slate-400 mt-2 text-sm max-w-xs mx-auto">Importe seu extrato em formato CSV para ver a mágica acontecer aqui no Dashboard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Stat Cards - Stacked on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white p-5 rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
              <i className="fa-solid fa-wallet text-indigo-600 text-sm"></i>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Saldo Atual</p>
              <h3 className="text-xl font-bold text-slate-900">{formatCurrency(summary.balance)}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
              <i className="fa-solid fa-arrow-up text-green-600 text-sm"></i>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Receitas</p>
              <h3 className="text-xl font-bold text-slate-900">{formatCurrency(summary.totalIncome)}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
              <i className="fa-solid fa-arrow-down text-red-600 text-sm"></i>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Despesas</p>
              <h3 className="text-xl font-bold text-slate-900">{formatCurrency(summary.totalExpenses)}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 mb-6">Fluxo Financeiro</h3>
          <div className="h-64 md:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                <XAxis dataKey="date" stroke="#cbd5e1" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  formatter={(value: number) => [formatCurrency(value), 'Saldo']}
                />
                <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 mb-6">Por Categoria</h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-1">
            {categoryData.slice(0, 3).map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                  <span className="text-slate-500 truncate max-w-[80px]">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
