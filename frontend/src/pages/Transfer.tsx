
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useBank } from '@/contexts/BankContext';
import AppNav from '@/components/AppNav';
import { toast } from '@/components/ui/use-toast';

const Transfer = () => {
  const { balance, sendPix, sendTransfer, isLoading } = useBank();
  const navigate = useNavigate();
  const [transferType, setTransferType] = useState<'pix' | 'transfer'>('pix');
  
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [description, setDescription] = useState('');
  
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
    } else {
      setAmount(decimal.toString());
    }
  };
  
  // Validate form
  const validateForm = () => {
    const errors = [];
    
    if (!amount || parseFloat(amount) <= 0) {
      errors.push('Insira um valor válido para transferência');
    }
    
    if (parseFloat(amount) > balance) {
      errors.push('Saldo insuficiente para esta operação');
    }
    
    if (!recipient) {
      errors.push(`Insira um ${transferType === 'pix' ? 'destinatário PIX' : 'banco e conta de destino'}`);
    }
    
    if (errors.length > 0) {
      errors.forEach(error => {
        toast({
          variant: "destructive",
          title: "Erro na transferência",
          description: error
        });
      });
      return false;
    }
    
    return true;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      if (transferType === 'pix') {
        await sendPix(parseFloat(amount), description || 'Transferência PIX', recipient);
      } else {
        await sendTransfer(parseFloat(amount), description || 'Transferência bancária', recipient);
      }
      
      // Reset form after successful transfer
      setAmount('');
      setRecipient('');
      setDescription('');
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
      
    } catch (error) {
      console.error('Transfer error:', error);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 pb-16 lg:pb-0 lg:pl-64">
      <AppNav />
      
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Transferências</h1>
          <p className="text-gray-600">
            Envie dinheiro por PIX ou transferência bancária
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          {/* Balance info */}
          <div className="mb-6">
            <p className="text-sm text-gray-500">Saldo disponível</p>
            <p className="text-xl font-semibold text-gray-900">{formatCurrency(balance)}</p>
          </div>
          
          <Tabs defaultValue="pix" className="w-full" onValueChange={(value) => setTransferType(value as 'pix' | 'transfer')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="pix">PIX</TabsTrigger>
              <TabsTrigger value="transfer">Transferência</TabsTrigger>
            </TabsList>
            
            <TabsContent value="pix">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quanto você quer transferir?
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">R$</span>
                    </div>
                    <Input
                      type="text"
                      value={amount ? parseFloat(amount).toFixed(2) : ''}
                      onChange={handleAmountChange}
                      className="pl-10 text-lg"
                      placeholder="0,00"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chave PIX
                  </label>
                  <Input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="CPF, email, telefone ou chave aleatória"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Insira a chave PIX do destinatário
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição (opcional)
                  </label>
                  <Input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: Pagamento do almoço"
                  />
                </div>
                
                <Button
                  type="submit"
                  className="w-full bg-bank-teal hover:bg-opacity-90"
                  disabled={isLoading}
                >
                  {isLoading ? 'Processando...' : 'Enviar PIX'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="transfer">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quanto você quer transferir?
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">R$</span>
                    </div>
                    <Input
                      type="text"
                      value={amount ? parseFloat(amount).toFixed(2) : ''}
                      onChange={handleAmountChange}
                      className="pl-10 text-lg"
                      placeholder="0,00"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dados bancários
                  </label>
                  <Input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="Banco, agência e conta"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Insira os dados bancários do destinatário
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição (opcional)
                  </label>
                  <Input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: Pagamento de serviços"
                  />
                </div>
                
                <Button
                  type="submit"
                  className="w-full bg-bank-teal hover:bg-opacity-90"
                  disabled={isLoading}
                >
                  {isLoading ? 'Processando...' : 'Realizar Transferência'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Transfer;
