
import React, { useMemo, useState, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell
} from 'recharts';
import { Transaction } from '../types';
import { formatCurrency, getFinancialSummary } from '../utils';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import ChartShell from './ChartShell';

interface ReportsViewProps {
  transactions: Transaction[];
}

const ReportsView: React.FC<ReportsViewProps> = ({ transactions }) => {
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [expandedDesc, setExpandedDesc] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

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
    if (selectedMonth === 'all') return transactions;
    return transactions.filter(t => t.date.slice(3) === selectedMonth);
  }, [transactions, selectedMonth]);

  const summary = useMemo(() => getFinancialSummary(filteredTransactions), [filteredTransactions]);

  const descriptionStats = useMemo(() => {
    const groups: Record<string, { amount: number, count: number, isIncome: boolean, items: Transaction[] }> = {};
    filteredTransactions.forEach(t => {
      const desc = t.description || 'Sem descrição';
      if (!groups[desc]) {
        groups[desc] = { amount: 0, count: 0, isIncome: t.amount > 0, items: [] };
      }
      groups[desc].amount += t.amount;
      groups[desc].count += 1;
      groups[desc].items.push(t);
    });
    return Object.entries(groups)
      .map(([name, data]) => ({
        name,
        ...data,
        absAmount: Math.abs(data.amount)
      }))
      .sort((a, b) => b.absAmount - a.absAmount);
  }, [filteredTransactions]);

  const categoryData = useMemo(() => {
    const categories: { [key: string]: number } = {};
    const expenses = filteredTransactions.filter(t => t.amount < 0);
    expenses.forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + Math.abs(t.amount);
    });
    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  const comparisonData = [
    { name: 'Entradas', valor: summary.totalIncome, fill: '#10b981' },
    { name: 'Saídas', valor: summary.totalExpenses, fill: '#ef4444' }
  ];

  const savingsRate = summary.totalIncome > 0 
    ? ((summary.balance / summary.totalIncome) * 100).toFixed(1) 
    : '0';

  const toggleExpand = (name: string) => {
    setExpandedDesc(expandedDesc === name ? null : name);
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    
    setIsExporting(true);
    try {
      // Ajuste de DPI e configurações para clareza
      const canvas = await html2canvas(reportRef.current, {
        scale: 2.5, // Resolução superior
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (clonedDoc) => {
          const el = clonedDoc.querySelector('[data-report-container]') as HTMLElement;
          if (el) {
            el.style.padding = '20px';
            el.style.width = '1024px'; // Largura fixa para consistência
          }
          // Esconde botões de exportação e setas de expansão no PDF
          clonedDoc.querySelectorAll('.no-pdf').forEach(btn => (btn as HTMLElement).style.display = 'none');
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Proporção do canvas para mm do PDF
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const imgHeightInMm = (canvasHeight * pdfWidth) / canvasWidth;

      let heightLeft = imgHeightInMm;
      let position = 0;

      // Primeira página com cabeçalho extra
      pdf.setFontSize(10);
      pdf.setTextColor(100);
      pdf.text(`Finanza Pro - Relatório Financeiro (${selectedMonth === 'all' ? 'Histórico Total' : selectedMonth})`, 10, 10);
      pdf.text(`Exportado em: ${new Date().toLocaleString('pt-BR')}`, 10, 15);
      
      pdf.addImage(imgData, 'PNG', 0, 20, pdfWidth, imgHeightInMm);
      heightLeft -= (pdfHeight - 20);

      // Adiciona novas páginas se o conteúdo for maior que uma folha
      while (heightLeft >= 0) {
        position = heightLeft - imgHeightInMm;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightInMm);
        heightLeft -= pdfHeight;
      }

      pdf.save(`finanza-pro-relatorio-${selectedMonth.replace('/', '-')}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Erro ao gerar o PDF. Verifique os dados e tente novamente.");
    } finally {
      setIsExporting(false);
    }
  };

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm no-pdf">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Análise de Período</h2>
            <p className="text-xs text-slate-500">Exibindo: <span className="font-bold text-indigo-600">{selectedMonth === 'all' ? 'Histórico Total' : selectedMonth}</span></p>
          </div>
          <button 
            id="pdf-export-btn"
            onClick={handleExportPDF}
            disabled={isExporting}
            className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
              isExporting 
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
            }`}
          >
            <i className={`fa-solid ${isExporting ? 'fa-spinner fa-spin' : 'fa-file-pdf'}`}></i>
            {isExporting ? 'Processando...' : 'Baixar Relatório PDF'}
          </button>
        </div>
        
        <div className="flex items-center gap-3">
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
          <button 
            onClick={handleExportPDF}
            disabled={isExporting}
            className="sm:hidden w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center"
          >
            <i className={`fa-solid ${isExporting ? 'fa-spinner fa-spin' : 'fa-file-pdf'}`}></i>
          </button>
        </div>
      </div>

      {/* Main Export Container */}
      <div ref={reportRef} data-report-container className="space-y-8 bg-slate-50">
        
        {/* Executive Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Taxa de Poupança</p>
            <h4 className="text-xl font-black text-indigo-600">{savingsRate}%</h4>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Volume de Itens</p>
            <h4 className="text-xl font-bold text-slate-800">{filteredTransactions.length}</h4>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Gasto Médio</p>
            <h4 className="text-xl font-bold text-slate-800">
              {formatCurrency(summary.totalExpenses / (filteredTransactions.filter(t => t.amount < 0).length || 1))}
            </h4>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Resultado Líquido</p>
            <h4 className={`text-xl font-bold ${summary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(summary.balance)}
            </h4>
          </div>
        </div>

        {/* Detailed Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800">Acumulado por Descrição</h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Período: {selectedMonth === 'all' ? 'Total' : selectedMonth}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Beneficiário / Descrição</th>
                  <th className="px-6 py-4 text-center">Qtde</th>
                  <th className="px-6 py-4 text-right">Valor Total</th>
                  <th className="px-6 py-4 w-40">Proporção</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {descriptionStats.slice(0, 15).map((stat) => {
                  const maxVal = Math.max(...descriptionStats.map(s => s.absAmount));
                  const barWidth = (stat.absAmount / maxVal) * 100;
                  const isExpanded = expandedDesc === stat.name;
                  
                  return (
                    <React.Fragment key={stat.name}>
                      <tr 
                        className={`hover:bg-slate-50 transition-colors cursor-pointer group ${isExpanded ? 'bg-indigo-50/50' : ''}`}
                        onClick={() => toggleExpand(stat.name)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <i className={`fa-solid fa-chevron-right text-[8px] text-slate-300 no-pdf transition-transform ${isExpanded ? 'rotate-90 text-indigo-500' : ''}`}></i>
                            <span className="text-sm font-semibold text-slate-700">{stat.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-[10px] font-bold text-slate-500">{stat.count}x</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`text-sm font-bold ${stat.isIncome ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(stat.amount)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className={`h-full ${stat.isIncome ? 'bg-green-500' : 'bg-indigo-500'}`} style={{ width: `${barWidth}%` }}></div>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={4} className="p-4 bg-slate-50/50">
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                              <table className="w-full border-collapse">
                                <thead className="bg-slate-50 text-[9px] uppercase font-bold text-slate-400">
                                  <tr>
                                    <th className="px-4 py-2">Data</th>
                                    <th className="px-4 py-2">Categoria</th>
                                    <th className="px-4 py-2 text-right">Valor</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {stat.items.map((item, i) => (
                                    <tr key={i}>
                                      <td className="px-4 py-2 text-xs text-slate-500">{item.date}</td>
                                      <td className="px-4 py-2 text-xs text-slate-400 italic">{item.category}</td>
                                      <td className={`px-4 py-2 text-xs text-right font-bold ${item.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {formatCurrency(item.amount)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Visual Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
              <i className="fa-solid fa-scale-balanced text-indigo-500"></i>
              Composição de Fluxo
            </h3>
            <ChartShell className="h-64 w-full min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} stroke="#64748b" />
                  <YAxis hide />
                  <Tooltip cursor={{fill: '#f8fafc'}} formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="valor" radius={[8, 8, 0, 0]} barSize={60}>
                    {comparisonData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartShell>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
              <i className="fa-solid fa-layer-group text-indigo-500"></i>
              Distribuição por Categoria
            </h3>
            <ChartShell className="h-64 w-full min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
                <BarChart data={categoryData.slice(0, 6)} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} fontSize={10} width={80} stroke="#64748b" />
                  <Tooltip cursor={{fill: '#f8fafc'}} formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartShell>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsView;
