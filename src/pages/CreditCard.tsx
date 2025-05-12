
import { useState, useEffect } from 'react';
import { CreditCard as CardIcon, TrendingUp, ShieldCheck, Calendar, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AppNav from '@/components/AppNav';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useBank } from '@/contexts/BankContext';
import { cn } from '@/lib/utils';
import { CreditCardProvider, useCreditCard } from '@/contexts/CreditCardContext';
import CreditCardDisplay from '@/components/CreditCardDisplay';
import InvestmentChart from '@/components/InvestmentChart';
import AIInvestmentBot from '@/components/AIInvestmentBot';
import InvestmentDashboard from '@/components/InvestmentDashboard';

// Wrapper component that includes the provider
const CreditCardPageWithProvider = () => (
  <CreditCardProvider>
    <CreditCardPage />
  </CreditCardProvider>
);

// Main page component
const CreditCardPage = () => {
  const { user } = useAuth();
  const { formatCurrency } = useBank();
  const { 
    creditCardInfo, 
    availableLimit, 
    investmentLimit, 
    creditCardTransactions, 
    showCardDetails, 
    toggleCardDetails,
    investmentReturns
  } = useCreditCard();
  const [currentTab, setCurrentTab] = useState<'details' | 'statement' | 'investments'>('details');

  return (
    <div className="min-h-screen bg-gray-50 pb-16 lg:pb-0 lg:pl-64">
      <AppNav />
      
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Cartão de Crédito
          </h1>
          <p className="text-gray-600">
            Seu Mastercard Black com investimento inteligente
          </p>
        </div>

        {/* Credit Card Display */}
        <div className="mb-6">
          <CreditCardDisplay />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setCurrentTab('details')}
            className={cn(
              "px-4 py-2 font-medium text-sm",
              currentTab === 'details' 
                ? "text-bank-teal border-b-2 border-bank-teal" 
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            Detalhes
          </button>
          <button
            onClick={() => setCurrentTab('statement')}
            className={cn(
              "px-4 py-2 font-medium text-sm",
              currentTab === 'statement' 
                ? "text-bank-teal border-b-2 border-bank-teal" 
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            Faturas
          </button>
          <button
            onClick={() => setCurrentTab('investments')}
            className={cn(
              "px-4 py-2 font-medium text-sm",
              currentTab === 'investments' 
                ? "text-bank-teal border-b-2 border-bank-teal" 
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            Investimentos IA
          </button>
        </div>

        {/* Content based on selected tab */}
        {currentTab === 'details' && (
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CardIcon size={20} className="mr-2 text-bank-teal" />
                  Limite disponível
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatCurrency(availableLimit)}</div>
                <div className="mt-4 h-2 bg-gray-200 rounded-full">
                  <div 
                    className="h-2 bg-bank-teal rounded-full" 
                    style={{ width: `${(availableLimit / 10000) * 100}%` }}
                  ></div>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  {formatCurrency(availableLimit)} de {formatCurrency(10000)} disponíveis
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp size={20} className="mr-2 text-bank-purple" />
                  Limite de investimento IA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatCurrency(investmentLimit)}</div>
                <div className="mt-2 text-sm text-gray-500">
                  Investido com retorno mínimo de 6.2% ao mês
                </div>
                <div className="mt-4 flex items-center text-green-600">
                  <ShieldCheck className="w-4 h-4 mr-1" />
                  Protegido por algoritmo de rede neural
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Informações do cartão</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Titular</span>
                  <span className="font-medium">{user?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tipo</span>
                  <span className="font-medium">Mastercard Black</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Parcelamento automático</span>
                  <span className="font-medium">12x fixas</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Vencimento</span>
                  <span className="font-medium">Dia 10</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentTab === 'statement' && (
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Fatura atual</CardTitle>
                <CardDescription>Vencimento em 10/05/2025</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-4">{formatCurrency(creditCardInfo.currentInvoice)}</div>

                {creditCardTransactions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Nenhuma transação recente
                  </div>
                ) : (
                  <div className="divide-y">
                    {creditCardTransactions.map((transaction, index) => (
                      <div key={index} className="py-3 flex justify-between items-center">
                        <div>
                          <div className="font-medium">{transaction.description}</div>
                          <div className="text-xs text-gray-500">
                            {transaction.date} • {transaction.installments}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(transaction.amount)}</div>
                          <div className="text-xs text-gray-500">
                            {formatCurrency(transaction.installmentAmount)}/mês
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {currentTab === 'investments' && (
          <div>
            <InvestmentDashboard />
            
            <div className="grid gap-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Retorno de investimentos</CardTitle>
                  <CardDescription>Algoritmo de IA prevê retorno mínimo de 6.2% ao mês</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <InvestmentChart data={investmentReturns} />
                  </div>
                  
                  <div className="mt-6 grid gap-4">
                    <div className="flex justify-between items-center">
                      <span>Investimento inicial</span>
                      <span className="font-medium">{formatCurrency(10000)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Retorno estimado (12 meses)</span>
                      <span className="font-medium text-green-600">{formatCurrency(10000 * Math.pow(1.062, 12) - 10000)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Total após 12 meses</span>
                      <span className="font-bold">{formatCurrency(10000 * Math.pow(1.062, 12))}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <AIInvestmentBot />
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreditCardPageWithProvider;
