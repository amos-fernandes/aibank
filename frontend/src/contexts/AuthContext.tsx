
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

type User = {
  id: string;
  name: string;
  email: string;
  cpf: string;
  birthDate: string;
  hasCompletedOpenFinance: boolean;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: Omit<User, 'id' | 'hasCompletedOpenFinance'> & { password: string }) => Promise<void>;
  completeOpenFinance: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem('finverse_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock validation - in real app this would be a backend call
      if (email === 'demo@example.com' && password === 'password') {
        const mockUser: User = {
          id: '1',
          name: 'Usuário Demonstração',
          email: 'demo@example.com',
          cpf: '123.456.789-00',
          birthDate: '1990-01-01',
          hasCompletedOpenFinance: false
        };
        
        setUser(mockUser);
        localStorage.setItem('finverse_user', JSON.stringify(mockUser));
        
        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo de volta ao AIBANK.",
        });
        
        // Redirect based on OpenFinance completion
        if (!mockUser.hasCompletedOpenFinance) {
          navigate('/open-finance');
        } else {
          navigate('/dashboard');
        }
      } else {
        toast({
          variant: "destructive",
          title: "Erro ao fazer login",
          description: "Email ou senha incorretos. Tente novamente.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao fazer login",
        description: "Ocorreu um erro. Por favor, tente novamente.",
      });
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: Omit<User, 'id' | 'hasCompletedOpenFinance'> & { password: string }) => {
    try {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo, we'll create a mock user
      const newUser: User = {
        id: Date.now().toString(),
        ...userData,
        hasCompletedOpenFinance: false
      };
      
      delete (newUser as any).password;
      
      setUser(newUser);
      localStorage.setItem('finverse_user', JSON.stringify(newUser));
      
      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Vamos configurar sua integração com OpenFinance.",
      });
      
      navigate('/open-finance');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao cadastrar",
        description: "Ocorreu um erro ao criar sua conta. Por favor, tente novamente.",
      });
      console.error('Register error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const completeOpenFinance = () => {
    if (user) {
      const updatedUser = { ...user, hasCompletedOpenFinance: true };
      setUser(updatedUser);
      localStorage.setItem('finverse_user', JSON.stringify(updatedUser));
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('finverse_user');
    navigate('/');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        completeOpenFinance,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
