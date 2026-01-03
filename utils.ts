
import { Transaction } from './types';

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const parseCSV = (csvText: string): Transaction[] => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  // Detect header indices
  const headers = lines[0].toLowerCase().split(';');
  const dateIdx = headers.indexOf('data');
  const typeIdx = headers.indexOf('tipo');
  const descIdx = headers.indexOf('descricao');
  const valIdx = headers.indexOf('valor');
  const idIdx = headers.indexOf('codigo da transacao');

  const transactions: Transaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(';');
    if (cols.length < 4) continue;

    const rawValue = cols[valIdx]?.replace(',', '.') || '0';
    const amount = parseFloat(rawValue);
    
    // Categorization logic based on description or type
    let category = 'Outros';
    const desc = (cols[descIdx] || '').toLowerCase();
    const type = (cols[typeIdx] || '').toLowerCase();

    if (desc.includes('mercado') || desc.includes('hortifruti') || desc.includes('armazem')) category = 'Alimentação';
    else if (desc.includes('pix recebido') || desc.includes('vendas')) category = 'Receita';
    else if (desc.includes('fernanda nunes') || desc.includes('marta rodrigues')) category = 'Transferências';
    else if (desc.includes('celesc') || desc.includes('agua') || desc.includes('internet')) category = 'Contas Fixas';
    else if (desc.includes('spotify') || desc.includes('netflix')) category = 'Lazer';
    else if (type.includes('cartão de débito')) category = 'Consumo';

    transactions.push({
      id: cols[idIdx] || Math.random().toString(36).substr(2, 9),
      date: cols[dateIdx] || '',
      type: cols[typeIdx] || '',
      description: cols[descIdx]?.trim() || '',
      amount: amount,
      category: category
    });
  }

  return transactions;
};

export const getFinancialSummary = (transactions: Transaction[]) => {
  const income = transactions.reduce((acc, curr) => curr.amount > 0 ? acc + curr.amount : acc, 0);
  const expenses = transactions.reduce((acc, curr) => curr.amount < 0 ? acc + curr.amount : acc, 0);
  return {
    totalIncome: income,
    totalExpenses: Math.abs(expenses),
    balance: income + expenses,
    transactionCount: transactions.length
  };
};
