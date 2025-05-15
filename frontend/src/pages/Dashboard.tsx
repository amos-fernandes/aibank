
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, ArrowDownLeft, Plus, CreditCard, Send, PiggyBank } from 'lucide-react';
import { useBank, Transaction } from '@/contexts/BankContext';
import { useAuth } from '@/contexts/AuthContext';
import AppNav from '@/components/AppNav';

const Dashboard = () => {
  const { balance, transactions } = useBank();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showBalance, setShowBalance] = useState(true);
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  // Group transactions by date for display
  const groupTransactionsByDate = (transactions: Transaction[]) => {
    const groups: { [key: string]: Transaction[] } = {};
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      
      groups[dateKey].push(transaction);
    });
    
    return Object.entries(groups)
      .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
      .slice(0, 10); // Only show last 10 days with transactions
  };
  
  const groupedTransactions = groupTransactionsByDate(transactions);
  
  const getFormattedDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Hoje';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    } else {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      });
    }
  };
  
  // Calculate recent income and expenses
  const recentStats = transactions.slice(0, 10).reduce(
    (acc, transaction) => {
      if (transaction.type === 'credit') {
        acc.income += transaction.amount;
      } else {
        acc.expenses += transaction.amount;
      }
      return acc;
    },
    { income: 0, expenses: 0 }
  );
  
  return (
    <div className="min-h-screen bg-gray-50 pb-16 lg:pb-0 lg:pl-64">
      <AppNav />
      
      <div className="container mx-auto px-4 py-6">
        {/* Welcome section */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Olá, {user?.name.split(' ')[0]}
          </h1>
          <p className="text-gray-600">
            Bem-vindo de volta ao seu painel financeiro
          </p>
        </div>
        
        {/* Balance Card */}
        <div className="bank-card mb-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white/80 text-sm mb-1">Saldo disponível</p>
              <h2 className="text-2xl font-bold flex items-center">
                {showBalance ? formatCurrency(balance) : '••••••'}
                <button 
                  onClick={() => setShowBalance(!showBalance)} 
                  className="ml-2 opacity-70 hover:opacity-100"
                >
                  {showBalance ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path>
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path>
                      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path>
                      <line x1="2" x2="22" y1="2" y2="22"></line>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </h2>
            </div>
            
            <div className="flex space-x-1">
              <div className="bg-white/20 rounded-lg p-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v18"></path>
                  <rect width="18" height="18" x="3" y="3" rx="2"></rect>
                  <path d="M3 9h18"></path>
                  <path d="M3 15h18"></path>
                </svg>
              </div>
            </div>
          </div>
          
          {/* Income/Expense indicators */}
          <div className="flex mt-8 space-x-4">
            <div className="flex-1 bg-white/10 rounded-lg p-3">
              <div className="flex items-center">
                <div className="bg-green-500/20 p-2 rounded-full mr-3">
                  <ArrowDownLeft className="text-green-500" size={16} />
                </div>
                <div>
                  <p className="text-xs text-white/70">Recebido</p>
                  <p className="font-semibold">{formatCurrency(recentStats.income)}</p>
                </div>
              </div>
            </div>
            
            <div className="flex-1 bg-white/10 rounded-lg p-3">
              <div className="flex items-center">
                <div className="bg-red-500/20 p-2 rounded-full mr-3">
                  <ArrowUpRight className="text-red-500" size={16} />
                </div>
                <div>
                  <p className="text-xs text-white/70">Enviado</p>
                  <p className="font-semibold">{formatCurrency(recentStats.expenses)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Ações rápidas</h3>
          <div className="grid grid-cols-4 gap-3">
            <button onClick={() => navigate('/transfer')} className="action-btn">
              <Send size={24} className="text-bank-teal mb-2" />
              <span className="text-sm">Enviar</span>
            </button>
            <button className="action-btn">
              <Plus size={24} className="text-bank-purple mb-2" />
              <span className="text-sm">Depositar</span>
            </button>
            <button onClick={() => navigate('/credit-card')} className="action-btn">
              <CreditCard size={24} className="text-bank-coral mb-2" />
              <span className="text-sm">Cartão</span>
            </button>
            <button onClick={() => navigate('/crypto')} className="action-btn">
              <PiggyBank size={24} className="text-bank-neon-green mb-2" />
              <span className="text-sm">Cripto</span>
            </button>
          </div>
        </div>
        
        {/* Transactions */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Transações recentes</h3>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {groupedTransactions.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <p>Nenhuma transação encontrada.</p>
              </div>
            ) : (
              groupedTransactions.map(([date, dayTransactions]) => (
                <div key={date} className="border-b border-gray-100 last:border-b-0">
                  <div className="px-4 py-2 bg-gray-50">
                    <p className="text-sm font-medium text-gray-600">
                      {getFormattedDate(date)}
                    </p>
                  </div>
                  
                  {dayTransactions.map((transaction) => (
                    <div key={transaction.id} className="transaction-item">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                          transaction.type === 'credit' 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-red-100 text-red-600'
                        }`}>
                          {transaction.type === 'credit' ? (
                            <ArrowDownLeft size={18} />
                          ) : (
                            <ArrowUpRight size={18} />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">
                            {transaction.description}
                          </p>
                          <p className="text-xs text-gray-500">
                            {transaction.category}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${
                          transaction.type === 'credit' 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {transaction.type === 'credit' ? '+' : '-'}
                          {formatCurrency(transaction.amount)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(transaction.date)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
