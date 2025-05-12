
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, ArrowUpRight, Calendar, AlertCircle } from 'lucide-react';
import { useCreditCard } from '@/contexts/CreditCardContext';
import { useBank } from '@/contexts/BankContext';

interface InvestmentHistoryChartProps {
  data: Array<{
    date: string;
    amount: number;
    returns: number;
  }>;
  formatCurrency: (value: number) => string;
}

const InvestmentHistoryChart: React.FC<InvestmentHistoryChartProps> = ({ data, formatCurrency }) => {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
        />
        <YAxis
          tickFormatter={(value) => formatCurrency(value).split(' ')[1]}
          width={80}
        />
        <Tooltip
          formatter={(value: number) => formatCurrency(value)}
          labelFormatter={(label) => `Data: ${label}`}
        />
        <Line
          type="monotone"
          dataKey="amount"
          name="Investimento"
          stroke="#2A9D8F"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="returns"
          name="Retorno"
          stroke="#6E59A5"
          strokeWidth={2}
          strokeDasharray="5 5"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

const InvestmentDashboard: React.FC = () => {
  const { 
    investmentLimit, 
    investmentHistory, 
    investmentPrediction, 
    lastInvestmentMessage,
    processMonthlyInvestment,
    creditCardInfo 
  } = useCreditCard();
  const { formatCurrency } = useBank();
  
  // Transform investment history for the chart
  const chartData = investmentHistory.map(item => ({
    date: item.date.split('/')[1] + '/' + item.date.split('/')[2],
    amount: item.endAmount,
    returns: item.returnAmount
  }));
  
  // Calculate total returns from history
  const totalReturns = investmentHistory.reduce(
    (total, item) => total + item.returnAmount,
    0
  );
  
  // Calculate total applied to invoices
  const totalAppliedToInvoices = investmentHistory.reduce(
    (total, item) => total + item.appliedToInvoice,
    0
  );
  
  // Calculate total added to limit
  const totalAddedToLimit = investmentHistory.reduce(
    (total, item) => total + item.addedToLimit,
    0
  );
  
  return (
    <div className="grid gap-6">
      {lastInvestmentMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">
          <div className="flex items-start">
            <ArrowUpRight className="mt-1 mr-2 h-5 w-5 text-green-600" />
            <div>
              <h4 className="font-medium">Investimento Inteligente</h4>
              <p className="mt-1">{lastInvestmentMessage}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp size={20} className="mr-2 text-bank-teal" />
              Investimento Atual
            </CardTitle>
            <CardDescription>
              Gerenciado inteligentemente com IA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(investmentLimit)}</div>
            
            <div className="mt-4 grid grid-cols-1 gap-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Retorno Mensal Previsto:</span>
                <span className="font-medium text-green-600">
                  {investmentPrediction 
                    ? `${(investmentPrediction.monthlyRate * 100).toFixed(2)}%` 
                    : "6.2%"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Valor Esperado no Mês:</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(investmentLimit * (investmentPrediction?.monthlyRate || 0.062))}
                </span>
              </div>
            </div>
            
            <button 
              onClick={processMonthlyInvestment}
              className="mt-4 px-4 py-2 bg-bank-purple text-white rounded-md hover:bg-opacity-90 w-full"
            >
              Simular Rendimento Mensal
            </button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar size={20} className="mr-2 text-bank-purple" />
              Estatísticas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Total Investido:</span>
                <span className="font-medium">{formatCurrency(investmentLimit)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Retorno Total:</span>
                <span className="font-medium text-green-600">{formatCurrency(totalReturns)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Aplicado em Faturas:</span>
                <span className="font-medium">{formatCurrency(totalAppliedToInvoices)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Adicionado ao Limite:</span>
                <span className="font-medium text-green-600">{formatCurrency(totalAddedToLimit)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Investimentos</CardTitle>
          <CardDescription>Rendimento e aplicação dos últimos meses</CardDescription>
        </CardHeader>
        <CardContent>
          <InvestmentHistoryChart data={chartData} formatCurrency={formatCurrency} />
          
          <div className="mt-6 border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-2">Histórico Detalhado</h4>
            
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {investmentHistory.map((item, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">{item.date}</span>
                    <span className="text-green-600">
                      +{formatCurrency(item.returnAmount)} ({(item.returnRate * 100).toFixed(2)}%)
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    {item.appliedToInvoice > 0 ? (
                      <div>
                        {formatCurrency(item.appliedToInvoice)} aplicado na fatura
                        {item.addedToLimit > 0 && (
                          <span> e {formatCurrency(item.addedToLimit)} adicionado ao limite</span>
                        )}
                      </div>
                    ) : (
                      <div>
                        {formatCurrency(item.addedToLimit)} adicionado ao limite
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {investmentHistory.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Nenhum histórico de investimento disponível
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {investmentPrediction && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle size={20} className="mr-2 text-bank-coral" />
              Análise de Mercado pela IA
            </CardTitle>
            <CardDescription>
              Atualizado em {new Date(investmentPrediction.lastUpdated).toLocaleDateString('pt-BR')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-700">Tendência de Mercado</h4>
                <p className="text-gray-600">{investmentPrediction.marketTrend}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-700">Recomendação</h4>
                <p className="text-gray-600">{investmentPrediction.recommendation}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InvestmentDashboard;
