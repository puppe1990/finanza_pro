
import React from 'react';
import { UploadRecord } from '../types';

interface UploadHistoryProps {
  uploads: UploadRecord[];
}

const UploadHistory: React.FC<UploadHistoryProps> = ({ uploads }) => {
  if (uploads.length === 0) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="fa-solid fa-clock-rotate-left text-2xl text-slate-300"></i>
        </div>
        <h2 className="text-xl font-bold text-slate-800">Nenhum histórico disponível</h2>
        <p className="text-slate-500 mt-2">Os arquivos que você importar aparecerão listados aqui.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <h3 className="text-lg font-bold text-slate-800">Logs de Importação</h3>
        <p className="text-sm text-slate-500">Rastreamento de arquivos CSV processados no sistema.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold">
            <tr>
              <th className="px-6 py-4">Arquivo</th>
              <th className="px-6 py-4">Data e Hora</th>
              <th className="px-6 py-4">Registros</th>
              <th className="px-6 py-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {uploads.map((upload) => (
              <tr key={upload.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-50 text-indigo-500 rounded flex items-center justify-center">
                      <i className="fa-solid fa-file-csv"></i>
                    </div>
                    <span className="text-sm font-medium text-slate-700">{upload.filename}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">
                  {upload.timestamp}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {upload.transactionCount} transações
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    Sucesso
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UploadHistory;
