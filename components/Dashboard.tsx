
import React, { useMemo, useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar, Legend, LabelList, Dot
} from 'recharts';
import { Transaction } from '../types';
import { getFinancialSummary, formatCurrency } from '../utils';
import ChartShell from './ChartShell';

interface DashboardProps {
  transactions: Transaction[];
}

const Dashboard: React.FC<DashboardProps> = ({ transactions }) => {
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    transactions.forEach(t => {
      const monthYear = t.date.slice(3);
      if (monthYear && monthYear.length === 7) months.add(monthYear);
    });
    return Array.from(months).sort((a, b) => {
      const [m1, y1] = a.split('/').map(Number);
      const [m2, y2] = b.split('/').map(Number);
      return y2 !== y1 ? y2 - y1 : m2 - m1;
    });
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesMonth = selectedMonth === 'all' || t.date.slice(3) === selectedMonth;
      const matchesType = filterType === 'all' || 
                         (filterType === 'income' && t.amount > 0) || 
                         (filterType === 'expense' && t.amount < 0);
      return matchesMonth && matchesType;
    });
  }, [transactions, selectedMonth, filterType]);

  const summary = useMemo(() => getFinancialSummary(filteredTransactions), [filteredTransactions]);

  const chartData = useMemo(() => {
    const groups: { [key: string]: number } = {};
    filteredTransactions.forEach(t => {
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
  }, [filteredTransactions]);

  const categoryData = useMemo(() => {
    const categories: { [key: string]: number } = {};
    filteredTransactions.filter(t => t.amount < 0).forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + Math.abs(t.amount);
    });
    const total = Object.values(categories).reduce((sum, val) => sum + val, 0);
    return Object.entries(categories)
      .map(([name, value]) => ({ 
        name, 
        value,
        percentage: total > 0 ? ((value / total) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#a855f7'];

  // Custom tooltip for area chart
  const CustomAreaTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-200">
          <p className="text-xs font-semibold text-slate-600 mb-1">{payload[0].payload.date}</p>
          <p className="text-base font-bold text-indigo-600">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for pie chart
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-200">
          <p className="text-sm font-semibold text-slate-800 mb-1">{payload[0].name}</p>
          <p className="text-base font-bold text-slate-900">
            {formatCurrency(payload[0].value)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {payload[0].payload.percentage}% do total
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom label for pie chart
  const renderCustomLabel = (entry: any) => {
    if (entry && entry.percentage && parseFloat(entry.percentage) > 5) {
      return `${entry.percentage}%`;
    }
    return '';
  };

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
      {/* Filters Section */}
      <div className="bg-white p-4 md:p-5 rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-filter text-indigo-500 text-sm"></i>
            <span className="text-sm font-semibold text-slate-700">Filtros</span>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {/* Month Filter */}
            <div className="relative flex-1 sm:flex-initial">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full sm:w-auto appearance-none bg-white border border-slate-300 rounded-xl px-4 py-2.5 pr-10 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer hover:border-slate-400 transition-colors"
              >
                <option value="all">Todos os períodos</option>
                {availableMonths.map((month) => {
                  const [m, y] = month.split('/').map(Number);
                  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                                     'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
                  return (
                    <option key={month} value={month}>
                      {monthNames[m - 1]} {y}
                    </option>
                  );
                })}
              </select>
              <i className="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-2">
              {[
                { id: 'all', label: 'Todos', icon: 'fa-list' },
                { id: 'income', label: 'Receitas', icon: 'fa-arrow-up' },
                { id: 'expense', label: 'Despesas', icon: 'fa-arrow-down' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterType(f.id as 'all' | 'income' | 'expense')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap border ${
                    filterType === f.id
                      ? f.id === 'all'
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                        : f.id === 'income'
                        ? 'bg-green-600 border-green-600 text-white shadow-sm'
                        : 'bg-red-600 border-red-600 text-white shadow-sm'
                      : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50 hover:border-slate-400'
                  }`}
                >
                  <i className={`fa-solid ${f.icon} text-xs`}></i>
                  <span>{f.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Active filters indicator */}
        {(selectedMonth !== 'all' || filterType !== 'all') && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-500 font-medium">Filtros ativos:</span>
            {selectedMonth !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold">
                {(() => {
                  const [m, y] = selectedMonth.split('/').map(Number);
                  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
                                     'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                  return `${monthNames[m - 1]} ${y}`;
                })()}
                <button
                  onClick={() => setSelectedMonth('all')}
                  className="hover:text-indigo-900"
                >
                  <i className="fa-solid fa-times text-[10px]"></i>
                </button>
              </span>
            )}
            {filterType !== 'all' && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                filterType === 'income' 
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              }`}>
                {filterType === 'income' ? 'Receitas' : 'Despesas'}
                <button
                  onClick={() => setFilterType('all')}
                  className="hover:opacity-75"
                >
                  <i className="fa-solid fa-times text-[10px]"></i>
                </button>
              </span>
            )}
            <button
              onClick={() => {
                setSelectedMonth('all');
                setFilterType('all');
              }}
              className="ml-auto text-xs text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1"
            >
              <i className="fa-solid fa-xmark text-xs"></i>
              Limpar tudo
            </button>
          </div>
        )}
      </div>

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
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base md:text-lg font-bold text-slate-800">Fluxo Financeiro</h3>
            <span className="text-xs text-slate-500 font-medium">
              {chartData.length} {chartData.length === 1 ? 'período' : 'períodos'}
            </span>
          </div>
          <ChartShell className="h-64 md:h-80 w-full min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
              <AreaChart 
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="50%" stopColor="#6366f1" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" strokeWidth={1} />
                <XAxis 
                  dataKey="date" 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  fontWeight={500}
                  tickLine={false} 
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis 
                  stroke="#94a3b8"
                  fontSize={11}
                  fontWeight={500}
                  tickLine={false}
                  axisLine={false}
                  width={70}
                  tickFormatter={(value) => {
                    if (Math.abs(value) >= 1000) {
                      return `R$ ${(value / 1000).toFixed(1)}k`;
                    }
                    return `R$ ${value}`;
                  }}
                />
                <Tooltip content={<CustomAreaTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#6366f1" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#colorAmount)"
                  dot={{ fill: '#6366f1', r: 3, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
                  animationDuration={800}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartShell>
        </div>

        <div className="bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base md:text-lg font-bold text-slate-800">Por Categoria</h3>
            <span className="text-xs text-slate-500 font-medium">
              {categoryData.length} {categoryData.length === 1 ? 'categoria' : 'categorias'}
            </span>
          </div>
          <ChartShell className="h-56 md:h-64 w-full min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={600}
                  label={renderCustomLabel}
                  labelLine={false}
                >
                  {categoryData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartShell>
          <div className="mt-4 space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
            {categoryData.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between text-xs hover:bg-slate-50 p-1.5 rounded-lg transition-colors">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div 
                    className="w-3 h-3 rounded-full shrink-0" 
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  ></div>
                  <span className="text-slate-600 font-medium truncate">{item.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-slate-400 text-[10px] font-medium">{item.percentage}%</span>
                  <span className="font-bold text-slate-900">{formatCurrency(item.value)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bar Chart for Categories */}
      {categoryData.length > 0 && (
        <div className="bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base md:text-lg font-bold text-slate-800 flex items-center gap-2">
              <i className="fa-solid fa-chart-bar text-indigo-500"></i>
              Despesas por Categoria
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Top {Math.min(categoryData.length, 8)} categorias
            </span>
          </div>
          <ChartShell className="h-72 md:h-80 w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={250}>
              <BarChart 
                data={categoryData.slice(0, 8)} 
                layout="vertical"
                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  type="number" 
                  hide
                />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  fontSize={12}
                  fontWeight={500}
                  width={100} 
                  stroke="#64748b"
                />
                <Tooltip 
                  cursor={{fill: 'rgba(99, 102, 241, 0.1)'}}
                  content={(props: any) => {
                    if (props.active && props.payload && props.payload.length) {
                      const data = props.payload[0].payload;
                      return (
                        <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-200">
                          <p className="text-sm font-semibold text-slate-800 mb-1">{data.name}</p>
                          <p className="text-base font-bold text-indigo-600">
                            {formatCurrency(data.value)}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {data.percentage}% do total de despesas
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="value" 
                  radius={[0, 8, 8, 0]}
                  animationDuration={800}
                >
                  {categoryData.slice(0, 8).map((entry, index) => (
                    <Cell key={`bar-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartShell>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
