
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ViewMode, Transaction, UploadRecord } from './types';
import { parseCSV } from './utils';
import { fetchData, uploadData, clearData as clearServerData } from './api';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import UploadSection from './components/UploadSection';
import UploadHistory from './components/UploadHistory';
import GeminiAssistant from './components/GeminiAssistant';
import MobileNav from './components/MobileNav';
import ReportsView from './components/ReportsView';

const App: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUploadTime, setLastUploadTime] = useState<string | null>(null);
  const [dbUnavailable, setDbUnavailable] = useState(false);

  // Determine current view from location
  const getCurrentView = (): ViewMode => {
    const path = location.pathname;
    if (path === '/dashboard' || path === '/') return ViewMode.DASHBOARD;
    if (path === '/transactions') return ViewMode.TRANSACTIONS;
    if (path === '/upload') return ViewMode.UPLOAD;
    if (path === '/history') return ViewMode.HISTORY;
    if (path === '/reports') return ViewMode.REPORTS;
    return ViewMode.DASHBOARD;
  };

  const view = getCurrentView();

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const data = await fetchData();
        if (!isMounted) return;
        setTransactions(data.transactions || []);
        setUploads(data.uploads || []);
        setDbUnavailable(false);
      } catch (error) {
        console.warn('Database unavailable, falling back to local state.', error);
        if (isMounted) setDbUnavailable(true);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleFileUpload = async (files: { content: string; filename: string }[]) => {
    setIsLoading(true);
    const allTransactions: Transaction[] = [];
    const newUploads: UploadRecord[] = [];

    try {
      for (const file of files) {
        const parsed = parseCSV(file.content);
        const now = new Date();
        const timestamp = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
        const newRecord: UploadRecord = {
          id: Math.random().toString(36).substr(2, 9),
          filename: file.filename,
          timestamp: timestamp,
          transactionCount: parsed.length,
        };

        if (!dbUnavailable) {
          await uploadData({
            uploadId: newRecord.id,
            filename: newRecord.filename,
            timestamp: newRecord.timestamp,
            transactions: parsed,
          });
        }

        allTransactions.push(...parsed);
        newUploads.push(newRecord);
      }

      setTransactions(prev => [...prev, ...allTransactions]);
      setUploads(prev => [...newUploads, ...prev]);
      setLastUploadTime(new Date().toLocaleTimeString());
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to save upload.', error);
      alert('Erro ao salvar os dados. Tente novamente.');
      setDbUnavailable(true);
    } finally {
      setIsLoading(false);
    }
  };

  const clearData = async () => {
    if (window.confirm("Deseja realmente apagar todos os dados e o histórico?")) {
      try {
        if (!dbUnavailable) {
          await clearServerData();
        }
        setTransactions([]);
        setUploads([]);
        setLastUploadTime(null);
      } catch (error) {
        console.error('Failed to clear data.', error);
        alert('Erro ao apagar os dados. Tente novamente.');
      }
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-['Inter']">
      {/* Sidebar (Desktop only) */}
      <Sidebar activeView={view} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header - Fixed Height */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            {/* Small logo for mobile */}
            <div className="md:hidden w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <i className="fa-solid fa-vault text-white text-sm"></i>
            </div>
            <h1 className="text-base md:text-xl font-bold text-slate-800 truncate">
              {view === ViewMode.DASHBOARD && "Dashboard"}
              {view === ViewMode.TRANSACTIONS && "Extrato"}
              {view === ViewMode.UPLOAD && "Importar"}
              {view === ViewMode.HISTORY && "Histórico"}
              {view === ViewMode.REPORTS && "Relatórios"}
            </h1>
          </div>
          
          <div className="flex items-center gap-2 md:gap-3">
            {lastUploadTime && (
              <span className="hidden sm:flex text-[10px] md:text-xs font-medium bg-green-100 text-green-700 px-2 md:px-2.5 py-0.5 rounded-full items-center gap-1">
                <i className="fa-solid fa-check"></i>
                Atualizado
              </span>
            )}
            <button 
              onClick={clearData}
              className="text-slate-400 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-slate-100"
              title="Limpar tudo"
            >
              <i className="fa-solid fa-trash-can text-sm md:text-base"></i>
            </button>
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs md:text-sm shadow-sm">
              JD
            </div>
          </div>
        </header>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 pb-24 md:pb-8">
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard transactions={transactions} />} />
              <Route path="/transactions" element={<TransactionList transactions={transactions} />} />
              <Route path="/upload" element={<UploadSection onUpload={handleFileUpload} isLoading={isLoading} />} />
              <Route path="/history" element={<UploadHistory uploads={uploads} />} />
              <Route path="/reports" element={<ReportsView transactions={transactions} />} />
            </Routes>
          </div>
        </div>

        {/* Gemini Intelligence Widget */}
        {transactions.length > 0 && <GeminiAssistant transactions={transactions} />}
        
        {/* Mobile Navigation Bar */}
        <MobileNav activeView={view} />
      </main>
    </div>
  );
};

export default App;
