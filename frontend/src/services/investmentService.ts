
import { toast } from '@/components/ui/use-toast';

interface InvestmentPrediction {
  monthlyReturn: number;
  recommendation: string;
  marketTrend: string;
}

export const fetchInvestmentPrediction = async (): Promise<InvestmentPrediction> => {
  try {
    // In a real implementation, this would call the Hugging Face API
    // URL: https://huggingface.co/spaces/amos-fernadnes/token
    
    // For demo purposes, we'll simulate the API call with a delay and mock response
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock response based on real-world typical market returns
    // A real implementation would parse the actual API response
    return {
      monthlyReturn: 0.062 + (Math.random() * 0.02 - 0.01), // 6.2% +/- 1%
      recommendation: "Manter investimento em renda variável com foco em tecnologia e consumo.",
      marketTrend: "Positivo com tendência de alta nos próximos 30 dias."
    };
  } catch (error) {
    console.error('Error fetching investment prediction:', error);
    
    // Fallback with conservative estimate if API is offline
    toast({
      variant: "destructive",
      title: "Falha na conexão com o serviço de IA",
      description: "Usando projeção conservadora como alternativa."
    });
    
    return {
      monthlyReturn: 0.062, // Fallback to minimum 6.2%
      recommendation: "Manter posição atual até restabelecimento da conexão com IA.",
      marketTrend: "Indeterminado - usando valor conservador."
    };
  }
};

export const calculateMonthlyInvestmentReturn = (
  investmentAmount: number, 
  monthlyRate: number
): number => {
  return investmentAmount * monthlyRate;
};

export const applyInvestmentReturnToInvoice = (
  investmentAmount: number,
  monthlyRate: number,
  currentInvoice: number
): { 
  newInvoiceAmount: number;
  appliedReturn: number;
  extraCredit: number;
  message: string;
} => {
  const monthlyReturn = calculateMonthlyInvestmentReturn(investmentAmount, monthlyRate);
  
  // No invoice this month
  if (currentInvoice <= 0) {
    return {
      newInvoiceAmount: 0,
      appliedReturn: 0,
      extraCredit: monthlyReturn,
      message: `Parabéns! Você não utilizou seu cartão este mês. O lucro de R$ ${monthlyReturn.toFixed(2)} foi convertido em R$ ${monthlyReturn.toFixed(2)} adicionais no seu limite de crédito!`
    };
  }
  
  // Invoice exists, apply return to it
  const newInvoiceAmount = currentInvoice > monthlyReturn 
    ? currentInvoice - monthlyReturn
    : 0;
  
  const appliedReturn = currentInvoice > monthlyReturn 
    ? monthlyReturn
    : currentInvoice;
  
  const extraCredit = currentInvoice > monthlyReturn
    ? 0
    : monthlyReturn - currentInvoice;
  
  const message = `Rendimento de R$ ${monthlyReturn.toFixed(2)} foi aplicado automaticamente na fatura do mês (R$ ${currentInvoice.toFixed(2)}). Novo valor a pagar: R$ ${newInvoiceAmount.toFixed(2)}.`;
  
  return {
    newInvoiceAmount,
    appliedReturn,
    extraCredit,
    message
  };
};
