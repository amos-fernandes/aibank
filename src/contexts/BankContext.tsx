import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from './AuthContext';

export type Transaction = {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  category: string;
  date: string;
};

type BankContextType = {
  balance: number;
  transactions: Transaction[];
  isLoading: boolean;
  sendPix: (amount: number, description: string, recipient: string) => Promise<void>;
  sendTransfer: (amount: number, description: string, recipient: string) => Promise<void>;
  buyCrypto: (amount: number, cryptoType: string) => Promise<void>;
  formatCurrency: (value: number) => string;
};

const BankContext = createContext<BankContextType | undefined>(undefined);

export const useBank = () => {
  const context = useContext(BankContext);
  if (context === undefined) {
    throw new Error('useBank must be used within a BankProvider');
  }
  return context;
};

// Generate mock transactions
const generateMockTransactions = (): Transaction[] => {
  const transactions: Transaction[] = [];
  const categories = ['Alimentação', 'Transporte', 'Lazer', 'Educação', 'Saúde'];
  const creditDescriptions = ['Salário', 'Transferência recebida', 'PIX recebido', 'Reembolso', 'Rendimento'];
  const debitDescriptions = ['Compra', 'Transferência enviada', 'PIX enviado', 'Fatura', 'Assinatura'];
  
  // Current date
  const today = new Date();
  
  // Generate 15 random transactions from the last 30 days
  for (let i = 0; i < 15; i++) {
    const isCredit = Math.random() > 0.6;
    const daysAgo = Math.floor(Math.random() * 30);
    const transDate = new Date(today);
    transDate.setDate(today.getDate() - daysAgo);
    
    transactions.push({
      id: `trans-${Date.now()}-${i}`,
      type: isCredit ? 'credit' : 'debit',
      amount: Math.floor(Math.random() * 1000) + 50,
      description: isCredit 
        ? creditDescriptions[Math.floor(Math.random() * creditDescriptions.length)]
        : debitDescriptions[Math.floor(Math.random() * debitDescriptions.length)],
      category: categories[Math.floor(Math.random() * categories.length)],
      date: transDate.toISOString()
    });
  }
  
  // Sort transactions by date (newest first)
  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const BankProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(10000); // Initial balance of R$ 10,000
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    // Load saved transactions from localStorage or generate new ones
    if (user) {
      const savedTransactions = localStorage.getItem(`finverse_transactions_${user.id}`);
      const savedBalance = localStorage.getItem(`finverse_balance_${user.id}`);
      
      if (savedTransactions && savedBalance) {
        setTransactions(JSON.parse(savedTransactions));
        setBalance(parseFloat(savedBalance));
      } else {
        // Generate mock data for new users
        const mockTransactions = generateMockTransactions();
        setTransactions(mockTransactions);
        
        // Save to localStorage
        localStorage.setItem(`finverse_transactions_${user.id}`, JSON.stringify(mockTransactions));
        localStorage.setItem(`finverse_balance_${user.id}`, balance.toString());
      }
    }
  }, [user]);
  
  // Save transactions and balance whenever they change
  useEffect(() => {
    if (user) {
      localStorage.setItem(`finverse_transactions_${user.id}`, JSON.stringify(transactions));
      localStorage.setItem(`finverse_balance_${user.id}`, balance.toString());
    }
  }, [transactions, balance, user]);
  
  const addTransaction = (transaction: Omit<Transaction, 'id' | 'date'>) => {
    const newTransaction: Transaction = {
      id: `trans-${Date.now()}`,
      date: new Date().toISOString(),
      ...transaction
    };
    
    setTransactions(prev => [newTransaction, ...prev]);
    
    // Update balance
    if (transaction.type === 'credit') {
      setBalance(prev => prev + transaction.amount);
    } else {
      setBalance(prev => prev - transaction.amount);
    }
    
    return newTransaction;
  };
  
  // Format currency function
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  // Send PIX function
  const sendPix = async (amount: number, description: string, recipient: string) => {
    try {
      setIsLoading(true);
      
      // Check if user has enough balance
      if (amount > balance) {
        toast({
          variant: "destructive",
          title: "Saldo insuficiente",
          description: "Você não tem saldo suficiente para realizar esta operação."
        });
        return;
      }
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Add transaction
      addTransaction({
        type: 'debit',
        amount,
        description: `PIX enviado para ${recipient}`,
        category: 'Transferência'
      });
      
      toast({
        title: "PIX enviado com sucesso!",
        description: `R$ ${amount.toFixed(2)} enviado para ${recipient}`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao enviar PIX",
        description: "Ocorreu um erro ao processar sua transferência. Tente novamente."
      });
      console.error('PIX error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Send Transfer function
  const sendTransfer = async (amount: number, description: string, recipient: string) => {
    try {
      setIsLoading(true);
      
      // Check if user has enough balance
      if (amount > balance) {
        toast({
          variant: "destructive",
          title: "Saldo insuficiente",
          description: "Você não tem saldo suficiente para realizar esta transferência."
        });
        return;
      }
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Add transaction
      addTransaction({
        type: 'debit',
        amount,
        description: `Transferência para ${recipient}`,
        category: 'Transferência'
      });
      
      toast({
        title: "Transferência realizada com sucesso!",
        description: `R$ ${amount.toFixed(2)} transferido para ${recipient}`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro na transferência",
        description: "Ocorreu um erro ao processar sua transferência. Tente novamente."
      });
      console.error('Transfer error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Buy Crypto function
  const buyCrypto = async (amount: number, cryptoType: string) => {
    try {
      setIsLoading(true);
      
      // Check if user has enough balance
      if (amount > balance) {
        toast({
          variant: "destructive",
          title: "Saldo insuficiente",
          description: "Você não tem saldo suficiente para realizar esta compra."
        });
        return;
      }
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Add transaction
      addTransaction({
        type: 'debit',
        amount,
        description: `Compra de ${cryptoType}`,
        category: 'Investimento'
      });
      
      toast({
        title: "Criptomoeda adquirida!",
        description: `Você comprou R$ ${amount.toFixed(2)} em ${cryptoType}`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro na compra",
        description: "Ocorreu um erro ao processar sua compra de criptomoeda. Tente novamente."
      });
      console.error('Crypto purchase error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <BankContext.Provider
      value={{
        balance,
        transactions,
        isLoading,
        sendPix,
        sendTransfer,
        buyCrypto,
        formatCurrency
      }}
    >
      {children}
    </BankContext.Provider>
  );
};
