
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ChevronRight, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

// Bank logos (mock)
const bankLogos = {
  caixa: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Caixa_Economica_Federal_logo.svg/1200px-Caixa_Economica_Federal_logo.svg.png",
  bb: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Banco_do_Brasil_logo_%282021%29.svg/1200px-Banco_do_Brasil_logo_%282021%29.svg.png",
  itau: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Banco_Ita%C3%BA_logo.svg/1200px-Banco_Ita%C3%BA_logo.svg.png"
};

const OpenFinance = () => {
  const { completeOpenFinance } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  
  const handleBankSelect = (bank: string) => {
    setSelectedBank(bank);
    setStep(2);
  };
  
  const handleAuthorize = async () => {
    setLoading(true);
    
    // Simulate authorization process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setLoading(false);
    setAuthorized(true);
    setStep(3);
  };
  
  const handleComplete = () => {
    completeOpenFinance();
    navigate('/dashboard');
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm p-4">
        <div className="container mx-auto flex items-center">
          <div className="w-8 h-8 rounded-full bg-bank-teal flex items-center justify-center text-white font-bold">
            F
          </div>
          <h1 className="ml-2 text-lg font-bold">Finverse</h1>
        </div>
      </div>
      
      <div className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        {/* Progress steps */}
        <div className="mb-10">
          <div className="flex justify-between items-center">
            <div className={`flex flex-col items-center ${step >= 1 ? 'text-bank-teal' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-bank-teal text-white' : 'bg-gray-200 text-gray-500'}`}>
                {step > 1 ? <CheckCircle size={16} /> : 1}
              </div>
              <span className="text-sm mt-1">Selecionar banco</span>
            </div>
            
            <div className={`flex-1 h-1 mx-2 ${step >= 2 ? 'bg-bank-teal' : 'bg-gray-300'}`}></div>
            
            <div className={`flex flex-col items-center ${step >= 2 ? 'text-bank-teal' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-bank-teal text-white' : 'bg-gray-200 text-gray-500'}`}>
                {step > 2 ? <CheckCircle size={16} /> : 2}
              </div>
              <span className="text-sm mt-1">Autorizar</span>
            </div>
            
            <div className={`flex-1 h-1 mx-2 ${step >= 3 ? 'bg-bank-teal' : 'bg-gray-300'}`}></div>
            
            <div className={`flex flex-col items-center ${step >= 3 ? 'text-bank-teal' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-bank-teal text-white' : 'bg-gray-200 text-gray-500'}`}>
                {step > 3 ? <CheckCircle size={16} /> : 3}
              </div>
              <span className="text-sm mt-1">Concluir</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          {step === 1 && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold mb-6">Conecte sua conta bancária</h2>
              <p className="text-gray-600 mb-8">
                Escolha um banco para conectar através do OpenFinance. Isso nos permite acessar seus dados financeiros de forma segura e eficiente.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Caixa */}
                <button
                  onClick={() => handleBankSelect('caixa')}
                  className="border border-gray-200 rounded-lg p-4 hover:border-bank-teal hover:shadow-md transition-all flex flex-col items-center"
                >
                  <div className="h-16 flex items-center justify-center mb-4">
                    <img src={bankLogos.caixa} alt="Caixa" className="max-h-10" />
                  </div>
                  <span className="text-gray-800 font-medium">CAIXA</span>
                </button>
                
                {/* Banco do Brasil */}
                <button
                  onClick={() => handleBankSelect('bb')}
                  className="border border-gray-200 rounded-lg p-4 hover:border-bank-teal hover:shadow-md transition-all flex flex-col items-center"
                >
                  <div className="h-16 flex items-center justify-center mb-4">
                    <img src={bankLogos.bb} alt="Banco do Brasil" className="max-h-10" />
                  </div>
                  <span className="text-gray-800 font-medium">Banco do Brasil</span>
                </button>
                
                {/* Itaú */}
                <button
                  onClick={() => handleBankSelect('itau')}
                  className="border border-gray-200 rounded-lg p-4 hover:border-bank-teal hover:shadow-md transition-all flex flex-col items-center"
                >
                  <div className="h-16 flex items-center justify-center mb-4">
                    <img src={bankLogos.itau} alt="Itaú" className="max-h-10" />
                  </div>
                  <span className="text-gray-800 font-medium">Itaú</span>
                </button>
              </div>
            </div>
          )}
          
          {step === 2 && (
            <div className="animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Autorizar compartilhamento</h2>
                <button onClick={() => setStep(1)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex items-center mb-8">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center border border-gray-200">
                  <img 
                    src={selectedBank ? bankLogos[selectedBank as keyof typeof bankLogos] : ''} 
                    alt="Selected Bank" 
                    className="max-h-8 max-w-8" 
                  />
                </div>
                <div className="mx-4 text-gray-400">
                  <ChevronRight size={20} />
                </div>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center border border-gray-200 bg-bank-teal text-white">
                  <span className="font-bold">F</span>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-8">
                <h3 className="font-medium text-gray-900 mb-3">Dados a serem compartilhados:</h3>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <CheckCircle size={16} className="text-bank-teal mr-2" />
                    <span className="text-gray-600">Informações cadastrais</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle size={16} className="text-bank-teal mr-2" />
                    <span className="text-gray-600">Saldo em conta</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle size={16} className="text-bank-teal mr-2" />
                    <span className="text-gray-600">Histórico de transações</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle size={16} className="text-bank-teal mr-2" />
                    <span className="text-gray-600">Lista de produtos e serviços</span>
                  </li>
                </ul>
              </div>
              
              <p className="text-gray-500 text-sm mb-8">
                Ao autorizar, você permite que a Finverse acesse esses dados por 12 meses. Você pode revogar esta autorização a qualquer momento através do seu banco ou da Finverse.
              </p>
              
              <Button
                onClick={handleAuthorize}
                disabled={loading}
                className="w-full bg-bank-teal hover:bg-opacity-90"
              >
                {loading ? 'Processando...' : 'Autorizar compartilhamento'}
              </Button>
            </div>
          )}
          
          {step === 3 && (
            <div className="animate-fade-in text-center py-6">
              <div className="w-20 h-20 rounded-full bg-green-100 text-green-500 flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={40} />
              </div>
              
              <h2 className="text-2xl font-bold mb-3">Autorização concluída!</h2>
              
              <p className="text-gray-600 mb-8">
                Seus dados bancários foram conectados com sucesso. Agora você pode acessar todos os recursos da Finverse.
              </p>
              
              <Button
                onClick={handleComplete}
                className="bg-bank-teal hover:bg-opacity-90"
              >
                Acessar minha conta
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OpenFinance;
