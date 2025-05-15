
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppNav from '@/components/AppNav';
import { toast } from '@/components/ui/use-toast';
import { Shield, UserIcon, Bell, Lock } from 'lucide-react';

const Settings = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  
  const formatCpf = (cpf: string) => {
    // If the CPF is already formatted, return it
    if (/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(cpf)) {
      return cpf;
    }
    
    // If the CPF is not formatted, format it
    const digits = cpf.replace(/\D/g, '');
    if (digits.length !== 11) return cpf; // Invalid CPF length
    
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };
  
  const handleSaveProfile = () => {
    toast({
      title: "Perfil atualizado",
      description: "Suas informações foram atualizadas com sucesso."
    });
  };
  
  const handleChangePassword = () => {
    toast({
      title: "Senha atualizada",
      description: "Sua senha foi atualizada com sucesso."
    });
  };
  
  const handleSaveNotifications = () => {
    toast({
      title: "Preferências atualizadas",
      description: "Suas preferências de notificação foram salvas."
    });
  };
  
  const handleSavePrivacy = () => {
    toast({
      title: "Configurações de privacidade atualizadas",
      description: "Suas configurações de privacidade foram salvas."
    });
  };
  
  return (
    <div className="min-h-screen bg-gray-50 pb-16 lg:pb-0 lg:pl-64">
      <AppNav />
      
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Configurações</h1>
          <p className="text-gray-600">
            Gerencie seu perfil e preferências da conta
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center space-x-3 p-2 mb-4">
                <div className="w-12 h-12 rounded-full bg-bank-teal flex items-center justify-center text-white text-xl font-bold">
                  {user?.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
              </div>
              
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex items-center w-full px-3 py-2 text-left rounded-lg transition-colors ${
                    activeTab === 'profile' 
                      ? 'bg-bank-teal text-white'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <UserIcon size={18} className="mr-2" />
                  <span>Perfil</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('security')}
                  className={`flex items-center w-full px-3 py-2 text-left rounded-lg transition-colors ${
                    activeTab === 'security' 
                      ? 'bg-bank-teal text-white'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <Lock size={18} className="mr-2" />
                  <span>Segurança</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`flex items-center w-full px-3 py-2 text-left rounded-lg transition-colors ${
                    activeTab === 'notifications' 
                      ? 'bg-bank-teal text-white'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <Bell size={18} className="mr-2" />
                  <span>Notificações</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('privacy')}
                  className={`flex items-center w-full px-3 py-2 text-left rounded-lg transition-colors ${
                    activeTab === 'privacy' 
                      ? 'bg-bank-teal text-white'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <Shield size={18} className="mr-2" />
                  <span>Privacidade</span>
                </button>
              </nav>
              
              <div className="mt-6 pt-4 border-t">
                <Button 
                  variant="outline" 
                  className="w-full text-red-500 border-red-500 hover:bg-red-50"
                  onClick={logout}
                >
                  Sair da conta
                </Button>
              </div>
            </div>
          </div>
          
          {/* Main content */}
          <div className="col-span-1 lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm p-6">
              {/* Profile */}
              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-xl font-medium mb-6">Informações pessoais</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome completo
                      </label>
                      <Input
                        defaultValue={user?.name}
                        placeholder="Seu nome completo"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <Input
                        defaultValue={user?.email}
                        placeholder="seuemail@exemplo.com"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CPF
                      </label>
                      <Input
                        defaultValue={user?.cpf && formatCpf(user.cpf)}
                        disabled
                        className="bg-gray-100"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        O CPF não pode ser alterado.
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data de nascimento
                      </label>
                      <Input
                        defaultValue={user?.birthDate}
                        type="date"
                      />
                    </div>
                    
                    <div className="pt-4">
                      <Button onClick={handleSaveProfile} className="bg-bank-teal hover:bg-opacity-90">
                        Salvar alterações
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Security */}
              {activeTab === 'security' && (
                <div>
                  <h2 className="text-xl font-medium mb-6">Segurança da conta</h2>
                  
                  <div className="mb-8">
                    <h3 className="text-lg font-medium mb-4">Alterar senha</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Senha atual
                        </label>
                        <Input
                          type="password"
                          placeholder="••••••••"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nova senha
                        </label>
                        <Input
                          type="password"
                          placeholder="••••••••"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Confirmar nova senha
                        </label>
                        <Input
                          type="password"
                          placeholder="••••••••"
                        />
                      </div>
                      
                      <div className="pt-2">
                        <Button onClick={handleChangePassword} className="bg-bank-teal hover:bg-opacity-90">
                          Alterar senha
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Verificação em duas etapas</h3>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="font-medium">Autenticação por SMS</p>
                        <p className="text-sm text-gray-500">
                          Receba um código por SMS para maior segurança
                        </p>
                      </div>
                      <div>
                        <div className="w-12 h-6 bg-gray-200 rounded-full p-1 flex items-center">
                          <div className="w-4 h-4 bg-white rounded-full transform translate-x-0"></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Autenticação por aplicativo</p>
                        <p className="text-sm text-gray-500">
                          Use um aplicativo autenticador como Google Authenticator
                        </p>
                      </div>
                      <div>
                        <div className="w-12 h-6 bg-gray-200 rounded-full p-1 flex items-center">
                          <div className="w-4 h-4 bg-white rounded-full transform translate-x-0"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Notifications */}
              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-xl font-medium mb-6">Preferências de notificação</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium">Notificações por email</p>
                        <p className="text-sm text-gray-500">
                          Receba emails sobre suas transações e atualizações de conta
                        </p>
                      </div>
                      <div>
                        <div className="w-12 h-6 bg-bank-teal rounded-full p-1 flex items-center">
                          <div className="w-4 h-4 bg-white rounded-full transform translate-x-6"></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium">Notificações push</p>
                        <p className="text-sm text-gray-500">
                          Receba notificações em tempo real no seu dispositivo
                        </p>
                      </div>
                      <div>
                        <div className="w-12 h-6 bg-bank-teal rounded-full p-1 flex items-center">
                          <div className="w-4 h-4 bg-white rounded-full transform translate-x-6"></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium">Alertas de segurança</p>
                        <p className="text-sm text-gray-500">
                          Receba alertas sobre atividades suspeitas em sua conta
                        </p>
                      </div>
                      <div>
                        <div className="w-12 h-6 bg-bank-teal rounded-full p-1 flex items-center">
                          <div className="w-4 h-4 bg-white rounded-full transform translate-x-6"></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium">Comunicações de marketing</p>
                        <p className="text-sm text-gray-500">
                          Receba informações sobre promoções e novidades
                        </p>
                      </div>
                      <div>
                        <div className="w-12 h-6 bg-gray-200 rounded-full p-1 flex items-center">
                          <div className="w-4 h-4 bg-white rounded-full transform translate-x-0"></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-4">
                      <Button onClick={handleSaveNotifications} className="bg-bank-teal hover:bg-opacity-90">
                        Salvar preferências
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Privacy */}
              {activeTab === 'privacy' && (
                <div>
                  <h2 className="text-xl font-medium mb-6">Privacidade e OpenFinance</h2>
                  
                  <div className="space-y-4 mb-8">
                    <h3 className="text-lg font-medium">Compartilhamento de dados OpenFinance</h3>
                    <p className="text-gray-600 mb-4">
                      Gerencie como seus dados são compartilhados através do OpenFinance.
                    </p>
                    
                    <div className="p-4 bg-gray-50 rounded-lg mb-4">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="font-medium">CAIXA</p>
                          <p className="text-sm text-gray-500">Autorização concedida em 01/05/2023</p>
                        </div>
                        <Button variant="outline" size="sm">
                          Revogar acesso
                        </Button>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>Dados compartilhados:</p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>Informações cadastrais</li>
                          <li>Dados de conta</li>
                          <li>Histórico de transações</li>
                          <li>Produtos e serviços contratados</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Configurações de privacidade</h3>
                    
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium">Compartilhar dados de uso</p>
                        <p className="text-sm text-gray-500">
                          Permite que melhoremos nossos serviços com base no seu uso
                        </p>
                      </div>
                      <div>
                        <div className="w-12 h-6 bg-bank-teal rounded-full p-1 flex items-center">
                          <div className="w-4 h-4 bg-white rounded-full transform translate-x-6"></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium">Personalização de ofertas</p>
                        <p className="text-sm text-gray-500">
                          Receba ofertas personalizadas com base no seu perfil financeiro
                        </p>
                      </div>
                      <div>
                        <div className="w-12 h-6 bg-gray-200 rounded-full p-1 flex items-center">
                          <div className="w-4 h-4 bg-white rounded-full transform translate-x-0"></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-4">
                      <Button onClick={handleSavePrivacy} className="bg-bank-teal hover:bg-opacity-90">
                        Salvar configurações
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
