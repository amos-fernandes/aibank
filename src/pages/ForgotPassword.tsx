
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { ArrowLeft, CheckCircle } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      toast({
        variant: "destructive",
        title: "Email inválido",
        description: "Por favor, insira um email válido."
      });
      return;
    }
    
    // Simulate API call
    setLoading(true);
    
    setTimeout(() => {
      setIsSubmitted(true);
      setLoading(false);
    }, 1500);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-gradient-to-r from-bank-teal to-bank-purple text-white p-6">
        <Link to="/" className="inline-block">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-bank-teal font-bold text-xl">
              F
            </div>
            <h1 className="ml-2 text-xl font-bold">Finverse</h1>
          </div>
        </Link>
      </div>
      
      <div className="flex-1 flex flex-col justify-center px-6 py-12">
        <div className="max-w-md w-full mx-auto">
          {!isSubmitted ? (
            <>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-extrabold text-gray-900">Esqueceu sua senha?</h2>
                <p className="mt-2 text-gray-600">
                  Não se preocupe! Basta inserir seu email abaixo e enviaremos um link de redefinição de senha.
                </p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seuemail@exemplo.com"
                  />
                </div>
                
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-bank-teal hover:bg-opacity-90 text-white font-medium py-3"
                >
                  {loading ? 'Enviando...' : 'Enviar link de redefinição'}
                </Button>
                
                <div className="text-center">
                  <Link 
                    to="/login" 
                    className="text-bank-purple hover:underline inline-flex items-center"
                  >
                    <ArrowLeft size={16} className="mr-1" />
                    Voltar para o login
                  </Link>
                </div>
              </form>
            </>
          ) : (
            <div className="text-center animate-fade-in">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="text-green-600" size={32} />
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Email enviado com sucesso!
              </h2>
              
              <p className="text-gray-600 mb-6">
                Enviamos um link de redefinição de senha para <strong>{email}</strong>. Por favor, verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
              </p>
              
              <p className="text-gray-500 text-sm mb-6">
                Não recebeu o email? Verifique sua pasta de spam ou tente novamente em alguns minutos.
              </p>
              
              <div className="space-y-4">
                <Button 
                  onClick={() => setIsSubmitted(false)} 
                  variant="outline" 
                  className="w-full"
                >
                  Tentar novamente
                </Button>
                
                <Link to="/login">
                  <Button variant="secondary" className="w-full">
                    Voltar para o login
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
