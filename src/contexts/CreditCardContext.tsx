
import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchInvestmentPrediction, applyInvestmentReturnToInvoice } from '@/services/investmentService';
import { toast } from '@/components/ui/use-toast';

interface CreditCardTransaction {
  id: string;
  description: string;
  date: string;
  amount: number;
  installments: string;
  installmentAmount: number;
}

interface CreditCardInfo {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  currentInvoice: number;
}

interface InvestmentReturn {
  month: string;
  value: number;
  expectedReturn: number;
}

interface InvestmentHistory {
  date: string;
  startAmount: number;
  endAmount: number;
  returnRate: number;
  returnAmount: number;
  appliedToInvoice: number;
  addedToLimit: number;
}

interface InvestmentPrediction {
  monthlyRate: number;
  recommendation: string;
  marketTrend: string;
  lastUpdated: string;
}

interface CreditCardContextType {
  creditCardInfo: CreditCardInfo;
  availableLimit: number;
  investmentLimit: number;
  showCardDetails: boolean;
  toggleCardDetails: () => void;
  creditCardTransactions: CreditCardTransaction[];
  investmentReturns: InvestmentReturn[];
  investmentHistory: InvestmentHistory[];
  investmentPrediction: InvestmentPrediction | null;
  lastInvestmentMessage: string | null;
  fetchLatestPrediction: () => Promise<void>;
  processMonthlyInvestment: () => Promise<void>;
}

const CreditCardContext = createContext<CreditCardContextType | undefined>(undefined);

const generateRandomCardNumber = (): string => {
  return '5412' + Array(12).fill(0).map(() => Math.floor(Math.random() * 10)).join('');
};

const generateExpiryDate = (): string => {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = String((today.getFullYear() + 3) % 100).padStart(2, '0');
  return `${month}/${year}`;
};

const generateInvestmentData = (): InvestmentReturn[] => {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const data: InvestmentReturn[] = [];
  
  let initialValue = 10000;
  const monthlyRate = 0.062; // 6.2% monthly return
  
  // Create data for 12 months
  for (let i = 0; i < 12; i++) {
    const expectedValue = initialValue * Math.pow(1 + monthlyRate, i + 1);
    
    // Add some realistic variance to actual returns (between -1% and +1% from expected)
    const variance = (Math.random() * 0.02) - 0.01;
    const actualValue = expectedValue * (1 + variance);
    
    data.push({
      month: months[i % 12],
      value: Math.round(actualValue * 100) / 100,
      expectedReturn: Math.round(expectedValue * 100) / 100,
    });
  }
  
  return data;
};

const generateTransactionData = (): CreditCardTransaction[] => {
  const transactions: CreditCardTransaction[] = [
    {
      id: '1',
      description: 'Amazon Prime',
      date: '01/05/2025',
      amount: 1199.90,
      installments: '1/12',
      installmentAmount: 99.99
    },
    {
      id: '2',
      description: 'Magazine Luiza',
      date: '28/04/2025',
      amount: 3599.88,
      installments: '1/12',
      installmentAmount: 299.99
    },
    {
      id: '3',
      description: 'Uber',
      date: '25/04/2025',
      amount: 479.88,
      installments: '1/12',
      installmentAmount: 39.99
    },
    {
      id: '4',
      description: 'iFood',
      date: '23/04/2025',
      amount: 839.88,
      installments: '1/12',
      installmentAmount: 69.99
    }
  ];
  
  return transactions;
};

const generateInvestmentHistory = (): InvestmentHistory[] => {
  const history: InvestmentHistory[] = [];
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const currentMonth = new Date().getMonth();
  
  // Generate past 6 months of history
  let investmentAmount = 10000;
  
  for (let i = 0; i < 6; i++) {
    const monthIndex = (currentMonth - 5 + i + 12) % 12; // Get month indices for past 6 months
    const returnRate = 0.062 + (Math.random() * 0.02 - 0.01); // Base 6.2% +/- 1%
    const returnAmount = investmentAmount * returnRate;
    
    // Randomly determine if there was an invoice that month
    const hadInvoice = Math.random() > 0.3; // 70% chance of having an invoice
    const invoiceAmount = hadInvoice ? Math.round(Math.random() * 800 + 200) : 0;
    
    const appliedToInvoice = hadInvoice 
      ? Math.min(returnAmount, invoiceAmount)
      : 0;
    
    const addedToLimit = returnAmount - appliedToInvoice;
    
    // New investment amount after returns
    investmentAmount += addedToLimit;
    
    // Date of first day of that month
    const date = new Date();
    date.setMonth(monthIndex);
    date.setDate(1);
    
    history.push({
      date: `01/${String(monthIndex + 1).padStart(2, '0')}/${date.getFullYear()}`,
      startAmount: investmentAmount - addedToLimit,
      endAmount: investmentAmount,
      returnRate,
      returnAmount,
      appliedToInvoice,
      addedToLimit,
    });
  }
  
  return history.reverse(); // Most recent first
};

export const CreditCardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [creditCardInfo, setCreditCardInfo] = useState<CreditCardInfo>({
    cardNumber: generateRandomCardNumber(),
    expiryDate: generateExpiryDate(),
    cvv: '123',
    currentInvoice: 509.96
  });
  
  // Updated to match requirements of R$ 20,000 total limit
  const [availableLimit, setAvailableLimit] = useState(10000); // R$ 10,000 for spending
  const [investmentLimit, setInvestmentLimit] = useState(10000); // R$ 10,000 for AI investments
  const [showCardDetails, setShowCardDetails] = useState(false);
  const [creditCardTransactions, setCreditCardTransactions] = useState<CreditCardTransaction[]>(
    generateTransactionData()
  );
  const [investmentReturns, setInvestmentReturns] = useState<InvestmentReturn[]>(
    generateInvestmentData()
  );
  const [investmentHistory, setInvestmentHistory] = useState<InvestmentHistory[]>(
    generateInvestmentHistory()
  );
  const [investmentPrediction, setInvestmentPrediction] = useState<InvestmentPrediction | null>(null);
  const [lastInvestmentMessage, setLastInvestmentMessage] = useState<string | null>(
    "Último rendimento: +R$ 620,00 (6.2%) aplicado para redução da fatura."
  );
  
  const toggleCardDetails = () => {
    setShowCardDetails(prev => !prev);
  };
  
  const fetchLatestPrediction = async (): Promise<void> => {
    try {
      const prediction = await fetchInvestmentPrediction();
      
      setInvestmentPrediction({
        monthlyRate: prediction.monthlyReturn,
        recommendation: prediction.recommendation,
        marketTrend: prediction.marketTrend,
        lastUpdated: new Date().toISOString()
      });
      
      toast({
        title: "Previsão atualizada",
        description: `Taxa prevista de ${(prediction.monthlyReturn * 100).toFixed(2)}% ao mês`
      });
      
    } catch (error) {
      console.error('Error fetching latest prediction:', error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar previsão",
        description: "Não foi possível obter a previsão de investimento mais recente."
      });
      throw error;
    }
  };
  
  const processMonthlyInvestment = async () => {
    try {
      // Fetch the latest prediction directly from the service, not from the function
      const prediction = await fetchInvestmentPrediction();
      
      // Apply the investment return to the invoice
      const result = applyInvestmentReturnToInvoice(
        investmentLimit,
        prediction.monthlyReturn,
        creditCardInfo.currentInvoice
      );
      
      // Update the state based on the calculation
      setCreditCardInfo(prev => ({
        ...prev,
        currentInvoice: result.newInvoiceAmount
      }));
      
      // Add extra credit if applicable
      if (result.extraCredit > 0) {
        setAvailableLimit(prev => prev + result.extraCredit);
      }
      
      // Create new history entry
      const newHistoryEntry: InvestmentHistory = {
        date: new Date().toISOString().split('T')[0].replace(/-/g, '/'),
        startAmount: investmentLimit,
        endAmount: investmentLimit,
        returnRate: prediction.monthlyReturn,
        returnAmount: investmentLimit * prediction.monthlyReturn,
        appliedToInvoice: result.appliedReturn,
        addedToLimit: result.extraCredit
      };
      
      // Update investment history
      setInvestmentHistory(prev => [newHistoryEntry, ...prev]);
      
      // Set the message to display on the dashboard
      setLastInvestmentMessage(result.message);
      
      toast({
        title: "Investimentos atualizados",
        description: result.message
      });
      
      // Also update the InvestmentPrediction state with the new prediction
      setInvestmentPrediction({
        monthlyRate: prediction.monthlyReturn,
        recommendation: prediction.recommendation,
        marketTrend: prediction.marketTrend,
        lastUpdated: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error processing monthly investment:', error);
      toast({
        variant: "destructive",
        title: "Erro no processamento",
        description: "Ocorreu um erro ao processar o investimento mensal."
      });
    }
  };
  
  // Initial fetch of prediction data when component mounts
  useEffect(() => {
    fetchLatestPrediction().catch(console.error);
    // This would normally include a scheduled task for the 1st of each month
    // Here we just do it once when the component mounts
  }, []);
  
  return (
    <CreditCardContext.Provider value={{
      creditCardInfo,
      availableLimit,
      investmentLimit,
      showCardDetails,
      toggleCardDetails,
      creditCardTransactions,
      investmentReturns,
      investmentHistory,
      investmentPrediction,
      lastInvestmentMessage,
      fetchLatestPrediction,
      processMonthlyInvestment,
    }}>
      {children}
    </CreditCardContext.Provider>
  );
};

export const useCreditCard = (): CreditCardContextType => {
  const context = useContext(CreditCardContext);
  if (context === undefined) {
    throw new Error('useCreditCard must be used within a CreditCardProvider');
  }
  return context;
};
