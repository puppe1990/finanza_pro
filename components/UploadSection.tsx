
import React, { useRef, useState } from 'react';

interface UploadedFile {
  content: string;
  filename: string;
}

interface UploadSectionProps {
  onUpload: (files: UploadedFile[]) => void;
  isLoading: boolean;
}

const UploadSection: React.FC<UploadSectionProps> = ({ onUpload, isLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFiles = (files: File[]) => {
    const csvFiles = files.filter(file => file.name.toLowerCase().endsWith('.csv'));
    if (!csvFiles.length) {
      alert("Por favor, selecione arquivos CSV válidos.");
      return;
    }

    if (csvFiles.length !== files.length) {
      alert("Alguns arquivos foram ignorados por não serem CSV.");
    }

    Promise.all(
      csvFiles.map(file => (
        new Promise<UploadedFile>((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            const content = event.target?.result as string;
            resolve({ content, filename: file.name });
          };
          reader.readAsText(file);
        })
      ))
    ).then(onUpload);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length) {
      processFiles(files);
    }
    if (e.target.value) {
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) {
      processFiles(files);
    } else {
      alert("Por favor, selecione arquivos CSV válidos.");
    }
  };

  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold text-slate-800">Importar Extratos</h2>
        <p className="text-slate-500 mt-2">Arraste seus arquivos CSV ou clique para selecionar do seu computador.</p>
      </div>

      <div 
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative cursor-pointer group rounded-3xl border-2 border-dashed transition-all p-12 text-center flex flex-col items-center justify-center ${
          isDragging 
          ? 'border-indigo-500 bg-indigo-50' 
          : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50'
        }`}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept=".csv" 
          multiple
          className="hidden" 
        />
        
        {isLoading ? (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p className="text-indigo-600 font-medium animate-pulse">Processando dados...</p>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-300">
              <i className="fa-solid fa-file-csv text-3xl text-slate-400 group-hover:text-indigo-500"></i>
            </div>
            <div className="space-y-1">
              <p className="text-lg font-bold text-slate-800">Clique para adicionar arquivos</p>
              <p className="text-sm text-slate-400">Suporta múltiplos .csv exportados do banco</p>
            </div>
          </>
        )}
      </div>

      <div className="mt-10 bg-slate-50 rounded-2xl p-6 border border-slate-100">
        <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
          <i className="fa-solid fa-circle-info text-indigo-500"></i>
          Dica de Formatação
        </h4>
        <p className="text-sm text-slate-500 leading-relaxed">
          Certifique-se de que seu arquivo CSV utilize o caractere ponto-e-vírgula <code className="bg-white px-1.5 py-0.5 rounded border text-indigo-600 font-bold">;</code> como separador e contenha as colunas: 
          <span className="font-semibold text-slate-700"> DATA, TIPO, DESCRICAO e VALOR.</span>
        </p>
      </div>
    </div>
  );
};

export default UploadSection;
