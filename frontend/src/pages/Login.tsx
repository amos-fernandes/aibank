
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{email?: string; password?: string}>({});
  
  const { login, isLoading } = useAuth();
  
  const validateForm = () => {
    const newErrors: {email?: string; password?: string} = {};
    
    if (!email) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email inválido';
    }
    
    if (!password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (password.length < 6) {
      newErrors.password = 'A senha deve ter pelo menos 6 caracteres';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      await login(email, password);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-gradient-to-r from-bank-teal to-bank-purple text-white p-6">
        <Link to="/" className="inline-block">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border-2 border-gray-300">
              <img src="/lovable-uploads/7a1d6d34-d74c-48e2-b662-b22ecf0a5a3d.png" alt="AIBANK Logo" className="w-8 h-8" />
            </div>
            <h1 className="ml-2 text-xl font-bold">AIBANK</h1>
          </div>
        </Link>
      </div>
      
      <div className="flex-1 flex flex-col justify-center px-6 py-12">
        <div className="max-w-md w-full mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900">Entrar na sua conta</h2>
            <p className="mt-2 text-gray-600">
              Entre com seu email e senha para acessar sua conta bancária
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
                className={`auth-input ${errors.email ? 'border-red-500' : ''}`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Senha
                </label>
                <Link to="/forgot-password" className="text-sm text-bank-purple hover:underline">
                  Esqueceu a senha?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="******"
                className={`auth-input ${errors.password ? 'border-red-500' : ''}`}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password}</p>
              )}
            </div>
            
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-bank-teal hover:bg-opacity-90 text-white font-medium py-3"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Ainda não tem uma conta?{' '}
              <Link to="/register" className="text-bank-purple hover:underline font-medium">
                Cadastre-se
              </Link>
            </p>
          </div>
          
          {/* Demo credentials */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 text-center">
              <strong>Credenciais para demonstração:</strong>
              <br />
              Email: demo@example.com
              <br />
              Senha: password
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
