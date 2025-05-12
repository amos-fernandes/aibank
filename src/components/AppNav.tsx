
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Home, Send, PiggyBank, Settings, CreditCard } from 'lucide-react';

const AppNav: React.FC = () => {
  const { logout } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white shadow-[0_-4px_10px_rgba(0,0,0,0.1)]">
        <div className="flex justify-around items-center h-16">
          <Link
            to="/dashboard"
            className={`flex flex-col items-center justify-center w-full h-full ${
              isActive('/dashboard') ? 'text-bank-teal' : 'text-gray-500'
            }`}
          >
            <Home size={20} />
            <span className="text-xs mt-1">Início</span>
          </Link>
          <Link
            to="/transfer"
            className={`flex flex-col items-center justify-center w-full h-full ${
              isActive('/transfer') ? 'text-bank-teal' : 'text-gray-500'
            }`}
          >
            <Send size={20} />
            <span className="text-xs mt-1">Enviar</span>
          </Link>
          <Link
            to="/credit-card"
            className={`flex flex-col items-center justify-center w-full h-full ${
              isActive('/credit-card') ? 'text-bank-teal' : 'text-gray-500'
            }`}
          >
            <CreditCard size={20} />
            <span className="text-xs mt-1">Cartão</span>
          </Link>
          <Link
            to="/crypto"
            className={`flex flex-col items-center justify-center w-full h-full ${
              isActive('/crypto') ? 'text-bank-teal' : 'text-gray-500'
            }`}
          >
            <PiggyBank size={20} />
            <span className="text-xs mt-1">Cripto</span>
          </Link>
          <Link
            to="/settings"
            className={`flex flex-col items-center justify-center w-full h-full ${
              isActive('/settings') ? 'text-bank-teal' : 'text-gray-500'
            }`}
          >
            <Settings size={20} />
            <span className="text-xs mt-1">Perfil</span>
          </Link>
        </div>
      </nav>
      
      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 h-full w-64 bg-white shadow-lg z-40">
        <div className="p-5">
          <div className="mb-8 flex items-center">
            <div className="w-10 h-10 rounded-full flex items-center justify-center">
              <img src="/lovable-uploads/7a1d6d34-d74c-48e2-b662-b22ecf0a5a3d.png" alt="AIBANK Logo" className="w-8 h-8" />
            </div>
            <h1 className="ml-3 text-xl font-bold">AIBANK</h1>
          </div>
          
          <ul className="space-y-2">
            <li>
              <Link
                to="/dashboard"
                className={`flex items-center px-4 py-3 rounded-lg transition-all ${
                  isActive('/dashboard')
                    ? 'bg-bank-teal text-white'
                    : 'hover:bg-gray-100'
                }`}
              >
                <Home size={20} className="mr-3" />
                <span>Dashboard</span>
              </Link>
            </li>
            <li>
              <Link
                to="/transfer"
                className={`flex items-center px-4 py-3 rounded-lg transition-all ${
                  isActive('/transfer')
                    ? 'bg-bank-teal text-white'
                    : 'hover:bg-gray-100'
                }`}
              >
                <Send size={20} className="mr-3" />
                <span>Transferências</span>
              </Link>
            </li>
            <li>
              <Link
                to="/credit-card"
                className={`flex items-center px-4 py-3 rounded-lg transition-all ${
                  isActive('/credit-card')
                    ? 'bg-bank-teal text-white'
                    : 'hover:bg-gray-100'
                }`}
              >
                <CreditCard size={20} className="mr-3" />
                <span>Cartão de Crédito</span>
              </Link>
            </li>
            <li>
              <Link
                to="/crypto"
                className={`flex items-center px-4 py-3 rounded-lg transition-all ${
                  isActive('/crypto')
                    ? 'bg-bank-teal text-white'
                    : 'hover:bg-gray-100'
                }`}
              >
                <PiggyBank size={20} className="mr-3" />
                <span>Criptomoedas</span>
              </Link>
            </li>
            <li>
              <Link
                to="/settings"
                className={`flex items-center px-4 py-3 rounded-lg transition-all ${
                  isActive('/settings')
                    ? 'bg-bank-teal text-white'
                    : 'hover:bg-gray-100'
                }`}
              >
                <Settings size={20} className="mr-3" />
                <span>Configurações</span>
              </Link>
            </li>
          </ul>
          
          <div className="absolute bottom-5 left-0 w-full px-5">
            <button
              onClick={logout}
              className="flex items-center px-4 py-3 w-full text-red-500 hover:bg-red-50 rounded-lg transition-all"
            >
              <LogOut size={20} className="mr-3" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-30 bg-white shadow-sm">
        <div className="flex justify-between items-center px-4 h-16">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full flex items-center justify-center">
              <img src="/lovable-uploads/7a1d6d34-d74c-48e2-b662-b22ecf0a5a3d.png" alt="AIBANK Logo" className="w-7 h-7" />
            </div>
            <h1 className="ml-2 text-lg font-bold">AIBANK</h1>
          </div>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-gray-600 hover:text-bank-teal transition-colors"
          >
            <div className="w-6 h-5 flex flex-col justify-between">
              <span className={`h-0.5 w-full bg-current transform transition-all ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`h-0.5 w-full bg-current transition-all ${isMenuOpen ? 'opacity-0' : ''}`} />
              <span className={`h-0.5 w-full bg-current transform transition-all ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </div>
          </button>
        </div>
        
        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="absolute top-16 left-0 right-0 bg-white shadow-md animate-slide-in-right z-40">
            <div className="p-4">
              <button
                onClick={logout}
                className="flex items-center w-full px-4 py-3 text-red-500 hover:bg-red-50 rounded-lg"
              >
                <LogOut size={20} className="mr-3" />
                <span>Sair da conta</span>
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  );
};

export default AppNav;
