
import { useState, useEffect } from 'react';
import { Coins, ArrowRight, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBank } from '@/contexts/BankContext';
import AppNav from '@/components/AppNav';
import { toast } from '@/components/ui/use-toast';

// Mock crypto data
const cryptoOptions = [
  { value: 'bitcoin', label: 'Bitcoin (BTC)', price: 254689.32, change: 2.4 },
  { value: 'ethereum', label: 'Ethereum (ETH)', price: 17532.91, change: -0.8 },
  { value: 'solana', label: 'Solana (SOL)', price: 423.58, change: 5.2 },
  { value: 'cardano', label: 'Cardano (ADA)', price: 2.85, change: 1.3 },
  { value: 'ripple', label: 'Ripple (XRP)', price: 3.42, change: -2.1 }
];

const Crypto = () => {
  const { balance, buyCrypto, isLoading } = useBank();
  const [amount, setAmount] = useState('');
  const [selectedCrypto, setSelectedCrypto] = useState(cryptoOptions[0].value);
  const [cryptoAmount, setCryptoAmount] = useState<number | null>(null);
  
  // Format currency to display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  // Handle amount input with currency formatting
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove non-numeric characters
    const value = e.target.value.replace(/\D/g, '');
    
    // Convert to decimal (divide by 100 to handle centavos)
    const decimal = parseInt(value) / 100;
    
    if (isNaN(decimal)) {
      setAmount('');
      setCryptoAmount(null);
    } else {
      setAmount(decimal.toString());
      updateCryptoAmount(decimal, selectedCrypto);
    }
  };
  
  // Update crypto amount based on BRL amount
  const updateCryptoAmount = (brlAmount: number, cryptoValue: string) => {
    const selectedOption = cryptoOptions.find(option => option.value === cryptoValue);
    if (selectedOption) {
      const amount = brlAmount / selectedOption.price;
      setCryptoAmount(amount);
    }
  };
  
  // Handle crypto selection
  const handleCryptoChange = (value: string) => {
    setSelectedCrypto(value);
    if (amount) {
      updateCryptoAmount(parseFloat(amount), value);
    }
  };
  
  // Calculate amount whenever inputs change
  useEffect(() => {
    if (amount) {
      updateCryptoAmount(parseFloat(amount), selectedCrypto);
    }
  }, [amount, selectedCrypto]);
  
  // Handle buy
  const handleBuy = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        variant: "destructive",
        title: "Erro na compra",
        description: "Insira um valor válido para compra"
      });
      return;
    }
    
    if (parseFloat(amount) > balance) {
      toast({
        variant: "destructive",
        title: "Saldo insuficiente",
        description: "Você não tem saldo suficiente para esta compra"
      });
      return;
    }
    
    const cryptoName = cryptoOptions.find(c => c.value === selectedCrypto)?.label || selectedCrypto;
    await buyCrypto(parseFloat(amount), cryptoName);
    
    // Clear form after successful purchase
    setAmount('');
    setCryptoAmount(null);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 pb-16 lg:pb-0 lg:pl-64">
      <AppNav />
      
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Comprar Criptomoedas</h1>
          <p className="text-gray-600">
            Invista em criptomoedas com segurança e facilidade
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left column - Crypto market */}
          <div className="col-span-1 md:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-lg font-medium mb-4 flex items-center">
                <Coins size={20} className="mr-2 text-bank-purple" />
                Mercado Cripto
              </h2>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-500 border-b">
                      <th className="pb-2">Criptomoeda</th>
                      <th className="pb-2">Preço</th>
                      <th className="pb-2">24h</th>
                      <th className="pb-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cryptoOptions.map((crypto) => (
                      <tr key={crypto.value} className="border-b last:border-b-0">
                        <td className="py-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                              {crypto.value.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium">{crypto.label}</span>
                          </div>
                        </td>
                        <td className="py-4">
                          {formatCurrency(crypto.price)}
                        </td>
                        <td className="py-4">
                          <span className={`flex items-center ${
                            crypto.change >= 0 ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {crypto.change >= 0 ? '+' : ''}{crypto.change}%
                            <TrendingUp size={16} className="ml-1" />
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => {
                              setSelectedCrypto(crypto.value);
                              if (amount) {
                                updateCryptoAmount(parseFloat(amount), crypto.value);
                              }
                            }}
                          >
                            Comprar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Crypto trends */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-medium mb-4">Tendências do mercado</h2>
              <div className="text-sm text-gray-600">
                <p className="mb-3">
                  O mercado de criptomoedas está em constante evolução. Acompanhe as tendências de preços e 
                  diversifique seu portfólio de acordo com sua estratégia de investimentos.
                </p>
                <p>
                  Nossa plataforma oferece análises avançadas e monitoramento em tempo real para ajudar você 
                  a tomar as melhores decisões de investimento.
                </p>
              </div>
            </div>
          </div>
          
          {/* Right column - Buy crypto */}
          <div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-medium mb-4">Compra rápida</h2>
              
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-1">Saldo disponível</p>
                <p className="text-xl font-semibold text-gray-900">{formatCurrency(balance)}</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Selecione a criptomoeda
                  </label>
                  <Select value={selectedCrypto} onValueChange={handleCryptoChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione uma criptomoeda" />
                    </SelectTrigger>
                    <SelectContent>
                      {cryptoOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label} - {formatCurrency(option.price)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quanto você quer investir?
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">R$</span>
                    </div>
                    <Input
                      type="text"
                      value={amount ? parseFloat(amount).toFixed(2) : ''}
                      onChange={handleAmountChange}
                      className="pl-10"
                      placeholder="0,00"
                    />
                  </div>
                </div>
                
                {amount && cryptoAmount && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Você receberá aproximadamente</span>
                      <ArrowRight size={16} className="text-gray-400" />
                    </div>
                    <div className="font-medium text-lg mt-1">
                      {cryptoAmount.toFixed(8)}{' '}
                      {selectedCrypto.toUpperCase()}
                    </div>
                  </div>
                )}
                
                <Button
                  onClick={handleBuy}
                  disabled={isLoading || !amount || parseFloat(amount) <= 0}
                  className="w-full bg-bank-teal hover:bg-opacity-90"
                >
                  {isLoading ? 'Processando...' : 'Comprar agora'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Crypto;
